import apiClient from "../../../api/axiosClient";

export const glEntryApi = {
  listByJournal: (journalId: number, params?: any) =>
    apiClient.get(`/finance/gl-journals/journals/${journalId}/entries`, { params }),

  getDetail: (id: number) =>
    apiClient.get(`/finance/gl-journals/entries/${id}`),

  create: (data: any) =>
    apiClient.post("/finance/gl-journals/entries", data),

  updateStatus: (id: number, status: "draft" | "posted") =>
    apiClient.put(`/finance/gl-journals/entries/${id}/status`, { status }),

  getTrialBalance: (params: { from: string; to: string }) =>
    apiClient.get("/finance/gl-journals/reports/trial-balance", { params }),

  getProfitLoss: (params: { from: string; to: string }) =>
    apiClient.get("/finance/gl-journals/reports/profit-loss", { params }),

  getArInvoices: () =>
    apiClient.get("/ar/invoices"),

  getApInvoices: () =>
    apiClient.get("/ap/invoices"),
};
