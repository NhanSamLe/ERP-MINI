import axiosClient from "../../../api/axiosClient";

export interface AuditLogFilter {
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export const auditLogApi = {
  getAuditLogs: async (
    po_id: number,
    filters?: AuditLogFilter,
  ): Promise<{ logs: any[]; pagination: any }> => {
    const res = await axiosClient.get(`/purchase-order/${po_id}/audit-logs`, {
      params: filters,
    });
    return {
      logs: res.data.data,
      pagination: res.data.pagination,
    };
  },

  getAuditHistory: async (po_id: number): Promise<any[]> => {
    const res = await axiosClient.get(`/purchase-order/${po_id}/audit-history`);
    return res.data.data;
  },
};
