// invoice.dto.ts

export type InvoiceApprovalStatus =
  "draft" | "waiting_approval" | "approved" | "rejected";

export type InvoiceStatus =
  "draft" | "posted" | "paid" | "cancelled";

export interface ArInvoiceLineDto {
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

export interface ArInvoiceDto {
  id: number;
  branch_id: number;
  invoice_no: string;
  invoice_date: string;

  approval_status: InvoiceApprovalStatus;
  status: InvoiceStatus;

  created_by: number;
  approved_by?: number | null;

  submitted_at?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;

  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;

  lines: ArInvoiceLineDto[];
}

export interface CreateInvoiceDto {
  order_id: number;
  invoice_no: string;
  invoice_date: string;
  lines: ArInvoiceLineDto[];
}

export interface UpdateInvoiceDto {
  invoice_date: string;
  deletedLineIds?: number[];
  lines: ArInvoiceLineDto[];
}

export interface RejectInvoiceDto {
  reason: string;
}
