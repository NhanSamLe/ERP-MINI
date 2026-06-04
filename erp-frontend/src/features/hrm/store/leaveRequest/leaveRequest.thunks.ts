import { createAsyncThunk } from "@reduxjs/toolkit";
import { leaveRequestApi } from "../../api/leaveRequest.api";
import { LeaveRequestDTO } from "../../dto/leaveRequest.dto";

export const fetchLeaveRequests = createAsyncThunk(
  "leaveRequest/fetchAll",
  async (filter: any) => {
    const res = await leaveRequestApi.getAll(filter);
    return res.data;
  }
);

export const fetchEmployeeLeaveRequests = createAsyncThunk(
  "leaveRequest/fetchByEmployee",
  async (employeeId: number) => {
    const res = await leaveRequestApi.getByEmployee(employeeId);
    return res.data;
  }
);

export const createLeaveRequest = createAsyncThunk(
  "leaveRequest/create",
  async (data: LeaveRequestDTO) => {
    const res = await leaveRequestApi.create(data);
    return res.data;
  }
);

export const approveLeaveRequest = createAsyncThunk(
  "leaveRequest/approve",
  async (id: number) => {
    const res = await leaveRequestApi.approve(id);
    return res.data; // returns the updated leave request row
  }
);

export const rejectLeaveRequest = createAsyncThunk(
  "leaveRequest/reject",
  async (id: number) => {
    const res = await leaveRequestApi.reject(id);
    return res.data;
  }
);
