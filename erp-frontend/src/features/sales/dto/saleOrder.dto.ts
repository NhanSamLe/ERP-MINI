// saleOrder.dto.ts

import { Product } from "@/features/products/store";
import { User } from "@/types/User";

export type ApprovalStatus = 
  "draft" | "waiting_approval" | "approved" | "rejected";

export type SaleOrderStatus =
  "draft" | "confirmed" | "shipped" | "completed" | "cancelled";

export interface SaleOrderLineDto {
  id?: number;
  order_id?: number;

  product_id?: number;
  product?: Product

  quantity?: number;
  uom_id?: number | null;
  uom?: {
    id: number;
    name: string;
    code: string;
  } | null;
  unit_price?: number;

  tax_rate_id?: number | null;
  taxRate?: {
    id: number;
    name: string;
    rate: number;
  } | null;

  line_total?: number;
  line_tax?: number;
  line_total_after_tax?: number;
}


export interface SaleOrderDto {
  id: number;

  branch_id: number;
  branch?: {
    id: number;
    name: string;
  };

  order_no: string;

  customer_id: number;
  customer?: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    tax_code?: string;
    address?: string;
  };

  order_date: string;

  approval_status: ApprovalStatus;
  status: SaleOrderStatus;
  delivery_status?: "pending" | "partial" | "delivered" | "partially_returned" | "returned";
  invoice_status?: "not_invoiced" | "partial" | "invoiced";

  created_by: number;

  // Người tạo (alias đúng từ model)
  creator?: User;

  // Người duyệt (alias đúng từ model)
  approved_by?: number | null;
  approver?: {
    id: number;
    full_name: string;
  } | null;

  submitted_at?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;

  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;
  currency_id?: number | null;
  exchange_rate?: number;
  currency?: {
    id: number;
    code: string;
    symbol: string;
    name?: string;
  } | null;

  lines: SaleOrderLineDto[];

  created_at?: string | null;
}

export interface CreateSaleOrderLineDto {
  id?: number
  product_id: number;
  description?: string;
  quantity: number;
  uom_id?: number | null;
  unit_price: number;
  tax_rate_id?: number;
}

export interface CreateSaleOrderDto {
  customer_id: number;
  currency_id?: number | null;
  exchange_rate?: number;
  order_date: string;
  lines: CreateSaleOrderLineDto[];
  deletedLineIds?: number[];
}

export interface UpdateSaleOrderDto {
  customer_id: number;
  currency_id?: number | null;
  exchange_rate?: number;
  order_date: string;
  deletedLineIds?: number[];
  lines: SaleOrderLineDto[];
}

export interface RejectSaleOrderDto {
  reason: string;
}
