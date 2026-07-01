import { SaleOrderDto } from "./saleOrder.dto";

export type ReturnType = "refund" | "replacement" | "credit_note";
export type RmaStatus = "draft" | "submitted" | "approved" | "rejected" | "processing" | "completed" | "cancelled";
export type ReturnStatus = "draft" | "received" | "inspected" | "completed" | "cancelled";

export interface SalesReturnLineDto {
  id?: number;
  product_id: number;
  product?: { id: number; sku?: string; name?: string };
  quantity_returned: number;
  quantity_received: number;
  quantity_rejected: number;
  unit_price: number;
  line_total: number;
  reason?: string | null;
  condition?: "good" | "damaged" | "defective";
}

export interface SalesReturnAuthorizationDto {
  id: number;
  branch_id: number;
  rma_no: string;
  sale_order_id: number;
  invoice_id?: number | null;
  customer_id: number;
  reason: string;
  return_type: ReturnType;
  status: RmaStatus;
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  total_return_amount: number;
  created_by?: number | null;
  approved_by?: number | null;
  reject_reason?: string | null;
  notes?: string | null;
  saleOrder?: Pick<SaleOrderDto, "id" | "order_no" | "status" | "delivery_status" | "invoice_status" | "total_after_tax">;
  customer?: { id: number; name: string; email?: string; phone?: string };
}

export interface SalesReturnDto {
  id: number;
  branch_id: number;
  return_no: string;
  rma_id?: number | null;
  sale_order_id?: number | null;
  customer_id: number;
  return_date: string;
  warehouse_id?: number | null;
  status: ReturnStatus;
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  total_return_amount: number;
  created_by?: number | null;
  approved_by?: number | null;
  notes?: string | null;
  stock_move_id?: number | null;
  lines?: SalesReturnLineDto[];
  rma?: SalesReturnAuthorizationDto;
  customer?: { id: number; name: string; email?: string; phone?: string };
  saleOrder?: Pick<SaleOrderDto, "id" | "order_no">;
}

export interface CreateRmaDto {
  sale_order_id: number;
  invoice_id?: number | null;
  reason: string;
  return_type: ReturnType;
  notes?: string | null;
}

export interface CreateSalesReturnFromRmaDto {
  return_date?: string;
  warehouse_id?: number | null;
  notes?: string | null;
  lines: Array<{
    product_id: number;
    quantity_returned: number;
    quantity_received?: number;
    quantity_rejected?: number;
    unit_price?: number;
    reason?: string | null;
    condition?: "good" | "damaged" | "defective";
  }>;
}

export interface ArCreditNoteDto {
  id: number;
  branch_id: number;
  credit_note_no: string;
  sales_return_id?: number | null;
  original_invoice_id?: number | null;
  customer_id: number;
  credit_note_date: string;
  status: "draft" | "posted" | "applied" | "cancelled";
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;
  currency_id?: number | null;
  exchange_rate: number;
  notes?: string | null;
  customer?: { id: number; name: string; email?: string; phone?: string };
  currency?: { id: number; code: string; symbol?: string };
}

export interface ArRefundDto {
  id: number;
  branch_id: number;
  refund_no: string;
  credit_note_id?: number | null;
  customer_id: number;
  refund_date: string;
  amount: number;
  currency_id?: number | null;
  exchange_rate: number;
  method: "cash" | "bank" | "transfer";
  status: "draft" | "posted";
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  notes?: string | null;
  creditNote?: Pick<ArCreditNoteDto, "id" | "credit_note_no" | "total_after_tax">;
  customer?: { id: number; name: string; email?: string; phone?: string };
  currency?: { id: number; code: string; symbol?: string };
}
