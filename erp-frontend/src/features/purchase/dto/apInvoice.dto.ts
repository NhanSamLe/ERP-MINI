export type ApInvoiceApprovalStatus =
  "draft" | "waiting_approval" | "approved" | "rejected";

export type ApInvoiceStatus =
  "draft" | "posted" | "cancelled";

export interface ApInvoiceLineDto {
  id?: number;
  product_id: number;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate_id?: number;

  line_total?: number;
  line_tax?: number;
  line_total_after_tax?: number;
}

export interface ApInvoiceDto {
  id: number;
  branch_id: number;
  supplier_id: number;

  invoice_no: string;
  invoice_date: string;

  approval_status: ApInvoiceApprovalStatus;
  status: ApInvoiceStatus;

  created_by: number;
  approved_by?: number | null;

  submitted_at?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;

  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;

  lines: ApInvoiceLineDto[];
}

export interface CreateApInvoiceDto {
  po_id: number;
  invoice_no: string;
  invoice_date: string;
  lines: ApInvoiceLineDto[];
}

export interface UpdateApInvoiceDto {
  invoice_date: string;
  deletedLineIds?: number[];
  lines: ApInvoiceLineDto[];
}

export interface RejectApInvoiceDto {
  reason: string;
}
