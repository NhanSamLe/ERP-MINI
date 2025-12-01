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
  product: {
    id: number;
    name: string;
    sku: string;
    image_url: string;
    uom: string;
  };
}

export interface StockMove {
  id: number;
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_from_id?: number | null;
  warehouse_to_id?: number | null;
  reference_type: ReferenceType;
  reference_id: number;
  status: "draft" | "waiting_approval" | "posted " | "cancelled";
  note?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  approved_by?: string;
  submitted_at?: string;
  approved_at?: string;
  reject_reason?: string;

  lines?: StockMoveLine[];
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
}

export interface StockMoveCreate {
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_id: number;
  reference_type: ReferenceType;
  reference_id?: number;
  note?: string;
  created_by: number;
  approved_by?: string;
  submitted_at?: string;
  approved_at?: string;
  reject_reason?: string;
  lines: {
    id: number | undefined;
    product_id: number;
    quantity: number;
    uom: string;
  }[];
}

export interface StockMoveTransferCreate {
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_from_id: number;
  warehouse_to_id: number;
  reference_type: ReferenceType;
  note?: string;
  created_by: number;
  approved_by?: string;
  submitted_at?: string;
  approved_at?: string;
  reject_reason?: string;
  lines: {
    id: number | undefined;
    product_id: number;
    quantity: number;
    uom: string;
  }[];
}

export interface StockMoveTransferUpdate {
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_from_id: number;
  warehouse_to_id: number;
  reference_type: ReferenceType;
  note?: string;
  created_by: number;
  approved_by?: string;
  submitted_at?: string;
  approved_at?: string;
  reject_reason?: string;
  lines: {
    id: number | undefined;
    product_id: number;
    quantity: number;
    uom: string;
  }[];
}

export interface StockMoveUpdate {
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_id: number;
  reference_type: ReferenceType;
  reference_id?: number;
  note?: string;
  created_by: number;
  approved_by?: string;
  submitted_at?: string;
  approved_at?: string;
  reject_reason?: string;
  lines: {
    id: number | undefined;
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

export interface LineTransferItem {
  id: number | undefined;
  product_id: number;
  name: string;
  image: string;
  sku: string;
  uom: string;
  quantity: number;
}

export interface TransferForm {
  warehouseFrom: string;
  warehouseTo: string;
  move_no: string;
  move_date: string;
  type: string;
  notes: string;
  reference_type: string;
}

export interface AdjustmentForm {
  warehouse: string;
  move_no: string;
  move_date: string;
  type: string;
  notes: string;
  reference_type: string;
}

export interface LineAdjustmentItem {
  id: number | undefined;
  product_id: number;
  name: string;
  image: string;
  sku: string;
  uom: string;
  quantity: number;
}

export interface IssueForm {
  warehouse: string;
  referenceNo: string;
  move_no: string;
  move_date: string;
  type: string;
  notes: string;
  reference_type: string;
}

export interface LineIssueItem {
  id: number | undefined;
  product_id: number;
  name: string;
  image: string;
  sku: string;
  uom: string;
  quantity: number;
}

export interface StockMoveAdjustmentCreate {
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_id: number;
  reference_type: ReferenceType;
  note?: string;
  created_by: number;
  approved_by?: string;
  submitted_at?: string;
  approved_at?: string;
  reject_reason?: string;
  lines: {
    id: number | undefined;
    product_id: number;
    quantity: number;
    uom: string;
  }[];
}

export interface StockMoveAdjustmentUpdate {
  move_no: string;
  move_date: string;
  type: StockMoveType;
  warehouse_id: number;
  reference_type: ReferenceType;
  note?: string;
  created_by: number;
  approved_by?: string;
  submitted_at?: string;
  approved_at?: string;
  reject_reason?: string;
  lines: {
    id: number | undefined;
    product_id: number;
    quantity: number;
    uom: string;
  }[];
}
