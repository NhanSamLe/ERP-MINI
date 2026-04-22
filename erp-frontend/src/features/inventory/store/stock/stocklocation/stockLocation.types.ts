export type StockLocationType =
  | "view"
  | "internal"
  | "input"
  | "output"
  | "customer"
  | "supplier"
  | "transit";

export interface StockLocation {
  id: number;
  warehouse_id: number;
  parent_id?: number | null;
  name: string;
  code: string;
  type: StockLocationType;
  is_active: boolean;
  path?: string | null;
  children?: StockLocation[];
  warehouse?: { id: number; name: string; code: string };
  parent?: { id: number; name: string; code: string; path: string };
}

export interface CreateLocationDTO {
  warehouse_id: number;
  parent_id?: number | null;
  name: string;
  code: string;
  type: StockLocationType;
  is_active?: boolean;
}

export interface UpdateLocationDTO {
  parent_id?: number | null;
  name?: string;
  type?: StockLocationType;
  is_active?: boolean;
}

export interface StockLocationState {
  items: StockLocation[];
  tree: StockLocation[];
  selectedItem: StockLocation | null;
  loading: boolean;
  error: string | null;
}
