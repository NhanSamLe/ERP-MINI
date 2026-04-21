import { StockLocationType } from "../models/stockLocation.model";

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
