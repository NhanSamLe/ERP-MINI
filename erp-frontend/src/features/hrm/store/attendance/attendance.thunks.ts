import { createAsyncThunk } from "@reduxjs/toolkit";
import { attendanceApi } from "../../api/attendance.api";
import { AttendanceDTO } from "../../dto/attendance.dto";

export const fetchAttendances = createAsyncThunk(
  "attendance/fetchAll",
  async (filter: any) => {
    const res = await attendanceApi.getAll(filter);
    return res.data;
  }
);

export const createAttendance = createAsyncThunk(
  "attendance/create",
  async (data: AttendanceDTO) => {
    const res = await attendanceApi.create(data);
    return res.data;
  }
);

export const updateAttendance = createAsyncThunk(
  "attendance/update",
  async ({ id, data }: { id: number; data: Partial<AttendanceDTO> }) => {
    const res = await attendanceApi.update(id, data);
    return res.data;
  }
);

export const deleteAttendance = createAsyncThunk(
  "attendance/delete",
  async (id: number) => {
    await attendanceApi.remove(id);
    return id;
  }
);
