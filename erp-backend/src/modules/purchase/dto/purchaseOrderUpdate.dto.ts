export interface PurchaseOrderLineUpdateDto {
  id?: number;
  product_id: number;
  quantity: number;
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
  lines: PurchaseOrderLineUpdateDto[];
  deletedLineIds?: number[];
}
