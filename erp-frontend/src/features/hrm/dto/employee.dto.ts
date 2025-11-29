export interface EmployeeDTO {
  id: number;
  branch_id: number;
  emp_code: string;
  full_name: string;
  gender: "male" | "female" | "other";
  birth_date?: string | null;
  cccd?: string | null;
  hire_date?: string | null;
  contract_type: "trial" | "official" | "seasonal";
  department_id?: number | null;
  position_id?: number | null;
  base_salary: number;
  bank_account?: string | null;
  bank_name?: string | null;
  status: "active" | "inactive";
}
export interface EmployeeFormPayload {
  emp_code: string;
  full_name: string;
  gender: string;
  contract_type: string;
  base_salary: number;
  status?: string;

  birth_date?: string | null;
  cccd?: string | null;
  hire_date?: string | null;
  department_id?: number | null;
  position_id?: number | null;
  bank_account?: string | null;
  bank_name?: string | null;

  branch_id: number | null;   // 👈 THÊM DÒNG NÀY
}



export interface EmployeeFilter {
  search?: string;
  branch_id?: number;
  department_id?: number;
  position_id?: number;
  status?: "active" | "inactive";
}
