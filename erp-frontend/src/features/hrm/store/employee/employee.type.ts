export interface EmployeeType {
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

  // JOINs
  department?: {
    id: number;
    code: string;
    name: string;
  } | null;

  position?: {
    id: number;
    name: string;
  } | null;

  branch?: {
    id: number;
    name: string;
  } | null;

  created_at?: string;
  updated_at?: string;
}

export interface EmployeeFilterType {
  search?: string;
  branch_id?: number;
  department_id?: number;
  position_id?: number;
  status?: string;
}
