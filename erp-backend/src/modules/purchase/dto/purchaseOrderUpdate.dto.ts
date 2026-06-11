export interface PurchaseOrderLineUpdateDto {
  id?: number;
  product_id: number;
  quantity: number;
  uom_id?: number; // đơn vị mua (purchase UOM), optional - nếu không truyền thì dùng stock UOM của product
  unit_price: number;
  tax_rate_id: number;
  line_total: number;
}

export interface PurchaseOrderUpdateDto {
  branch_id: number;
  po_no: string;
  supplier_id: number;
  order_date: string;
  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;
  description: string;
  payment_term_id?: number | null;
  currency_id?: number | null;
  exchange_rate?: number;
  approved_by?: string | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;
  lines: PurchaseOrderLineUpdateDto[];
  deletedLineIds?: number[];
}
