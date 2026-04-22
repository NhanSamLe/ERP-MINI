export interface CreateInventoryDTO {
  warehouse_id: number;
  branch_id: number;
  inv_date: string;
}

export interface CreateInventoryLineDTO {
  product_id: number;
  location_id?: number | null;
  lot_id?: number | null;
}

export interface UpdateInventoryLineDTO {
  counted_qty: number;
}
