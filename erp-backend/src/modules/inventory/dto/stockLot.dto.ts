export interface CreateLotDTO {
  product_id: number;
  lot_no: string;
  serial_no?: string | null;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  supplier_id?: number | null;
  notes?: string | null;
}

export interface UpdateLotDTO {
  serial_no?: string | null;
  manufacture_date?: string | null;
  expiry_date?: string | null;
  supplier_id?: number | null;
  notes?: string | null;
}
