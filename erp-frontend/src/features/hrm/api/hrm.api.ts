import apiClient from "../../../api/axiosClient";

export interface PayrollConfigDTO {
  id: number;
  config_key: string;
  config_value: string;
  description?: string | null;
}

export const hrmConfigApi = {
  getPayrollConfigs: () =>
    apiClient.get<PayrollConfigDTO[]>("/hrm/payroll-configs"),
  updatePayrollConfigs: (data: Record<string, string | number>) =>
    apiClient.post<{ success: boolean; message: string; data: PayrollConfigDTO[] }>(
      "/hrm/payroll-configs",
      data
    ),
};
