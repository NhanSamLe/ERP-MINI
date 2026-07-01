export interface StockBalance {
  id: number;
  warehouse_id: number;
  product_id: number;
  location_id?: number | null;
  lot_id?: number | null;
  quantity: number;
  reserved_qty?: number;
  unit_cost?: number | null;
  total_value?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface StockBalanceState {
  items: StockBalance[];
  loading: boolean;
  selected?: StockBalance | null;
  error?: string | null;
}
