export type AttendanceStatus = "present" | "absent" | "leave" | "late";

export interface AttendanceDTO {
  id: number;
  work_date: string; // yyyy-mm-dd
  status: AttendanceStatus;
  check_in?: string | null;
  check_out?: string | null;
  note?: string | null;
}

export interface PayrollEvidenceDTO {
  run: { id: number; run_no: string; status: "draft" | "posted" };
  period: { id: number; start_date: string; end_date: string };
  employee: { id: number; full_name: string; base_salary: number };

  attendance: AttendanceDTO[];

  summary: {
    presentDays: number;
    leaveDays: number;
    absentDays: number;
    lateDays: number;
  };

  breakdown: {
    dailyRate: number;
    basePay: number;
    allowance: number;
    absentDeduction: number;
    lateDeduction: number;
    net: number;
    storedAmount: number | null;
    diff: number | null;
  };
}
