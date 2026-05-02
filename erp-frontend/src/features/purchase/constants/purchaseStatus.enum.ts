/**
 * Purchase Order Status
 */
export const PurchaseOrderStatus = {
  DRAFT: "draft",
  CONFIRMED: "confirmed",
  PARTIALLY_RECEIVED: "partially_received",
  RECEIVED: "received",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type PurchaseOrderStatus =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

/**
 * AP Invoice Status
 */
export const ApInvoiceStatus = {
  DRAFT: "draft",
  POSTED: "posted",
  PARTIALLY_PAID: "partially_paid",
  PAID: "paid",
  CANCELLED: "cancelled",
} as const;

export type ApInvoiceStatus =
  (typeof ApInvoiceStatus)[keyof typeof ApInvoiceStatus];

/**
 * AP Payment Status
 */
export const ApPaymentStatus = {
  DRAFT: "draft",
  POSTED: "posted",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type ApPaymentStatus =
  (typeof ApPaymentStatus)[keyof typeof ApPaymentStatus];

/**
 * Approval Status (used across all purchase documents)
 */
export const ApprovalStatus = {
  DRAFT: "draft",
  WAITING_APPROVAL: "waiting_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ApprovalStatus =
  (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

/**
 * Invoice Source
 */
export const InvoiceSource = {
  MANUAL: "manual",
  AI_OCR: "ai_ocr",
} as const;

export type InvoiceSource = (typeof InvoiceSource)[keyof typeof InvoiceSource];

/**
 * Matching Status
 */
export const MatchingStatus = {
  PENDING: "pending",
  MATCHED: "matched",
  MISMATCH: "mismatch",
} as const;

export type MatchingStatus =
  (typeof MatchingStatus)[keyof typeof MatchingStatus];

/**
 * OCR Status
 */
export const OcrStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  DONE: "done",
  FAILED: "failed",
} as const;

export type OcrStatus = (typeof OcrStatus)[keyof typeof OcrStatus];

/**
 * Helper function to get display label for status
 */
export const getStatusLabel = (status: string): string => {
  return status.replace(/_/g, " ").toUpperCase();
};

/**
 * Helper function to get all status values
 */
export const getPurchaseOrderStatusValues = (): string[] => {
  return Object.values(PurchaseOrderStatus);
};

export const getApInvoiceStatusValues = (): string[] => {
  return Object.values(ApInvoiceStatus);
};

export const getApPaymentStatusValues = (): string[] => {
  return Object.values(ApPaymentStatus);
};

export const getApprovalStatusValues = (): string[] => {
  return Object.values(ApprovalStatus);
};
