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
  customer?: {
    id: number;
    name: string;
    phone: string;
  };

  amount: number;
  method: "cash" | "bank" | "transfer";

  approval_status: ReceiptApprovalStatus;
  status: ReceiptStatus;

  created_by: number;
  creator?: {
    id: number;
    username: string;
    full_name?: string;
  };

  approved_by?: number | null;
  approver?: {
    id: number;
    username: string;
    full_name?: string;
  } | null;

  submitted_at?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;

  allocations?: ArReceiptAllocationDto[];
}
export interface ArReceiptAllocationDto {
  id: number;
  receipt_id: number;
  invoice_id: number;
  applied_amount?: number;
  invoice?: {
    id: number;
    invoice_no: string;
    total_after_tax: number;
  };
}


export interface CreateReceiptDto {
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
export interface UnpaidInvoiceDto {
  invoice_id: number;
  invoice_no: string;
  total_after_tax: number;
  allocated: number;
  unpaid: number;
}
export interface ReceiptFilterDto {
  search?: string;
  customer_id?: number;

  // ALLOW "" for UI
  status?: "" | "draft" | "posted";
  approval_status?: "" | "draft" | "waiting_approval" | "approved" | "rejected";

  date_from?: string;
  date_to?: string;

  page?: number;
  page_size?: number;
}
export interface CustomerWithDebtDto {
  id: number;
  name: string;
  total: number;
}
