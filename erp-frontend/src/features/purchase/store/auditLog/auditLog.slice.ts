import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchAuditLogsThunk } from "./auditLog.thunks";

export interface AuditLog {
  id: number;
  po_id: number;
  action: "CREATE" | "UPDATE" | "APPROVE" | "CANCEL";
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  changed_by: number;
  changed_by_name: string;
  changed_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLogState {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
}

const initialState: AuditLogState = {
  logs: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
};

export const auditLogSlice = createSlice({
  name: "auditLog",
  initialState,
  reducers: {
    clearAuditLogs(state) {
      state.logs = [];
      state.pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAuditLogsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload.logs;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAuditLogsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAuditLogs } = auditLogSlice.actions;
export default auditLogSlice.reducer;
