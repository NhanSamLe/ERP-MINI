export type PayrollItemType = "earning" | "deduction";

export interface PayrollItemDTO {
  id?: number;
  branch_id: number;
  item_code: string;
  name: string;
  type: PayrollItemType;
  is_taxable: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PayrollItemFilter {
  branch_id?: number;
  type?: PayrollItemType | "all";
  search?: string;
}
