export interface StockLot {
  id: number;
  product_id: number;
  lot_no: string;
  serial_no?: string | null;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  supplier_id?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  product?: { id: number; name: string; sku: string };
  supplier?: { id: number; name: string };
}

export interface CreateLotDTO {
  product_id: number;
  lot_no: string;
  serial_no?: string;
  manufacture_date?: string;
  expiry_date?: string;
  supplier_id?: number;
  notes?: string;
}

export interface UpdateLotDTO {
  serial_no?: string | null;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  supplier_id?: number | null;
  notes?: string | null;
}

export interface StockLotState {
  items: StockLot[];
  expiring: StockLot[];
  selectedItem: StockLot | null;
  loading: boolean;
  error: string | null;
}
