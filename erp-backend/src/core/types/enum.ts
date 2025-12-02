// =====================
// ROLE
// =====================

export enum Role {
  ADMIN = "ADMIN",
  CEO = "CEO",
  SALESMANAGER = "SALESMANAGER",
  SALES = "SALES",
  WHMANAGER = "WHMANAGER",
  WHSTAFF = "WHSTAFF",
  CHACC = "CHACC",
  ACCOUNT = "ACCOUNT",
  HRMANAGER = "HRMANAGER",
  PURCHASE = "PURCHASE",
  PURCHASEMANAGER = "PURCHASEMANAGER",
}

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
  INTERNAL = "internal",
}
export enum PartnerStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
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

export enum ReferenceType {
  PURCHASE_ORDER = "purchase_order",
  SALES_ORDER = "sales_order",
  TRANSFER = "transfer",
  ADJUSTMENT = "adjustment",
  OTHER = "other",
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

export enum TaxType {
  VAT = "VAT", // Thuế giá trị gia tăng
  CIT = "CIT", // Thuế thu nhập doanh nghiệp
  PIT = "PIT", // Thuế thu nhập cá nhân
  IMPORT = "IMPORT", // Thuế nhập khẩu
  EXPORT = "EXPORT", // Thuế xuất khẩu
  EXCISE = "EXCISE", // Thuế tiêu thụ đặc biệt
  ENVIRONMENTAL = "ENVIRONMENTAL", // Thuế môi trường
  OTHER = "OTHER", // Các loại khác
}

export enum AppliesTo {
  SALE = "sale", // Thuế áp dụng cho hóa đơn bán hàng
  PURCHASE = "purchase", // Thuế áp dụng cho hóa đơn mua hàng
  BOTH = "both", // Áp dụng cho cả hai
}

export enum TaskPriorityEnum {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum TaskStatusEnum {
  NOT_STARTED = "Not Started",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
}
export enum ActivityStatus{
  PENDING ="pending",
  IN_PROGRESS ="in_progress" ,
  COMPLETED ="completed",
  CANCELLED ="cancelled"
}
export enum ApprovalStatus {
  DRAFT = "draft",
  WAITING = "waiting_approval",
  APPROVED = "approved",
  REJECTED = "rejected",
}