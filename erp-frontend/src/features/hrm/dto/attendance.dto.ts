export interface AttendanceDTO {
  id?: number;
  branch_id: number;
  employee_id: number;
  work_date: string; // 'YYYY-MM-DD'

  // sửa hai dòng này:
  check_in?: string | null;   // 'YYYY-MM-DDTHH:mm'
  check_out?: string | null;

  working_hours: number;
  status: "present" | "absent" | "leave" | "late";
  note?: string | null;

  // nếu có join:
  employee?: { id: number; full_name: string };
  branch?: { id: number; name: string };
}
