export interface BranchState {
    branches: Branch[];
    loading: boolean;
    error?: string | null;
}
export interface Branch {
    id: number;
  company_id: number;
  code: string;
  name: string;
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  tax_code?: string;
  bank_account?: string;
  bank_name?: string;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}