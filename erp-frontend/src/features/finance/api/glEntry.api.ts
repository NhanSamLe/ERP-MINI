import apiClient from "../../../api/axiosClient";

export const glEntryApi = {
  listByJournal: (journalId: number, params?: any) =>
    apiClient.get(`/finance/gl-journals/journals/${journalId}/entries`, { params }),

  getDetail: (id: number) =>
    apiClient.get(`/finance/gl-journals/entries/${id}`),
};
