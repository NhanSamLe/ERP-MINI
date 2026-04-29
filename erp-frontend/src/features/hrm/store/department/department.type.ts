export interface Department {
  id?: number;
  branch_id: number;
  code: string;
  name: string;
  status?: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentFilter {
  search?: string;
  branch_id?: number;
}
