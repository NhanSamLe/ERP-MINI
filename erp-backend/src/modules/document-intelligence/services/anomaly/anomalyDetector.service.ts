import {
  AnomalyFlag,
  AnomalyResult,
  RiskLevel,
} from "../../types/anomaly.types";
import { OcrInvoiceData } from "../../types/ocr.types";
import { MathConsistencyChecker } from "./mathConsistency.checker";
import { StatisticalAnalyzer } from "./statistical.analyzer";
import { FraudPatternDetector } from "./fraudPattern.detector";
import { BehavioralAnomalyDetector } from "./behavioral.detector";
import { IsolationForestAnalyzer } from "./isolationForest.analyzer";
import { RiskScoreCalculator } from "./riskScore.calculator";
import { ThresholdConfigService } from "./thresholdConfig.service";
import { logger } from "../../../../config/logger";

/** Total analysis timeout in milliseconds (Requirement 8.6, 12.1) */
const TOTAL_ANALYSIS_TIMEOUT_MS = 2000;

/** Flag types that indicate a math inconsistency */
const MATH_INCONSISTENCY_TYPES = new Set([
  "subtotal_mismatch",
  "total_mismatch",
  "line_amount_mismatch",
]);

/**
 * AnomalyDetectorService orchestrates all anomaly analyzers and produces
 * a single AnomalyResult for an OCR-processed invoice.
 *
 * Design principles:
 * - Fail-safe: each analyzer is wrapped in try-catch; failures are logged
 *   and recorded in skipped_reasons without interrupting the pipeline.
 * - Deduplication: flags with the same (type, lineItemIndex) are deduplicated,
 *   keeping the highest severity occurrence (Requirement 11.4, Property 9).
 * - Timeout: the entire analysis is bounded by TOTAL_ANALYSIS_TIMEOUT_MS.
 *   If the timeout fires, a partial result is returned with whatever flags
 *   were collected up to that point.
 * - math_consistent: derived from the absence of math-related flags (Req 3.6).
 *
 * Requirements: 8.1–8.6, 11.3, 11.4, 12.1
 */
export class AnomalyDetectorService {
  constructor(
    private readonly mathChecker: MathConsistencyChecker,
    private readonly statisticalAnalyzer: StatisticalAnalyzer,
    private readonly fraudDetector: FraudPatternDetector,
    private readonly behavioralDetector: BehavioralAnomalyDetector,
    private readonly isolationForest: IsolationForestAnalyzer,
    private readonly riskCalculator: RiskScoreCalculator,
    private readonly configService: ThresholdConfigService,
  ) {}

  /**
   * Analyze an OCR invoice for anomalies.
   *
   * Steps:
   * 1. Load branch threshold config
   * 2. Run all analyzers concurrently (with individual try-catch)
   * 3. Deduplicate flags
   * 4. Calculate risk score
   * 5. Return AnomalyResult
   *
   * The entire operation is bounded by TOTAL_ANALYSIS_TIMEOUT_MS.
   * On timeout, a partial result is returned.
   */
  async analyze(
    ocrData: OcrInvoiceData,
    documentId: number,
    branchId: number,
    processingDate: Date,
  ): Promise<AnomalyResult> {
    const startTime = Date.now();

    const analysisPromise = this.runAnalysis(
      ocrData,
      documentId,
      branchId,
      processingDate,
      startTime,
    );

    const timeoutPromise = new Promise<AnomalyResult>((resolve) =>
      setTimeout(() => {
        logger.warn(
          `AnomalyDetectorService: analysis timed out after ${TOTAL_ANALYSIS_TIMEOUT_MS}ms for document ${documentId}`,
        );
        resolve(this.buildResult([], ["analysis_timeout"], startTime));
      }, TOTAL_ANALYSIS_TIMEOUT_MS),
    );

    return Promise.race([analysisPromise, timeoutPromise]);
  }

  // ---------------------------------------------------------------------------
  // Internal: run all analyzers and aggregate results
  // ---------------------------------------------------------------------------

  private async runAnalysis(
    ocrData: OcrInvoiceData,
    documentId: number,
    branchId: number,
    processingDate: Date,
    startTime: number,
  ): Promise<AnomalyResult> {
    const allFlags: AnomalyFlag[] = [];
    const skippedReasons: string[] = [];

    // 1. Load config (fail-safe: use defaults on error)
    let config = await this.configService.getConfig(branchId).catch((err) => {
      logger.error(
        `AnomalyDetectorService: failed to load config for branch ${branchId}: ${err.message}`,
      );
      return this.configService.getConfig(0).catch(() => ({
        branchId,
        zScoreThreshold: 3.0,
        iqrMultiplier: 1.5,
        frequencyThresholdPerHour: 3,
        approvalThresholdVnd: 0,
        highRiskScoreThreshold: 0.7,
        mediumRiskScoreThreshold: 0.4,
      }));
    });

    // 2. Math consistency check (synchronous, no DB — always run first)
    try {
      const mathFlags = this.mathChecker.check(ocrData);
      allFlags.push(...mathFlags);
    } catch (err: any) {
      logger.error(
        `AnomalyDetectorService: MathConsistencyChecker failed for document ${documentId}: ${err.message}`,
      );
      skippedReasons.push("math_check_error");
    }

    // 3. Run async analyzers concurrently
    const [statsResult, fraudFlags, behavioralFlags, isolationResult] =
      await Promise.all([
        // Statistical analysis (prices + quantities)
        this.runStatisticalAnalysis(ocrData, branchId, config, documentId),
        // Fraud pattern detection
        this.runFraudDetection(ocrData, branchId, config, documentId),
        // Behavioral anomaly detection
        this.runBehavioralDetection(
          ocrData,
          branchId,
          processingDate,
          documentId,
        ),
        // Isolation Forest multivariate analysis
        this.runIsolationForest(ocrData, branchId, documentId),
      ]);

    // Merge stats results
    allFlags.push(...statsResult.flags);
    skippedReasons.push(...statsResult.skippedReasons);

    // Merge fraud flags
    allFlags.push(...fraudFlags);

    // Merge behavioral flags
    allFlags.push(...behavioralFlags);

    // Merge isolation forest results
    allFlags.push(...isolationResult.flags);
    skippedReasons.push(...isolationResult.skippedReasons);

    // 4. Deduplicate flags
    const dedupedFlags = this.deduplicateFlags(allFlags);

    return this.buildResult(dedupedFlags, skippedReasons, startTime, config);
  }

  // ---------------------------------------------------------------------------
  // Individual analyzer runners (each fail-safe)
  // ---------------------------------------------------------------------------

  private async runStatisticalAnalysis(
    ocrData: OcrInvoiceData,
    branchId: number,
    config: any,
    documentId: number,
  ): Promise<{ flags: AnomalyFlag[]; skippedReasons: string[] }> {
    const flags: AnomalyFlag[] = [];
    const skippedReasons: string[] = [];

    try {
      const priceResult = await this.statisticalAnalyzer.analyzePrices(
        ocrData.items,
        ocrData.vendor_tax_code,
        branchId,
        config,
      );
      flags.push(...priceResult.flags);
      skippedReasons.push(...priceResult.skippedReasons);
    } catch (err: any) {
      logger.error(
        `AnomalyDetectorService: StatisticalAnalyzer.analyzePrices failed for document ${documentId}: ${err.message}`,
      );
      skippedReasons.push("statistical_price_error");
    }

    try {
      const qtyResult = await this.statisticalAnalyzer.analyzeQuantities(
        ocrData.items,
        ocrData.vendor_tax_code,
        branchId,
        config,
      );
      flags.push(...qtyResult.flags);
      skippedReasons.push(...qtyResult.skippedReasons);
    } catch (err: any) {
      logger.error(
        `AnomalyDetectorService: StatisticalAnalyzer.analyzeQuantities failed for document ${documentId}: ${err.message}`,
      );
      skippedReasons.push("statistical_quantity_error");
    }

    return { flags, skippedReasons };
  }

  private async runFraudDetection(
    ocrData: OcrInvoiceData,
    branchId: number,
    config: any,
    documentId: number,
  ): Promise<AnomalyFlag[]> {
    try {
      return await this.fraudDetector.detect(ocrData, branchId, config);
    } catch (err: any) {
      logger.error(
        `AnomalyDetectorService: FraudPatternDetector failed for document ${documentId}: ${err.message}`,
      );
      return [];
    }
  }

  private async runBehavioralDetection(
    ocrData: OcrInvoiceData,
    branchId: number,
    processingDate: Date,
    documentId: number,
  ): Promise<AnomalyFlag[]> {
    try {
      return await this.behavioralDetector.detect(
        ocrData,
        branchId,
        processingDate,
      );
    } catch (err: any) {
      logger.error(
        `AnomalyDetectorService: BehavioralAnomalyDetector failed for document ${documentId}: ${err.message}`,
      );
      return [];
    }
  }

  private async runIsolationForest(
    ocrData: OcrInvoiceData,
    branchId: number,
    documentId: number,
  ): Promise<{ flags: AnomalyFlag[]; skippedReasons: string[] }> {
    try {
      return await this.isolationForest.analyze(
        ocrData,
        ocrData.vendor_tax_code,
        branchId,
      );
    } catch (err: any) {
      logger.error(
        `AnomalyDetectorService: IsolationForestAnalyzer failed for document ${documentId}: ${err.message}`,
      );
      return { flags: [], skippedReasons: ["isolation_forest_error"] };
    }
  }

  // ---------------------------------------------------------------------------
  // Deduplication (Requirement 11.4, Property 9)
  // ---------------------------------------------------------------------------

  /**
   * Remove duplicate flags with the same (type, lineItemIndex).
   * When duplicates exist, keep the one with the highest severity.
   */
  deduplicateFlags(flags: AnomalyFlag[]): AnomalyFlag[] {
    const severityOrder: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    // Key: `${type}:${lineItemIndex ?? 'global'}`
    const best = new Map<string, AnomalyFlag>();

    for (const flag of flags) {
      const key = `${flag.type}:${flag.lineItemIndex ?? "global"}`;
      const existing = best.get(key);
      if (
        !existing ||
        (severityOrder[flag.severity] ?? 0) >
          (severityOrder[existing.severity] ?? 0)
      ) {
        best.set(key, flag);
      }
    }

    return Array.from(best.values());
  }

  // ---------------------------------------------------------------------------
  // Result builder
  // ---------------------------------------------------------------------------

  private buildResult(
    flags: AnomalyFlag[],
    skippedReasons: string[],
    startTime: number,
    config?: any,
  ): AnomalyResult {
    const effectiveConfig = config ?? {
      highRiskScoreThreshold: 0.7,
      mediumRiskScoreThreshold: 0.4,
    };

    const riskResult = this.riskCalculator.calculate(flags, effectiveConfig);

    const mathConsistent = !flags.some((f) =>
      MATH_INCONSISTENCY_TYPES.has(f.type),
    );

    return {
      flags,
      risk_score: riskResult.score,
      risk_level: riskResult.level,
      math_consistent: mathConsistent,
      analyzed_at: new Date(),
      analysis_duration_ms: Date.now() - startTime,
      skipped_reasons: skippedReasons.length > 0 ? skippedReasons : undefined,
    };
  }
}
