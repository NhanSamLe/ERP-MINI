export interface Uom {
  id: number;
  code: string;
  name: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface UomConversion {
  id: number;
  from_uom_id: number;
  to_uom_id: number;
  factor: number;
  is_active?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}
export interface CreateUomDto {
  code: string;
  name: string;
}

export interface UpdateUomDto {
  code?: string;
  name?: string;
}

export interface CreateUomConversionDto {
  from_uom_id: number;
  to_uom_id: number;
  factor: number;
}

export interface UpdateUomConversionDto {
  factor?: number;
}
