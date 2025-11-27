import axiosClient from "../../../api/axiosClient";
import { EmployeeDTO, EmployeeFormPayload, EmployeeFilter } from "../dto/employee.dto";

export const employeeApi = {
  getAll: (filter?: EmployeeFilter) =>
    axiosClient.get<EmployeeDTO[]>("/hrm/employees", { params: filter }),

  getById: (id: number) =>
    axiosClient.get<EmployeeDTO>(`/hrm/employees/${id}`),

  create: (data: EmployeeFormPayload) =>
    axiosClient.post<EmployeeDTO>("/hrm/employees", data),

  update: (id: number, data: EmployeeFormPayload) =>
    axiosClient.put<EmployeeDTO>(`/hrm/employees/${id}`, data),

  remove: (id: number) =>
    axiosClient.delete(`/hrm/employees/${id}`),
};

