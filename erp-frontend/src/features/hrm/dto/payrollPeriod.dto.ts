export type PayrollPeriodStatus = "open" | "processed" | "closed";

export interface PayrollPeriodDTO {
  id?: number;
  branch_id: number;
  period_code: string;
  start_date: string; 
  end_date: string;
  status?: PayrollPeriodStatus;
  created_at?: string;
  updated_at?: string;
}

export interface PayrollPeriodFilter {
  branch_id?: number;
  status?: PayrollPeriodStatus | "all";
  search?: string;
}
