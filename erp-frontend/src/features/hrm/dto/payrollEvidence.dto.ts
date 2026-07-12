export type AttendanceStatus = "present" | "absent" | "leave" | "late" | "holiday";

export interface AttendanceDTO {
  id: number;
  work_date: string; // yyyy-mm-dd
  status: AttendanceStatus;
  check_in?: string | null;
  check_out?: string | null;
  note?: string | null;
}

export interface PayrollEvidenceDTO {
  lineId?: number | null;
  run: { id: number; run_no: string; status: "draft" | "posted" };
  period: { id: number; start_date: string; end_date: string };
  employee: { id: number; full_name: string;  base_salary: number;
  contract_type: string;
  dependent: number; };

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
    gross: number;
    absentDeduction: number;
    lateDeduction: number;
    insuranceEmp: number;
    pit: number;
    net: number;
    storedAmount: number | null;
    diff: number | null;
  }
}
