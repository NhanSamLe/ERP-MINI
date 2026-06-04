import apiClient from "../../../api/axiosClient";
import { LeaveRequestDTO } from "../dto/leaveRequest.dto";

export const leaveRequestApi = {
  getAll(filter?: any) {
    return apiClient.get("/hrm/leave-requests", { params: filter });
  },

  getByEmployee(employeeId: number) {
    return apiClient.get(`/hrm/leave-requests/employee/${employeeId}`);
  },

  create(data: LeaveRequestDTO) {
    return apiClient.post("/hrm/leave-requests", data);
  },

  approve(id: number) {
    return apiClient.post(`/hrm/leave-requests/${id}/approve`);
  },

  reject(id: number) {
    return apiClient.post(`/hrm/leave-requests/${id}/reject`);
  },
};
