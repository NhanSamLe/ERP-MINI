import apiClient from "../../../api/axiosClient";
import { PayrollItemDTO, PayrollItemFilter } from "../dto/payrollItem.dto";

export const payrollItemApi = {
  getAll: (params?: PayrollItemFilter) =>
    apiClient.get("/hrm/payroll-items", { params }),

  create: (data: PayrollItemDTO) =>
    apiClient.post("/hrm/payroll-items", data),

  update: (id: number, data: Partial<PayrollItemDTO>) =>
    apiClient.put(`/hrm/payroll-items/${id}`, data),

  remove: (id: number) => apiClient.delete(`/hrm/payroll-items/${id}`),
};
