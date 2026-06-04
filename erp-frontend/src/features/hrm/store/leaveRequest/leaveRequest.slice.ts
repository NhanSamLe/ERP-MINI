import { createSlice } from "@reduxjs/toolkit";
import {
  fetchLeaveRequests,
  fetchEmployeeLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "./leaveRequest.thunks";
import { LeaveRequestDTO } from "../../dto/leaveRequest.dto";

export interface LeaveRequestState {
  list: LeaveRequestDTO[];
  loading: boolean;
  error: string | null;
}

const initialState: LeaveRequestState = {
  list: [],
  loading: false,
  error: null,
};

const leaveRequestSlice = createSlice({
  name: "leaveRequest",
  initialState,
  reducers: {
    clearLeaveRequestsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // GET ALL
      .addCase(fetchLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
        state.list = action.payload;
        state.loading = false;
      })
      .addCase(fetchLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch leave requests";
      })

      // GET BY EMPLOYEE
      .addCase(fetchEmployeeLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeLeaveRequests.fulfilled, (state, action) => {
        state.list = action.payload;
        state.loading = false;
      })
      .addCase(fetchEmployeeLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch employee leave requests";
      })

      // CREATE
      .addCase(createLeaveRequest.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })

      // APPROVE
      .addCase(approveLeaveRequest.fulfilled, (state, action) => {
        const idx = state.list.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) {
          state.list[idx] = action.payload;
        }
      })

      // REJECT
      .addCase(rejectLeaveRequest.fulfilled, (state, action) => {
        const idx = state.list.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) {
          state.list[idx] = action.payload;
        }
      });
  },
});

export const { clearLeaveRequestsError } = leaveRequestSlice.actions;
export default leaveRequestSlice.reducer;
