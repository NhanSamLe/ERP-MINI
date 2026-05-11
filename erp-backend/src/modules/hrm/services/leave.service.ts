import { LeaveRequest } from "../models/leaveRequest.model";
import { LeaveAllocation } from "../models/leaveAllocation.model";
import { Employee } from "../models/employee.model";

interface UserJwt {
  id: number;
  username: string;
  role: string;
}

export async function createLeaveRequest(payload: any, user: UserJwt) {
  const employee = await Employee.findOne({
    where: { emp_code: user.username },
  });

  if (!employee) throw new Error("Employee not found");

  return LeaveRequest.create({
    employee_id: employee.id,
    leave_type_id: payload.leave_type_id,
    from_date: payload.from_date,
    to_date: payload.to_date,
    total_days: payload.total_days,
    reason: payload.reason,
    status: "draft",
  });
}

export async function submitLeaveRequest(id: number, user: UserJwt) {
  const leave = await LeaveRequest.findByPk(id);
  if (!leave) throw new Error("Leave request not found");

  if (leave.status !== "draft") {
    throw new Error("Only draft requests can be submitted");
  }

  await leave.update({ status: "pending" });
  return leave;
}

export async function cancelLeaveRequest(id: number) {
  const leave = await LeaveRequest.findByPk(id);
  if (!leave) throw new Error("Leave request not found");

  if (!["draft", "pending"].includes(leave.status)) {
    throw new Error("Cannot cancel");
  }

  await leave.update({ status: "cancelled" });
  return leave;
}

export async function listPendingLeaves() {
  return LeaveRequest.findAll({
    where: { status: "pending" },
    include: ["employee", "leaveType"],
  });
}

export async function approveLeave(id: number, user: UserJwt) {
  const leave = await LeaveRequest.findByPk(id);
  if (!leave) throw new Error("Leave request not found");

  if (leave.status !== "pending") {
    throw new Error("Only pending requests can be approved");
  }

  const year = new Date(leave.from_date).getFullYear();

  const allocation = await LeaveAllocation.findOne({
    where: {
      employee_id: leave.employee_id,
      leave_type_id: leave.leave_type_id,
      year,
    },
  });

  if (!allocation) throw new Error("No leave allocation");

  const remaining =
    Number(allocation.total_days) - Number(allocation.used_days);

  if (remaining < Number(leave.total_days)) {
    throw new Error("Insufficient leave balance");
  }

  await allocation.update({
    used_days: Number(allocation.used_days) + Number(leave.total_days),
  });

  await leave.update({
    status: "approved",
    approved_by: user.id,
  });

  return leave;
}

export async function rejectLeave(id: number, user: UserJwt) {
  const leave = await LeaveRequest.findByPk(id);

  if (!leave) throw new Error("Leave request not found");

  await leave.update({
    status: "rejected",
    approved_by: user.id,
  });

  return leave;
}