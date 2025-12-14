// apInvoice.types.ts

import { PurchaseOrder } from "../purchaseOrder.types";

export type ApInvoiceStatus = "draft" | "posted" | "paid" | "cancelled";

export type ApInvoiceApprovalStatus =
  | "draft"
  | "waiting_approval"
  | "approved"
  | "rejected";

export interface Branch {
  id: number;
  company_id: number;
  code: string;
  name: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  tax_code: string;
  bank_account: string;
  bank_name: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface UserLite {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
}
export interface ApInvoiceLine {
  id: number;
  product_id?: number;
  description?: string;
  quantity?: number;
  unit_price?: string;
  tax_rate_id?: number;
  line_total?: string;
  line_tax?: string;
  line_total_after_tax?: string;

  product?: {
    id: number;
    name: string;
    image_url?: string | null;
  };
}
export interface ApInvoice {
  id: number;
  po_id: number | null;
  invoice_no: string;
  invoice_date: string;
  due_date: string;

  total_before_tax: string;
  total_tax: string;
  total_after_tax: string;

  status: ApInvoiceStatus;
  approval_status: ApInvoiceApprovalStatus;

  created_by: number;
  approved_by: number | null;

  submitted_at: string | null;
  approved_at: string | null;
  reject_reason: string | null;

  branch_id: number;

  created_at: string;
  updated_at: string;

  branch: Branch;
  creator: UserLite;
  approver: UserLite | null;
  order?: PurchaseOrder;
  lines?: ApInvoiceLine[];
}

export interface ApInvoiceCreate {
  po_id?: number | null;

  invoice_no: string;
  invoice_date: string;
  due_date: string;

  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;

  branch_id: number;

  status?: ApInvoiceStatus;
  approval_status?: ApInvoiceApprovalStatus;
}

export interface ApInvoiceUpdate {
  po_id?: number | null;

  invoice_no?: string;
  invoice_date?: string;
  due_date?: string;

  total_before_tax?: number;
  total_tax?: number;
  total_after_tax?: number;

  status?: ApInvoiceStatus;
  approval_status?: ApInvoiceApprovalStatus;

  reject_reason?: string;
}
