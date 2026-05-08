import { createAsyncThunk } from "@reduxjs/toolkit";
import { auditLogService } from "./services/auditLog.service";
import { getErrorMessage } from "@/utils/ErrorHelper";

export interface AuditLogFilter {
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export const fetchAuditLogsThunk = createAsyncThunk<
  { logs: any[]; pagination: any },
  { po_id: number; filters?: AuditLogFilter },
  { rejectValue: string }
>("auditLog/fetchAll", async ({ po_id, filters }, { rejectWithValue }) => {
  try {
    return await auditLogService.getAuditLogs(po_id, filters);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});
