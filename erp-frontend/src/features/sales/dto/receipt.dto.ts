// receipt.dto.ts

export type ReceiptApprovalStatus =
  "draft" | "waiting_approval" | "approved" | "rejected";

export type ReceiptStatus =
  "draft" | "posted";

export interface ArReceiptDto {
  id: number;
  branch_id: number;
  receipt_no: string;
  receipt_date: string;
  customer_id: number;
  amount: number;
  method: "cash" | "bank" | "transfer";

  approval_status: ReceiptApprovalStatus;
  status: ReceiptStatus;

  created_by: number;
  approved_by?: number | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;
}

export interface CreateReceiptDto {
  receipt_no: string;
  receipt_date: string;
  customer_id: number;
  amount: number;
  method: "cash" | "bank" | "transfer";
}

export interface UpdateReceiptDto {
  receipt_date: string;
  customer_id: number;
  amount: number;
  method: "cash" | "bank" | "transfer";
}

export interface AllocateReceiptDto {
  invoice_id: number;
  applied_amount: number;
}
