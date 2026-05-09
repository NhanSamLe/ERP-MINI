import {
  AnomalyFlag,
  AnomalySeverity,
  RiskLevel,
  RiskScoreResult,
  ThresholdConfig,
} from "../../types/anomaly.types";

/**
 * Severity weights used in the risk score formula.
 * Requirements 7.2: critical → 0.4, high → 0.25, medium → 0.1, low → 0.05
 */
const SEVERITY_WEIGHTS: Record<AnomalySeverity, number> = {
  critical: 0.4,
  high: 0.25,
  medium: 0.1,
  low: 0.05,
};

/**
 * Calculates a composite Risk Score from a list of AnomalyFlags and classifies
 * the result into a RiskLevel based on configurable thresholds.
 *
 * This is a pure, synchronous calculator — no side effects, no async.
 */
export class RiskScoreCalculator {
  /**
   * Calculate the risk score and level from a set of anomaly flags.
   *
   * Formula (Requirements 7.2):
   *   score = min(sum(weight[flag.severity] for each flag), 1.0)
   *
   * Classification (Requirements 7.3, 7.4, 7.5):
   *   score >= config.highRiskScoreThreshold  → "high_risk"
   *   score >= config.mediumRiskScoreThreshold → "medium_risk"
   *   score <  config.mediumRiskScoreThreshold → "low_risk"
   *
   * @param flags  - List of anomaly flags detected for an invoice
   * @param config - Branch-specific threshold configuration
   * @returns RiskScoreResult with score (4 decimal places) and level
   */
  calculate(flags: AnomalyFlag[], config: ThresholdConfig): RiskScoreResult {
    // Sum weighted contributions from all flags
    const rawSum = flags.reduce((sum, flag) => {
      return sum + (SEVERITY_WEIGHTS[flag.severity] ?? 0);
    }, 0);

    // Cap at 1.0 and round to 4 decimal places to avoid floating-point drift
    const score = Math.round(Math.min(rawSum, 1.0) * 10000) / 10000;

    // Classify risk level based on configurable thresholds
    const level = this.classifyLevel(score, config);

    return { score, level };
  }

  private classifyLevel(score: number, config: ThresholdConfig): RiskLevel {
    if (score >= config.highRiskScoreThreshold) {
      return "high_risk";
    }
    if (score >= config.mediumRiskScoreThreshold) {
      return "medium_risk";
    }
    return "low_risk";
  }
}
