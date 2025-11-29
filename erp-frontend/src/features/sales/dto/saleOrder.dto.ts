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

  lines: SaleOrderLineDto[];

  created_at?: string | null;
}

export interface CreateSaleOrderLineDto {
  product_id: number;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate_id?: number;
}

export interface CreateSaleOrderDto {
  customer_id: number;
  order_date: string;
  lines: CreateSaleOrderLineDto[];
}

export interface UpdateSaleOrderDto {
  customer_id: number;
  order_date: string;
  deletedLineIds?: number[];
  lines: SaleOrderLineDto[];
}

export interface RejectSaleOrderDto {
  reason: string;
}
