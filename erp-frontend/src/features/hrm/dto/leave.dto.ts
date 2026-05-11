export interface LeaveTypeDTO {
  id: number;
  name: string;
  is_paid: boolean;
  max_days?: number;
  carry_forward: boolean;
}

export interface LeaveAllocationDTO {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  total_days: number;
  used_days: number;

  employee?: {
    id: number;
    full_name: string;
    emp_code: string;
  };

  leaveType?: LeaveTypeDTO;
}

export interface LeaveRequestDTO {
  id: number;
  employee_id: number;
  leave_type_id: number;
  from_date: string;
  to_date: string;
  total_days: number;
  reason?: string;
  status: "draft" | "pending" | "approved" | "rejected" | "cancelled";
  approved_by?: number;

  employee?: {
    id: number;
    full_name: string;
    emp_code: string;
  };

  leaveType?: LeaveTypeDTO;
}

export interface LeaveRequestPayload {
  leave_type_id: number;
  from_date: string;
  to_date: string;
  total_days: number;
  reason?: string;
}