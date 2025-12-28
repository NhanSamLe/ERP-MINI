export interface Warehouse {
  id: number;
  branch_id: number;
  code: string;
  name: string;
  address: string;
}

export interface WarehouseDTO {
  branch_id: number;
  code: string;
  name: string;
  address: string;
}

export interface WarehouseState {
  items: Warehouse[];
  selectedItem: Warehouse | null;
  loading: boolean;
  error: string | null;
}
