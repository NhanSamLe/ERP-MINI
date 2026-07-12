// documentIntelligence.types.ts

// =====================
// OCR Line Item
// =====================
export interface OcrLineItem {
  name: string;
  qty: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  discount_percent?: number;
  discount_amount?: number;
  amount: number;
  confidence: number;
  needsReview?: boolean;
}

// =====================
// OCR Invoice Data
// =====================
export interface OcrInvoiceData {
  vendor_name: string;
  vendor_tax_code: string;
  invoice_no: string;
  invoice_series?: string;
  invoice_template?: string;
  invoice_date: string;
  items: OcrLineItem[];
  subtotal: number;
  discount_amount?: number;
  tax_amount: number;
  total: number;
  confidence_scores?: Record<string, number>;
  overall_confidence: number;
  warnings: string[];
}

// =====================
// Document
// =====================
export interface InvoiceDocument {
  id: number;
  original_filename: string;
  ocr_status: OcrStatus;
  ocr_confidence: number | null;
  ocr_result: OcrInvoiceData | null;
  created_at: string;
  updated_at?: string;
}

// =====================
// Status
// =====================
export type OcrStatus = "pending" | "processing" | "done" | "failed";

export interface StatusResponse {
  status: OcrStatus;
  confidence?: number;
  fieldsExtracted?: number;
  fieldsTotal?: number;
  warnings?: string[];
  message?: string;
}

// =====================
// Vendor / Product Match
// =====================
export interface VendorMatch {
  matchedPartnerId: number | null;
  matchConfidence: number;
  matchMethod: string;
  partnerName?: string;
}

export interface ProductMatch {
  lineIndex: number;
  matchedProductId: number | null;
  matchConfidence: number;
  matchMethod: string;
}

export interface DuplicateWarning {
  existingInvoiceId: number;
  existingInvoiceNo: string;
  message: string;
}

// =====================
// Anomaly Detection
// =====================
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
  analyzed_at: string;
  analysis_duration_ms: number;
  skipped_reasons?: string[];
}

export interface AnomalyQueryFilters {
  risk_level?: RiskLevel;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface AnomalyListItem {
  id: number;
  document_id: number;
  risk_score: number;
  risk_level: RiskLevel;
  flags: AnomalyFlag[];
  math_consistent: boolean;
  analyzed_at: string;
  document?: {
    id: number;
    original_filename: string;
    ocr_status: string;
  };
}

export interface AnomalyPaginatedResult {
  data: AnomalyListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface BranchAnomalyStats {
  totalByRiskLevel: Record<RiskLevel, number>;
  topFlagTypes: Array<{ type: AnomalyFlagType; count: number }>;
  weeklyTrend: Array<{ week: string; avgRiskScore: number; count: number }>;
}

export interface AnomalyThresholdConfig {
  branchId: number;
  zScoreThreshold: number;
  iqrMultiplier: number;
  frequencyThresholdPerHour: number;
  approvalThresholdVnd: number;
  highRiskScoreThreshold: number;
  mediumRiskScoreThreshold: number;
}

// =====================
// Enriched Result
// =====================
export interface EnrichedResult {
  document: InvoiceDocument;
  vendor_match: VendorMatch | null;
  product_matches: ProductMatch[];
  duplicateWarning: DuplicateWarning | null;
  anomaly_result: AnomalyResult | null;
  warnings: string[];
}

// =====================
// Confirm Payload
// =====================
export interface ConfirmLineItem {
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate_id: number | null;
  uom_id?: number | null;
  po_line_id?: number | null;
  discount_percent?: number;
  discount_amount?: number;
}

export interface ConfirmPayload {
  vendor_id: number | null;
  po_id: number | null;
  overrideDuplicate: boolean;
  currency_id?: number | null;
  exchange_rate?: number;
  payment_term_id?: number | null;
  discount_amount?: number;
  items: ConfirmLineItem[];
}

// =====================
// Duplicate Check
// =====================
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingInvoiceId?: number;
  existingInvoiceNo?: string;
  message?: string;
}

// =====================
// History
// =====================
export interface HistoryItem {
  id: number;
  original_filename: string;
  ocr_status: OcrStatus;
  ocr_confidence: number | null;
  created_at: string;
  ocr_result?: OcrInvoiceData | null;
}

export interface HistoryParams {
  page?: number;
  limit?: number;
  ocr_status?: string;
  date_from?: string;
  date_to?: string;
}

export interface HistoryResponse {
  data: HistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =====================
// Three-Way Matching
// =====================
export interface ThreeWayMatchResult {
  invoiceId: number;
  status: string;
  details: Record<string, any>;
}

export interface MatchingResult {
  matching_status: string | null;
  matching_details: Record<string, any> | null;
}

// =====================
// Redux State
// =====================
export interface DocumentIntelligenceState {
  uploading: boolean;
  currentDocumentId: number | null;
  status: StatusResponse | null;
  result: EnrichedResult | null;
  history: HistoryItem[];
  historyTotal: number;
  loading: boolean;
  error: string | null;
}
