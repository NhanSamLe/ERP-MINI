export interface AttendanceDTO {
  id?: number;
  branch_id: number;
  employee_id: number;
  work_date: string;
  check_in?: string;
  check_out?: string;
  working_hours?: number;
  status?: "present" | "absent" | "leave" | "late";
  note?: string;
}
