// invoice.dto.ts

import { Product } from "@/features/products/store";

export type InvoiceApprovalStatus =
  "draft" | "waiting_approval" | "approved" | "rejected";

export type InvoiceStatus =
  "draft" | "posted" | "paid" | "cancelled" | "partially_paid";

  

export interface ArInvoiceLineDto {
  id?: number;

  product_id: number;
  product?: Product & {
    uom?: { id: number; name: string; code: string } | null;
  };

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
    address?: string;
    tax_code?: string;
    phone?: string;
    company?: {
      id: number;
      name: string;
      tax_code?: string;
      address?: string;
      phone?: string;
      email?: string;
    };
  };

  invoice_no: string;
  invoice_date: string;
  due_date?: string | null;

  currency_id?: number | null;
  currency?: { id: number; code: string; symbol: string; name?: string } | null;
  exchange_rate?: number;

  approval_status: InvoiceApprovalStatus;
  status: InvoiceStatus;

  customer_id?: number | null;
  customer?: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    tax_code?: string;
    address?: string;
  } | null;

  created_by: number;
  creator?: { id: number; username: string; full_name?: string };

  approved_by?: number | null;
  approver?: { id: number; username: string; full_name?: string } | null;

  submitted_at?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;

  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;
  paid_amount?: number;

  order?: {
    id: number;
    order_no: string;
    order_date?: string;
    customer?: {
      id: number;
      name: string;
      phone?: string;
      email?: string;
    };
  };

  lines: ArInvoiceLineDto[];
}


export interface CreateInvoiceDto {
  order_id?: number | null;
}
export interface RejectInvoiceDto {
  reason: string;
}
