// apInvoice.types.ts

import { PurchaseOrder } from "../purchaseOrder.types";

export type ApInvoiceStatus = "draft" | "posted" | "paid" | "cancelled" | "partially_paid";

export type ApInvoiceApprovalStatus =
  | "draft"
  | "waiting_approval"
  | "approved"
  | "rejected";

export type ApInvoiceSource = "manual" | "ai_ocr";

export type ApInvoiceMatchingStatus = "pending" | "matched" | "mismatch";

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
  po_line_id?: number | null;
  grn_line_id?: number | null;
  matching_result?: "matched" | "price_mismatch" | "qty_mismatch" | null;
  product?: {
    id: number;
    name: string;
    image_url?: string | null;
  };
}

export interface MatchingLineResult {
  ap_invoice_line_id: number;
  po_line_id?: number;
  status: "matched" | "price_mismatch" | "qty_mismatch";
  invoice_qty: number;
  po_qty: number;
  total_received: number;
  previously_invoiced: number;
  remaining_to_invoice: number;
  messages: string[];
}

export interface MatchingDetails {
  summary: {
    total_lines: number;
    matched_lines: number;
    price_mismatches: number;
    qty_mismatches: number;
  };
  line_results: MatchingLineResult[];
}

export interface ApInvoiceAuditLog {
  id: number;
  ap_invoice_id: number;
  action:
    | "created"
    | "auto_created"
    | "override_duplicate"
    | "mismatch_accepted"
    | "manual_override";
  source?: ApInvoiceSource | null;
  ocr_confidence?: number | null;
  matching_status?: string | null;
  matching_details?: MatchingDetails | null;
  override_reason?: string | null;
  created_by: number;
  created_at: string;
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

  // OCR & Matching fields
  source: ApInvoiceSource;
  ocr_confidence?: number | null;
  invoice_document_id?: number | null;
  matching_status: ApInvoiceMatchingStatus;
  matching_details?: MatchingDetails | null;
  supplier_id?: number | null;

  created_by: number;
  approved_by: number | null;

  submitted_at: string | null;
  approved_at: string | null;
  reject_reason: string | null;

  branch_id: number;
  payment_term_id?: number | null;
  currency_id?: number | null;
  exchange_rate?: string | number | null;

  created_at: string;
  updated_at: string;

  branch: Branch;
  creator: UserLite;
  approver: UserLite | null;
  order?: PurchaseOrder;
  lines?: ApInvoiceLine[];
  audit_trail?: ApInvoiceAuditLog[];
  paymentTerm?: {
    id: number;
    name: string;
    code: string;
    days?: number;
  } | null;
  currency?: {
    id: number;
    name: string;
    code: string;
    symbol?: string;
  } | null;
}
export interface ApInvoiceSummary {
  id: number;
  invoice_no: string;
  invoice_date: string;
  total_after_tax: string;
  po_id: number;
  order: {
    id: number;
    po_no: string;
    supplier_id: number;
    supplier: {
      id: number;
      name: string;
    };
  };
}

export interface ApPostedSummary {
  invoices: ApInvoiceSummary[];
  total_amount: number;
}
