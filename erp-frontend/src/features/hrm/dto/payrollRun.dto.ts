export type PayrollRunStatus = "draft" | "posted";

export interface PayrollRunDTO {
  id?: number;
  period_id: number;
  run_no: string;
  status: PayrollRunStatus;
  created_at?: string;
  updated_at?: string;

  // nếu BE include thêm
  period?: {
    id: number;
    period_code: string;
    start_date: string;
    end_date: string;
    status: string;
    branch?: {
      id: number;
      code: string;
      name: string;
    };
  };

  // dùng cho detail
  lines?: PayrollRunLineDTO[];
}

export interface PayrollRunLineDTO {
  id?: number;
  run_id: number;
  employee_id: number;
  amount: number;
  employee?: {
    id: number;
    code?: string;
    full_name?: string;
  };
}

export interface PayrollRunFilter {
  period_id?: number;
  status?: PayrollRunStatus | "all";
}
