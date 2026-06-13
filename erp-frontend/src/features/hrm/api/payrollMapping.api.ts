import apiClient from "../../../api/axiosClient";
import { DepartmentDTO } from "../dto/department.dto";
import { GlAccountDTO } from "../../finance/dto/glAccount.dto";

export type PayrollMappingItemType =
  | "salary"
  | "social_insurance_company"
  | "social_insurance_employee"
  | "pit"
  | "net_payable";

export interface PayrollAccountMappingDTO {
  id?: number;
  branch_id?: number;
  department_id?: number | null;
  item_type: PayrollMappingItemType;
  account_id: number;
  created_at?: string;
  updated_at?: string;

  // relations
  department?: DepartmentDTO | null;
  gl_account?: GlAccountDTO | null;
}

export const payrollMappingApi = {
  getAll: () =>
    apiClient.get<PayrollAccountMappingDTO[]>("/hrm/payroll-mappings").then(res => res.data),

  create: (data: Partial<PayrollAccountMappingDTO>) =>
    apiClient.post<PayrollAccountMappingDTO>("/hrm/payroll-mappings", data).then(res => res.data),

  update: (id: number, data: Partial<PayrollAccountMappingDTO>) =>
    apiClient.put<PayrollAccountMappingDTO>(`/hrm/payroll-mappings/${id}`, data).then(res => res.data),

  remove: (id: number) =>
    apiClient.delete(`/hrm/payroll-mappings/${id}`).then(res => res.data),
};
