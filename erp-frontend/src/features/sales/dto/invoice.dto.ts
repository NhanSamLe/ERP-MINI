// invoice.dto.ts

import { Product } from "@/features/products/store";

export type InvoiceApprovalStatus =
  "draft" | "waiting_approval" | "approved" | "rejected";

export type InvoiceStatus =
  "draft" | "posted" | "paid" | "cancelled" | "partially_paid";

  

export interface ArInvoiceLineDto {
  id?: number;

  product_id: number;
  product?: Product

  description?: string;

  quantity: number;
  unit_price: number;

  tax_rate_id?: number;
  taxRate?: {
    id: number;
    name: string;
    rate: number;
  } | null;

  line_total?: number;
  line_tax?: number;
  line_total_after_tax?: number;
}

export interface ArInvoiceDto {
  id: number;

  branch_id: number;
  branch?: {
    id: number;
    name: string;
  };

  invoice_no: string;
  invoice_date: string;

  approval_status: InvoiceApprovalStatus;
  status: InvoiceStatus;

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

  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;

  // ✔ 1) Sale Order (thêm)
  order?: {
    id: number;
    order_no: string;
    order_date?: string;

    // ✔ 2) Customer từ SaleOrder
    customer?: {
      id: number;
      name: string;
      phone?: string;
      email?: string;
      tax_code?: string;
      address?: string;
    };
  };

  // ✔ 3) Invoice Lines
  lines: ArInvoiceLineDto[];
}


export interface CreateInvoiceDto {
  order_id?: number | null;
}
export interface RejectInvoiceDto {
  reason: string;
}
