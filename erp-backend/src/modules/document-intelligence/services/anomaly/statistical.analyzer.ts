import { Op } from "sequelize";
import { ApInvoice } from "../../../purchase/models/apInvoice.model";
import { ApInvoiceLine } from "../../../purchase/models/apInvoiceLine.model";
import {
  AnomalyFlag,
  ThresholdConfig,
  VendorProfile,
} from "../../types/anomaly.types";
import { OcrLineItem } from "../../types/ocr.types";

/** Cache TTL: 5 minutes in milliseconds */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Minimum number of historical records required for statistical analysis */
const MIN_RECORDS_FOR_ANALYSIS = 5;

/** Timeout for DB queries in milliseconds */
const DB_QUERY_TIMEOUT_MS = 1000;

/** Extreme IQR multiplier for critical severity */
const EXTREME_IQR_MULTIPLIER = 3.0;

/**
 * Computes the mean of an array of numbers.
 */
function computeMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Computes the population standard deviation of an array of numbers.
 */
function computeStd(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Computes a percentile value using linear interpolation.
 * @param sorted - Sorted array of numbers (ascending)
 * @param p - Percentile in [0, 100]
 */
function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0] ?? 0;

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  return (
    (sorted[lower] ?? 0) +
    fraction * ((sorted[upper] ?? 0) - (sorted[lower] ?? 0))
  );
}

/**
 * Computes descriptive statistics for an array of numbers.
 */
function computeStats(values: number[]): {
  mean: number;
  std: number;
  q1: number;
  q3: number;
  iqr: number;
  count: number;
} {
  const count = values.length;
  if (count === 0) {
    return { mean: 0, std: 0, q1: 0, q3: 0, iqr: 0, count: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = computeMean(values);
  const std = computeStd(values, mean);
  const q1 = computePercentile(sorted, 25);
  const q3 = computePercentile(sorted, 75);
  const iqr = q3 - q1;

  return { mean, std, q1, q3, iqr, count };
}

/**
 * StatisticalAnalyzer performs Z-score and IQR-based anomaly detection
 * on invoice line item prices and quantities, using historical data from
 * ap_invoice_lines joined with ap_invoices.
 *
 * An in-memory cache (Map) stores VendorProfile results with a 5-minute TTL
 * to reduce repeated DB queries for the same vendor/product/branch combination.
 *
 * Requirements: 1.1–1.6, 2.1–2.5, 12.4, 12.5
 */
export class StatisticalAnalyzer {
  /** In-memory cache: key → { profile, expiresAt } */
  private readonly cache = new Map<
    string,
    { profile: VendorProfile; expiresAt: number }
  >();

  /**
   * Analyze prices of invoice line items against historical baselines.
   *
   * For each item:
   * - Fetches VendorProfile (cached, with DB timeout)
   * - Skips if < 5 historical records (records in skippedReasons)
   * - Flags Z-score outliers as `price_outlier_zscore` severity `high`
   * - Flags IQR outliers as `price_outlier_iqr` severity `medium` or `critical`
   *
   * @returns { flags, skippedReasons }
   */
  async analyzePrices(
    items: OcrLineItem[],
    vendorTaxCode: string,
    branchId: number,
    config: ThresholdConfig,
  ): Promise<{ flags: AnomalyFlag[]; skippedReasons: string[] }> {
    const flags: AnomalyFlag[] = [];
    const skippedReasons: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;

      const { profile, timedOut } = await this.getVendorProfileWithTimeout(
        vendorTaxCode,
        item.name,
        branchId,
      );

      if (timedOut) {
        if (!skippedReasons.includes("statistical_timeout")) {
          skippedReasons.push("statistical_timeout");
        }
        continue;
      }

      if (!profile || profile.priceStats.count < MIN_RECORDS_FOR_ANALYSIS) {
        skippedReasons.push(`insufficient_data:${item.name}`);
        continue;
      }

      const { mean, std, q1, q3, iqr } = profile.priceStats;
      const price = item.unit_price;

      // Z-score check
      if (std > 0) {
        const zScore = (price - mean) / std;
        if (Math.abs(zScore) > config.zScoreThreshold) {
          const deviationPct = (((price - mean) / mean) * 100).toFixed(2);
          flags.push({
            type: "price_outlier_zscore",
            severity: "high",
            description: `Price ${price} deviates ${deviationPct}% from historical mean ${mean.toFixed(2)} (Z-score: ${zScore.toFixed(2)})`,
            lineItemIndex: i,
            metadata: {
              zScore: parseFloat(zScore.toFixed(4)),
              mean,
              std,
              deviation_pct: deviationPct,
            },
          });
        }
      }

      // IQR check
      const lowerBound = q1 - config.iqrMultiplier * iqr;
      const upperBound = q3 + config.iqrMultiplier * iqr;
      const extremeLower = q1 - EXTREME_IQR_MULTIPLIER * iqr;
      const extremeUpper = q3 + EXTREME_IQR_MULTIPLIER * iqr;

      if (price < extremeLower || price > extremeUpper) {
        flags.push({
          type: "price_outlier_iqr",
          severity: "critical",
          description: `Price ${price} is outside extreme IQR bounds [${extremeLower.toFixed(2)}, ${extremeUpper.toFixed(2)}]`,
          lineItemIndex: i,
          metadata: {
            q1,
            q3,
            iqr,
            lowerBound,
            upperBound,
            extremeLower,
            extremeUpper,
          },
        });
      } else if (price < lowerBound || price > upperBound) {
        flags.push({
          type: "price_outlier_iqr",
          severity: "medium",
          description: `Price ${price} is outside IQR bounds [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`,
          lineItemIndex: i,
          metadata: { q1, q3, iqr, lowerBound, upperBound },
        });
      }
    }

    return { flags, skippedReasons };
  }

  /**
   * Analyze quantities of invoice line items against historical baselines.
   *
   * For each item:
   * - Flags qty <= 0 as `invalid_quantity` severity `critical` (always, no history needed)
   * - Fetches VendorProfile (cached, with DB timeout)
   * - Skips if < 5 historical records
   * - Flags qty > 5× mean as `quantity_outlier_5x` severity `high`
   * - Flags Z-score outliers as `quantity_outlier_zscore` severity `medium`
   *
   * @returns { flags, skippedReasons }
   */
  async analyzeQuantities(
    items: OcrLineItem[],
    vendorTaxCode: string,
    branchId: number,
    config: ThresholdConfig,
  ): Promise<{ flags: AnomalyFlag[]; skippedReasons: string[] }> {
    const flags: AnomalyFlag[] = [];
    const skippedReasons: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;

      // Always check for invalid quantity regardless of history
      if (item.qty <= 0) {
        flags.push({
          type: "invalid_quantity",
          severity: "critical",
          description: `Quantity ${item.qty} is invalid (must be > 0)`,
          lineItemIndex: i,
          metadata: { qty: item.qty },
        });
        continue;
      }

      const { profile, timedOut } = await this.getVendorProfileWithTimeout(
        vendorTaxCode,
        item.name,
        branchId,
      );

      if (timedOut) {
        if (!skippedReasons.includes("statistical_timeout")) {
          skippedReasons.push("statistical_timeout");
        }
        continue;
      }

      if (!profile || profile.quantityStats.count < MIN_RECORDS_FOR_ANALYSIS) {
        skippedReasons.push(`insufficient_data:${item.name}`);
        continue;
      }

      const { mean, std } = profile.quantityStats;
      const qty = item.qty;

      // 5× mean check
      if (mean > 0 && qty > 5 * mean) {
        flags.push({
          type: "quantity_outlier_5x",
          severity: "high",
          description: `Quantity ${qty} exceeds 5× historical mean ${mean.toFixed(2)}`,
          lineItemIndex: i,
          metadata: { qty, mean, ratio: parseFloat((qty / mean).toFixed(2)) },
        });
      }

      // Z-score check
      if (std > 0) {
        const zScore = (qty - mean) / std;
        if (Math.abs(zScore) > config.zScoreThreshold) {
          flags.push({
            type: "quantity_outlier_zscore",
            severity: "medium",
            description: `Quantity ${qty} deviates significantly from historical mean ${mean.toFixed(2)} (Z-score: ${zScore.toFixed(2)})`,
            lineItemIndex: i,
            metadata: {
              zScore: parseFloat(zScore.toFixed(4)),
              mean,
              std,
            },
          });
        }
      }
    }

    return { flags, skippedReasons };
  }

  /**
   * Wraps getVendorProfile with a 1000ms timeout.
   * Returns { profile, timedOut } — timedOut=true if the query exceeded the limit.
   */
  private async getVendorProfileWithTimeout(
    vendorTaxCode: string,
    productName: string,
    branchId: number,
  ): Promise<{ profile: VendorProfile | null; timedOut: boolean }> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("statistical_timeout")),
        DB_QUERY_TIMEOUT_MS,
      ),
    );

    try {
      const profile = await Promise.race([
        this.getVendorProfile(vendorTaxCode, productName, branchId),
        timeoutPromise,
      ]);
      return { profile, timedOut: false };
    } catch (err: any) {
      if (err?.message === "statistical_timeout") {
        return { profile: null, timedOut: true };
      }
      // Other DB errors — treat as no data
      return { profile: null, timedOut: false };
    }
  }

  /**
   * Fetches (or returns cached) VendorProfile for the given vendor/product/branch.
   *
   * Cache key: `${vendorTaxCode}:${productName}:${branchId}`
   * Cache TTL: 5 minutes
   *
   * Queries ap_invoice_lines JOIN ap_invoices:
   * - ap_invoices.branch_id = branchId
   * - ap_invoices.status NOT IN ('cancelled', 'draft')
   * - ap_invoice_lines.description ILIKE %productName% (case-insensitive)
   * - Also tries to match vendor via ap_invoices.tax_code = vendorTaxCode
   *
   * @returns VendorProfile or null if no data found
   */
  private async getVendorProfile(
    vendorTaxCode: string,
    productName: string,
    branchId: number,
  ): Promise<VendorProfile | null> {
    const cacheKey = `${vendorTaxCode}:${productName}:${branchId}`;
    const now = Date.now();

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.profile;
    }

    // Query historical data
    const lines = await ApInvoiceLine.findAll({
      include: [
        {
          model: ApInvoice,
          as: "invoice",
          where: {
            branch_id: branchId,
            status: { [Op.notIn]: ["cancelled", "draft"] },
            ...(vendorTaxCode ? { tax_code: vendorTaxCode } : {}),
          },
          required: true,
        },
      ],
      where: {
        description: { [Op.like]: `%${productName}%` },
      },
    });

    if (lines.length === 0) {
      // Cache null result to avoid repeated empty queries
      const profile: VendorProfile = {
        vendorTaxCode,
        productName,
        branchId,
        priceStats: { mean: 0, std: 0, q1: 0, q3: 0, iqr: 0, count: 0 },
        quantityStats: { mean: 0, std: 0, q1: 0, q3: 0, iqr: 0, count: 0 },
        cachedAt: new Date(),
      };
      this.cache.set(cacheKey, { profile, expiresAt: now + CACHE_TTL_MS });
      return profile;
    }

    const prices = lines
      .map((l) => Number(l.unit_price))
      .filter((v) => !isNaN(v) && v > 0);

    const quantities = lines
      .map((l) => Number(l.quantity))
      .filter((v) => !isNaN(v) && v > 0);

    const profile: VendorProfile = {
      vendorTaxCode,
      productName,
      branchId,
      priceStats: computeStats(prices),
      quantityStats: computeStats(quantities),
      cachedAt: new Date(),
    };

    this.cache.set(cacheKey, { profile, expiresAt: now + CACHE_TTL_MS });
    return profile;
  }

  /**
   * Clears the in-memory cache. Useful for testing.
   */
  clearCache(): void {
    this.cache.clear();
  }
}
