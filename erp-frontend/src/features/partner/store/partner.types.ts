export type PartnerType = "customer" | "supplier" | "internal";
export type PartnerStatus = "active" | "inactive";

export interface Partner {
  id: number;
  type: PartnerType;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  tax_code?: string;
  cccd?: string;
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  bank_account?: string;
  bank_name?: string;
  status: PartnerStatus;
  created_at?: string;
  updated_at?: string;
}

export interface PartnerFilter {
  type?: PartnerType;
  status?: PartnerStatus;
  search?: string;
}
