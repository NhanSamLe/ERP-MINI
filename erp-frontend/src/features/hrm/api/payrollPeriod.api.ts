import apiClient from "../../../api/axiosClient";
import { PayrollPeriodDTO, PayrollPeriodFilter } from "../dto/payrollPeriod.dto";

export const payrollPeriodApi = {
  getAll: (params?: PayrollPeriodFilter) =>
    apiClient.get<PayrollPeriodDTO[]>("/hrm/payroll-period", { params }),

  getById: (id: number) =>
    apiClient.get<PayrollPeriodDTO>(`/hrm/payroll-period/${id}`),

  create: (data: PayrollPeriodDTO) =>
    apiClient.post<PayrollPeriodDTO>("/hrm/payroll-period", data),

  update: (id: number, data: Partial<PayrollPeriodDTO>) =>
    apiClient.put<PayrollPeriodDTO>(`/hrm/payroll-period/${id}`, data),

  close: (id: number) =>
    apiClient.post(`/hrm/payroll-period/${id}/close`),
  remove: (id: number) =>
    apiClient.delete(`/hrm/payroll-period/${id}`),

};
