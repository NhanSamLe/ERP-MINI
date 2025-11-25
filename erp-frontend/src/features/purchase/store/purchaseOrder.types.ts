export type PurchaseOrderStatus =
  | "draft"
  | "confirmed"
  | "received"
  | "cancelled";

export interface PurchaseOrder {
  id: number;
  branch_id?: number;
  po_no: string;
  supplier_id?: number;
  order_date?: string;
  total_before_tax?: number;
  total_tax?: number;
  total_after_tax?: number;
  status: PurchaseOrderStatus;
  description?: string;
  created_at: string;
  updated_at: string;
  lines?: PurchaseOrderLine[];
}

export interface PurchaseOrderLine {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  tax_rate_id?: number;
  line_total: number;
}

export interface PurchaseOrderState {
  items: PurchaseOrder[];
  selectedPO?: PurchaseOrder;
  loading: boolean;
  error?: string | null;
}

export interface PurchaseOrderCreate {
  branch_id: number;
  po_no: string;
  supplier_id: number;
  order_date: string; // YYYY-MM-DD
  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;
  status?: "draft" | "confirmed" | "received" | "cancelled";
  description?: string;
  lines: PurchaseOrderLine[];
}

export interface PurchaseOrderUpdate {
  branch_id: number;
  po_no: string;
  supplier_id: number;
  order_date: string; // YYYY-MM-DD
  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;
  status?: "draft" | "confirmed" | "received" | "cancelled";
  description?: string;
  lines: PurchaseOrderLine[];
}
