import { leaveApi } from "../api/leave.api";
import { LeaveRequestPayload } from "../dto/leave.dto";

export async function fetchLeaveTypes() {
  const res = await leaveApi.getTypes();
  return res.data;
}

export async function fetchLeaveAllocations() {
  const res = await leaveApi.getAllocations();
  return res.data;
}

export async function fetchLeaveRequests() {
  const res = await leaveApi.getRequests();
  return res.data;
}

export async function createLeaveRequest(data: LeaveRequestPayload) {
  const res = await leaveApi.createRequest(data);
  return res.data;
}

export async function approveLeaveRequest(id: number) {
  await leaveApi.approveRequest(id);
}

export async function rejectLeaveRequest(id: number) {
  await leaveApi.rejectRequest(id);
}

export async function cancelLeaveRequest(id: number) {
  await leaveApi.cancelRequest(id);
}
export async function createLeaveType(data: {
  name: string;
  is_paid: boolean;
  carry_forward: boolean;
}) {
  const res = await leaveApi.createType(data);
  return res.data;
}