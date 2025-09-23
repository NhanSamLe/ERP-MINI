// =====================
// AUTH & USER
// =====================
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum BranchStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}
export enum PartnerType {
  CUSTOMER = "customer",
  SUPPLIER = "supplier",
  INTERNAL = "internal"
}
export enum PartnerStatus {
  ACTIVE = "active",
  INACTIVE = "inactive"
}
// =====================
// CRM
// =====================
export enum LeadStage {
  NEW = "new",
  QUALIFIED = "qualified",
  LOST = "lost",
}

export enum OpportunityStage {
  PROSPECTING = "prospecting",
  NEGOTIATION = "negotiation",
  WON = "won",
  LOST = "lost",
}

export enum ActivityRelatedType {
  LEAD = "lead",
  OPPORTUNITY = "opportunity",
  CUSTOMER = "customer",
}

export enum ActivityType {
  CALL = "call",
  EMAIL = "email",
  MEETING = "meeting",
  TASK = "task",
}

// =====================
// SALES & AR
// =====================
export enum SaleOrderStatus {
  DRAFT = "draft",
  CONFIRMED = "confirmed",
  SHIPPED = "shipped",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ArInvoiceStatus {
  DRAFT = "draft",
  POSTED = "posted",
  PAID = "paid",
  CANCELLED = "cancelled",
}

export enum ArReceiptMethod {
  CASH = "cash",
  BANK = "bank",
  TRANSFER = "transfer",
}

export enum ArReceiptStatus {
  DRAFT = "draft",
  POSTED = "posted",
}

// =====================
// PURCHASE & AP
// =====================
export enum PurchaseOrderStatus {
  DRAFT = "draft",
  CONFIRMED = "confirmed",
  RECEIVED = "received",
  CANCELLED = "cancelled",
}

export enum ApInvoiceStatus {
  DRAFT = "draft",
  POSTED = "posted",
  PAID = "paid",
  CANCELLED = "cancelled",
}

export enum ApPaymentMethod {
  CASH = "cash",
  BANK = "bank",
  TRANSFER = "transfer",
}

export enum ApPaymentStatus {
  DRAFT = "draft",
  POSTED = "posted",
}

// =====================
// INVENTORY / SCM
// =====================
export enum StockMoveType {
  RECEIPT = "receipt",
  ISSUE = "issue",
  TRANSFER = "transfer",
  ADJUSTMENT = "adjustment",
}

export enum StockMoveStatus {
  DRAFT = "draft",
  POSTED = "posted",
  CANCELLED = "cancelled",
}

// =====================
// HRM
// =====================
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum ContractType {
  TRIAL = "trial",
  OFFICIAL = "official",
  SEASONAL = "seasonal",
}

export enum EmployeeStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum PayrollPeriodStatus {
  OPEN = "open",
  PROCESSED = "processed",
  CLOSED = "closed",
}

export enum PayrollRunStatus {
  DRAFT = "draft",
  POSTED = "posted",
}

// =====================
// FINANCE & GL
// =====================
export enum GlAccountType {
  ASSET = "asset",
  LIABILITY = "liability",
  EQUITY = "equity",
  REVENUE = "revenue",
  EXPENSE = "expense",
}

export enum NormalSide {
  DEBIT = "debit",
  CREDIT = "credit",
}

export enum GlEntryStatus {
  DRAFT = "draft",
  POSTED = "posted",
}
