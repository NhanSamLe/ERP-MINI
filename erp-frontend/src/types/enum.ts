// =====================
// AUTH & USER
// =====================
export type UserStatus = "active" | "inactive";
export type BranchStatus = "active" | "inactive";

export type PartnerType = "customer" | "supplier" | "internal";
export type PartnerStatus = "active" | "inactive";

// =====================
// CRM
// =====================
export type LeadStage = "new" | "qualified" | "lost";

export type OpportunityStage =
  | "prospecting"
  | "negotiation"
  | "won"
  | "lost";

export type ActivityRelatedType =
  | "lead"
  | "opportunity"
  | "customer";

export type ActivityType =
  | "call"
  | "email"
  | "meeting"
  | "task";

// =====================
// SALES & AR
// =====================
export type SaleOrderStatus =
  | "draft"
  | "confirmed"
  | "shipped"
  | "completed"
  | "cancelled";

export type ArInvoiceStatus =
  | "draft"
  | "posted"
  | "paid"
  | "cancelled";

export type ArReceiptMethod =
  | "cash"
  | "bank"
  | "transfer";

export type ArReceiptStatus =
  | "draft"
  | "posted";

// =====================
// PURCHASE & AP
// =====================
export type PurchaseOrderStatus =
  | "draft"
  | "confirmed"
  | "received"
  | "cancelled";

export type ApInvoiceStatus =
  | "draft"
  | "posted"
  | "paid"
  | "cancelled";

export type ApPaymentMethod =
  | "cash"
  | "bank"
  | "transfer";

export type ApPaymentStatus =
  | "draft"
  | "posted";

// =====================
// INVENTORY / SCM
// =====================
export type StockMoveType =
  | "receipt"
  | "issue"
  | "transfer"
  | "adjustment";

export type StockMoveStatus =
  | "draft"
  | "posted"
  | "cancelled";

// =====================
// HRM
// =====================
export type Gender =
  | "male"
  | "female"
  | "other";

export type ContractType =
  | "trial"
  | "official"
  | "seasonal";

export type EmployeeStatus =
  | "active"
  | "inactive";

export type PayrollPeriodStatus =
  | "open"
  | "processed"
  | "closed";

export type PayrollRunStatus =
  | "draft"
  | "posted";

// =====================
// FINANCE & GL
// =====================
export type GlAccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

export type NormalSide =
  | "debit"
  | "credit";

export type GlEntryStatus =
  | "draft"
  | "posted";

// =====================
// TAX
// =====================
export type TaxType =
  | "VAT"
  | "CIT"
  | "PIT"
  | "IMPORT"
  | "EXPORT"
  | "EXCISE"
  | "ENVIRONMENTAL"
  | "OTHER";

export type AppliesTo =
  | "sale"
  | "purchase"
  | "both";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "Not Started" | "In Progress" | "Completed";

export type EmailDirection = "in" | "out";

export type ActivityStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type ResultType =
  | "connected"
  | "no_answer"
  | "busy"
  | "failed"
  | "call_back"
  | "wrong_number";