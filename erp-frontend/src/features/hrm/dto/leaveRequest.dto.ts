export interface LeaveRequestDTO {
  id?: number;
  employee_id: number;
  branch_id: number;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  half_day: "none" | "morning" | "afternoon";
  leave_type: "annual" | "sick" | "unpaid" | "maternity";
  reason?: string | null;
  status?: "pending" | "approved" | "rejected";
  approved_by?: number | null;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string;

  // relations
  employee?: { id: number; full_name: string; emp_code: string };
  branch?: { id: number; code: string; name: string };
}
