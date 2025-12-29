import apiClient from "../../../api/axiosClient";
import {
  PayrollRunDTO,
  PayrollRunFilter,
  PayrollRunLineDTO,
} from "../dto/payrollRun.dto";
import { PayrollEvidenceDTO } from "../dto/payrollEvidence.dto";

export const payrollRunApi = {
  getAll: (params?: PayrollRunFilter) =>
    apiClient.get<PayrollRunDTO[]>("/hrm/payroll-runs", { params }),

  getDetail: (id: number) =>
    apiClient.get<PayrollRunDTO>(`/hrm/payroll-runs/${id}`),

  create: (data: { period_id: number; run_no: string }) =>
    apiClient.post<PayrollRunDTO>("/hrm/payroll-runs", data),

  cancel: (id: number) => apiClient.delete(`/hrm/payroll-runs/${id}`),

  postRun: (id: number) =>
    apiClient.post<PayrollRunDTO>(`/hrm/payroll-runs/${id}/post`, {}),

  // lines
  createLine: (runId: number, data: { employee_id: number; amount: number }) =>
    apiClient.post<PayrollRunLineDTO>(
      `/hrm/payroll-runs/${runId}/lines`,
      data
    ),

  updateLine: (lineId: number, data: Partial<PayrollRunLineDTO>) =>
    apiClient.put<PayrollRunLineDTO>(
      `/hrm/payroll-runs/lines/${lineId}`,
      data
    ),

  deleteLine: (lineId: number) =>
    apiClient.delete(`/hrm/payroll-runs/lines/${lineId}`),

  // payslip cho Employee
  getMyPayslips: () =>
    apiClient.get("/hrm/payroll-runs/me/payslips"),

  getMyPayslipInRun: (runId: number) =>
    apiClient.get(`/hrm/payroll-runs/${runId}/my-payslip`),
  calculateRun: (runId: number) =>
  apiClient.post(`/hrm/payroll-runs/${runId}/calculate`, {}),
  getEvidence: (runId: number, employeeId: number) =>
    apiClient.get<PayrollEvidenceDTO>(
      `/hrm/payroll-runs/${runId}/evidence/${employeeId}`
    ),

};
