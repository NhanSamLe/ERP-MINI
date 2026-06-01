import { User } from "@/types/User";
import { Product } from "@/features/products/store/product.types";

export type QuotationStatus =
  | "draft" | "sent" | "accepted" | "rejected" | "expired" | "cancelled" | "converted";

export type QuotationApprovalStatus =
  | "draft" | "waiting_approval" | "approved" | "rejected";

export interface QuotationLineDto {
  id?: number;
  quotation_id?: number;
  product_id?: number;
  product?: Product;
  description?: string;
  quantity: number;
  uom_id?: number | null;
  uom?: { id: number; name: string; code: string } | null;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate_id?: number | null;
  taxRate?: { id: number; name: string; rate: number } | null;
  line_total?: number;
  line_tax?: number;
  line_total_after_tax?: number;
}

export interface QuotationDto {
  id: number;
  quotation_no: string;
  branch_id: number;
  branch?: { id: number; name: string };
  customer_id: number;
  customer?: {
    id: number; name: string;
    phone?: string; email?: string;
    tax_code?: string; address?: string;
    contact_person?: string;
  };
  opportunity_id?: number | null;
  opportunity?: { id: number; name: string } | null;
  quotation_date: string;
  valid_until: string;
  status: QuotationStatus;
  approval_status: QuotationApprovalStatus;
  version: number;
  parent_id?: number | null;
  currency_id?: number | null;
  exchange_rate?: number;
  currency?: { id: number; code: string; symbol: string; name?: string } | null;
  payment_term_id?: number | null;
  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;
  discount_percent?: number | null;
  discount_amount?: number | null;
  customer_notes?: string | null;
  internal_notes?: string | null;
  sales_person_id?: number | null;
  created_by: number;
  creator?: User;
  approved_by?: number | null;
  approver?: { id: number; full_name: string } | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  sent_at?: string | null;
  reject_reason?: string | null;
  lines: QuotationLineDto[];
  created_at?: string;
}

export interface CreateQuotationLineDto {
  product_id: number;
  description?: string;
  quantity: number;
  uom_id?: number | null;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate_id?: number | null;
}

export interface CreateQuotationDto {
  customer_id: number;
  opportunity_id?: number | null;
  currency_id?: number | null;
  exchange_rate?: number;
  quotation_date: string;
  valid_until: string;
  discount_percent?: number;
  discount_amount?: number;
  customer_notes?: string;
  internal_notes?: string;
  lines: CreateQuotationLineDto[];
}

export interface UpdateQuotationDto extends CreateQuotationDto {
  deletedLineIds?: number[];
}
