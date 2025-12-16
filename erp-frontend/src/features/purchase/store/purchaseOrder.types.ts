export type PurchaseOrderStatus =
  | "draft"
  | "waiting_approval"
  | "confirmed"
  | "partially_received"
  | "completed"
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
  approved_by?: string;
  submitted_at?: string;
  approved_at?: string;
  reject_reason?: string;
  created_at: string;
  updated_at: string;
  creator: {
    id: number;
    email: string;
    full_name: string;
    phone: string;
    avatar_url: string;
  };
  approver: {
    id: number;
    email: string;
    full_name: string;
    phone: string;
    avatar_url: string;
  };

  supplier?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  lines?: PurchaseOrderLine[];
}

export interface PurchaseOrderLine {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  tax_rate_id?: number;
  line_total: number;
  line_tax: number;
  line_total_after_tax: number;

  product?: ProductLite;
}
export interface ProductLite {
  id: number;
  name: string;
  image_url: string;
}

export interface PurchaseOrderState {
  items: PurchaseOrder[];
  selectedPO?: PurchaseOrder;
  availableForInvoice: PurchaseOrder[];
  loading: boolean;
  error?: string | null;
}

export interface PurchaseOrderCreate {
  branch_id: number;
  po_no: string;
  supplier_id: number;
  order_date: string;
  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;
  status?: PurchaseOrderStatus;
  description?: string;
  approved_by?: string | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;
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
  status?: PurchaseOrderStatus;
  description?: string;
  approved_by?: string | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;
  lines: PurchaseOrderLine[];
}
