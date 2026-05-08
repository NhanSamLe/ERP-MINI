export type StockMoveType =
  | "receipt"
  | "issue"
  | "transfer"
  | "adjustment"
  | "scrap";
export type ReferenceType =
  | "purchase_order"
  | "sale_order"
  | "transfer"
  | "adjustment";

export interface StockMoveLineDTO {
  id: number | undefined;
  product_id: number;
  quantity: number;
  uom_id?: number | null;
  location_from_id?: number | null;
  location_to_id?: number | null;
  lot_id?: number | null;
  new_lot?: {
    lot_no: string;
    expiry_date?: string | null;
    manufacture_date?: string | null;
    serial_no?: string | null;
    supplier_id?: number | null;
    notes?: string | null;
  } | null;
}

export interface StockMoveCreateDTO {
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_id: number;
  reference_type: ReferenceType;
  reference_id?: number;
  note?: string;
  created_by: number;
  lines: StockMoveLineDTO[];
}

export interface StockMoveAdjustmentDTO {
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_id: number;
  reference_type: ReferenceType;
  note?: string;
  created_by: number;
  lines: StockMoveLineDTO[];
}

export interface StockMoveTransferDTO {
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_from_id: number;
  warehouse_to_id: number;
  reference_type: ReferenceType;
  note?: string;
  created_by: number;
  lines: StockMoveLineDTO[];
}

export interface StockMoveUpdateDTO {
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_id: number;
  reference_type: ReferenceType;
  reference_id?: number;
  note?: string;
  created_by: number;
  lines: StockMoveLineDTO[];
}
