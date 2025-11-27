export interface Partner {
  id: number;
  type: "customer" | "supplier" | "internal";
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  tax_code?: string | null;
  cccd?: string | null;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  bank_account?: string | null;
  bank_name?: string | null;
  status: "active" | "inactive";
  created_at: string;   // ISO string
  updated_at: string;   // ISO string
}
