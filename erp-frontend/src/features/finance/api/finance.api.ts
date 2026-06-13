import apiClient from "../../../api/axiosClient";

export interface AccountMappingDTO {
  id: number;
  branch_id: number;
  mapping_key: string;
  account_id: number;
  description?: string | null;
  account?: {
    id: number;
    code: string;
    name: string;
  };
  branch?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface UpsertAccountMappingPayload {
  branch_id: number;
  mapping_key: string;
  account_id: number;
  description?: string;
}

export interface FiscalPeriodDTO {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: "open" | "closed";
  closed_at?: string | null;
  closed_by?: number | null;
}

export const financeConfigApi = {
  // Account mappings
  getAccountMappings: (params?: { branch_id?: number }) =>
    apiClient.get<AccountMappingDTO[]>("/finance/account-mappings", { params }),
  upsertAccountMapping: (data: UpsertAccountMappingPayload) =>
    apiClient.post<AccountMappingDTO>("/finance/account-mappings", data),
  deleteAccountMapping: (id: number) =>
    apiClient.delete(`/finance/account-mappings/${id}`),

  // Fiscal periods locking
  getFiscalPeriods: () =>
    apiClient.get<FiscalPeriodDTO[]>("/finance/fiscal-periods"),
  closePeriod: (id: number) =>
    apiClient.post<{ success: boolean; message: string; data: FiscalPeriodDTO }>(
      `/finance/fiscal-periods/${id}/close`
    ),
  openPeriod: (id: number) =>
    apiClient.post<{ success: boolean; message: string; data: FiscalPeriodDTO }>(
      `/finance/fiscal-periods/${id}/open`
    ),

  // Period end closing entries
  runClosingEntries: (periodId: number) =>
    apiClient.post<{ success: boolean; message: string; data: any }>(
      "/finance/fiscal-periods/close-branch",
      { period_id: periodId }
    ),
};
