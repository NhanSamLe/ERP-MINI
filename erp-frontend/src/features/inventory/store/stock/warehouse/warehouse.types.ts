export interface Warehouse {
  id: number;
  branch_id: number;
  code: string;
  name: string;
  address: string;
}

export interface WarehouseState {
  items: Warehouse[];
  loading: boolean;
  error: string | null;
}
