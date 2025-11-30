export type StockMoveType = "receipt" | "issue" | "transfer" | "adjustment";
export type ReferenceType =
  | "purchase_order"
  | "sale_order"
  | "transfer"
  | "adjustment";

export interface StockMoveLineDTO {
  id: number | undefined;
  product_id: number;
  quantity: number;
  uom: string;
}

export interface StockMoveCreateDTO {
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_id: number;
  reference_type: ReferenceType;
  reference_id?: number;
  note?: string;
  lines: StockMoveLineDTO[];
}

export interface StockMoveAdjustmentDTO {
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_id: number;
  reference_type: ReferenceType;
  note?: string;
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
  lines: StockMoveLineDTO[];
}
