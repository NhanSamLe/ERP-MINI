import apiClient from "../../../api/axiosClient";
import { AttendanceDTO } from "../dto/attendance.dto";

export const attendanceApi = {
  getAll(filter?: any) {
    return apiClient.get("/attendance", { params: filter });
  },

  getByEmployee(employeeId: number) {
    return apiClient.get(`/attendance/employee/${employeeId}`);
  },

  create(data: AttendanceDTO) {
    return apiClient.post("/attendance", data);
  },

  update(id: number, data: Partial<AttendanceDTO>) {
    return apiClient.put(`/attendance/${id}`, data);
  },

  remove(id: number) {
    return apiClient.delete(`/attendance/${id}`);
  },
};
