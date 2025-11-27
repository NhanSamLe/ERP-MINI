export type StockMoveType = "receipt" | "issue" | "transfer" | "adjustment";
export type ReferenceType =
  | "purchase_order"
  | "sale_order"
  | "transfer"
  | "adjustment";

export interface StockMoveLine {
  id: number;
  move_id: number;
  product_id: number;
  quantity: number;
  uom: string;
  created_at: string;
  updated_at: string;
}

export interface StockMove {
  id: number;
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_id: number;
  reference_type: ReferenceType;
  reference_id: number;
  status: "draft" | "confirmed" | "posted";
  note?: string;
  created_at: string;
  updated_at: string;

  lines?: StockMoveLine[];
}

export interface StockMoveCreate {
  move_date: string;
  type: StockMoveType;
  warehouse_id: number;
  reference_type: ReferenceType;
  reference_id?: number;
  note?: string;
  lines: {
    product_id: number;
    quantity: number;
    uom: string;
  }[];
}

export interface StockMoveUpdate {
  move_date: string;
  type: StockMoveType;
  warehouse_id: number;
  reference_type: ReferenceType;
  reference_id?: number;
  note?: string;
  lines: {
    product_id: number;
    quantity: number;
    uom: string;
  }[];
}

export interface StockMoveState {
  loading: boolean;
  error: string | null;
  items: StockMove[];
  selected: StockMove | null;
}
