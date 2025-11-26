export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address: string;
}

export interface WarehouseState {
  items: Warehouse[];
  loading: boolean;
  error: string | null;
}
