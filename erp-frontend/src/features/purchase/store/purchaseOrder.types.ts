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
  // Partial invoicing fields — populated by getAvailablePurchaseOrders
  invoiced_amount?: number;
  remaining_amount?: number;
  invoice_count?: number;
}

export interface PurchaseOrderLine {
  id?: number;
  product_id: number;
  quantity: number;
  uom_id?: number | null;
  qty_in_stock_uom?: number | null;
  unit_price: number;
  discount?: number | null;
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

export interface SearchQuery {
  po_no?: string;
  supplier_id?: number;
  status?: string[];
  date_from?: string;
  date_to?: string;
  total_from?: number;
  total_to?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PurchaseOrderState {
  items: PurchaseOrder[];
  selectedPO?: PurchaseOrder;
  availableForInvoice: PurchaseOrder[];
  loading: boolean;
  error?: string | null;
  filters: SearchQuery;
  pagination: Pagination;
  selectedIds: number[];
  bulkActionLoading: boolean;
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
