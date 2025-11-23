import { TaxType, AppliesTo } from "../../../types/enum";

export class CreateTaxRateDto {
  code!: string;
  name!: string;
  type!: TaxType;
  rate!: number;
  applies_to!: AppliesTo;
  is_vat?: boolean;
  effective_date?: string;
  expiry_date?: string | null;
  status?: "active" | "inactive"; // có thể define enum luôn nếu muốn
}

export class UpdateTaxRateDto {
  name?: string;
  type?: TaxType;
  rate?: number;
  applies_to?: AppliesTo;
  is_vat?: boolean;
  effective_date?: string;
  expiry_date?: string | null;
  status?: "active" | "inactive";
}
export interface Tax {
  id: number;
  code: string;
  name: string;
  type: TaxType;
  rate: number;
  applies_to: AppliesTo;
  is_vat: boolean;
  effective_date: string; // ISO date string
  expiry_date: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}
