import { auditLogApi } from "../../../api/auditLog.api";
import { AuditLogFilter } from "../auditLog.thunks";

export const auditLogService = {
  async getAuditLogs(
    po_id: number,
    filters?: AuditLogFilter,
  ): Promise<{ logs: any[]; pagination: any }> {
    const res = await auditLogApi.getAuditLogs(po_id, filters);
    return res;
  },

  async getAuditHistory(po_id: number): Promise<any[]> {
    const res = await auditLogApi.getAuditHistory(po_id);
    return res;
  },
};
