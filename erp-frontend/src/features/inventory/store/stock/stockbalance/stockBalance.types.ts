export interface StockBalance {
  id: number;
  warehouse_id: number;
  product_id: number;
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface StockBalanceState {
  items: StockBalance[];
  loading: boolean;
  selected?: StockBalance | null;
  error?: string | null;
}
