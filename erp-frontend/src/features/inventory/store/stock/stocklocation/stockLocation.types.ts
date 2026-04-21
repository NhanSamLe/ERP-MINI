import { StockLocation } from "../../../api/stockLocation.api";

export interface StockLocationState {
  items: StockLocation[];
  tree: StockLocation[];
  selectedItem: StockLocation | null;
  loading: boolean;
  error: string | null;
}

export type { StockLocation };
