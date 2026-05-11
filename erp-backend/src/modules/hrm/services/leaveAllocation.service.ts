import { LeaveAllocation } from "../models/leaveAllocation.model";

export async function allocateLeave(payload: any) {
  const exists = await LeaveAllocation.findOne({
    where: {
      employee_id: payload.employee_id,
      leave_type_id: payload.leave_type_id,
      year: payload.year,
    },
  });

  if (exists) {
    throw new Error("Allocation already exists");
  }

  return LeaveAllocation.create(payload);
}

export async function listAllocations() {
  return LeaveAllocation.findAll({
    include: ["employee", "leaveType"],
  });
}