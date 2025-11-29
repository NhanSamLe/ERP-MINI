import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAttendances,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from "./attendance.thunks";
import { AttendanceDTO } from "../../dto/attendance.dto";

export interface AttendanceState {
  list: AttendanceDTO[];
  loading: boolean;
}

const initialState: AttendanceState = {
  list: [],
  loading: false,
};

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // GET ALL
      .addCase(fetchAttendances.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAttendances.fulfilled, (state, action) => {
        state.list = action.payload;
        state.loading = false;
      })

      // CREATE
      .addCase(createAttendance.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })

      // UPDATE
      .addCase(updateAttendance.fulfilled, (state, action) => {
        const idx = state.list.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })

      // DELETE
      .addCase(deleteAttendance.fulfilled, (state, action) => {
        state.list = state.list.filter((a) => a.id !== action.payload);
      });
  },
});

export default attendanceSlice.reducer;
