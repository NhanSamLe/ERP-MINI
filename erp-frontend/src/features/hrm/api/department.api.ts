import axiosClient from "../../../api/axiosClient";
import { DepartmentDTO, DepartmentFilter } from "../dto/department.dto";

const BASE = "/departments";

export const departmentApi = {
  async getAll(filter?: DepartmentFilter) {
    return axiosClient.get(BASE, { params: filter }).then((res) => res.data);
  },

  async getById(id: number) {
    return axiosClient.get(`${BASE}/${id}`).then((res) => res.data);
  },

  async create(payload: DepartmentDTO) {
    return axiosClient.post(BASE, payload).then((res) => res.data);
  },

  async update(id: number, payload: Partial<DepartmentDTO>) {
    return axiosClient.put(`${BASE}/${id}`, payload).then((res) => res.data);
  },

  async remove(id: number) {
    return axiosClient.delete(`${BASE}/${id}`).then((res) => res.data);
  },
};
