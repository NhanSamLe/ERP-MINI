export type AnomalySeverity = "low" | "medium" | "high" | "critical";

export type RiskLevel = "low_risk" | "medium_risk" | "high_risk";

export type AnomalyFlagType =
  | "price_outlier_zscore"
  | "price_outlier_iqr"
  | "quantity_outlier_zscore"
  | "quantity_outlier_5x"
  | "invalid_quantity"
  | "subtotal_mismatch"
  | "total_mismatch"
  | "line_amount_mismatch"
  | "approval_threshold_proximity"
  | "high_frequency_invoicing"
  | "round_number_no_detail"
  | "rejected_pattern_match"
  | "period_end_spike"
  | "new_vendor"
  | "dormant_vendor_reactivation"
  | "weekend_high_value"
  | "future_dated_invoice"
  | "stale_invoice"
  | "vendor_tax_code_change"
  | "multivariate_outlier"
  | "insufficient_data";

export interface AnomalyFlag {
  type: AnomalyFlagType;
  severity: AnomalySeverity;
  description: string;
  lineItemIndex?: number;
  metadata?: Record<string, any>;
}

export interface AnomalyResult {
  flags: AnomalyFlag[];
  risk_score: number;
  risk_level: RiskLevel;
  math_consistent: boolean;
  analyzed_at: Date;
  analysis_duration_ms: number;
  skipped_reasons?: string[];
}

export interface VendorProfile {
  vendorTaxCode: string;
  productName: string;
  branchId: number;
  priceStats: {
    mean: number;
    std: number;
    q1: number;
    q3: number;
    iqr: number;
    count: number;
  };
  quantityStats: {
    mean: number;
    std: number;
    q1: number;
    q3: number;
    iqr: number;
    count: number;
  };
  cachedAt: Date;
}

export interface ThresholdConfig {
  branchId: number;
  zScoreThreshold: number;
  iqrMultiplier: number;
  frequencyThresholdPerHour: number;
  approvalThresholdVnd: number;
  highRiskScoreThreshold: number;
  mediumRiskScoreThreshold: number;
}

export interface RiskScoreResult {
  score: number;
  level: RiskLevel;
}

export interface AnomalyQueryFilters {
  riskLevel?: RiskLevel;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface BranchAnomalyStats {
  totalByRiskLevel: Record<RiskLevel, number>;
  topFlagTypes: Array<{ type: AnomalyFlagType; count: number }>;
  weeklyTrend: Array<{ week: string; avgRiskScore: number; count: number }>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
