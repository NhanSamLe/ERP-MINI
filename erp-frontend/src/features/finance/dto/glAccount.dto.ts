export type GlAccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

export type NormalSide = "debit" | "credit";

export interface GlAccountDTO {
  id?: number;
  code: string;
  name: string;
  type: GlAccountType;
  normal_side: NormalSide;
  parent_id?: number | null;
  parent?: { id: number; code: string; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface GlAccountFilter {
  search?: string;
}
