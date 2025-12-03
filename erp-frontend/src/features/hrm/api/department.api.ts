import axiosClient from "../../../api/axiosClient";
import { Department, DepartmentFilter } from "../store/department/department.type";

export const departmentApi = {
  async getAll(filter?: DepartmentFilter) {
    const res = await axiosClient.get("/hrm/departments", {
      params: filter,
    });
    return res.data;
  },

  async create(data: Department) {
    const res = await axiosClient.post("/hrm/departments", data);
    return res.data;
  },

  async update(id: number, data: Partial<Department>) {
    const res = await axiosClient.put(`/hrm/departments/${id}`, data);
    return res.data;
  },

  async remove(id: number) {
    await axiosClient.delete(`/hrm/departments/${id}`);
  },
};
