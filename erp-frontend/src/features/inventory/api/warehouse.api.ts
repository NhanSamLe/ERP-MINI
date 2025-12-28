import axiosClient from "../../../api/axiosClient";
import { WarehouseDTO } from "../store";
export const warehouseApi = {
  getAllWarehouses: async () => {
    const res = await axiosClient.get("/warehouse");
    return res.data;
  },
  getWarehouseById: async (id: number) => {
    const res = await axiosClient.get(`/warehouse/${id}`);
    return res.data;
  },
  createWarehouse: async (data: WarehouseDTO) => {
    const res = await axiosClient.post("/warehouse", data);
    return res.data;
  },

  updateWarehouse: async (id: number, data: WarehouseDTO) => {
    const res = await axiosClient.put(`/warehouse/${id}`, data);
    return res.data;
  },

  deleteWarehouse: async (id: number) => {
    const res = await axiosClient.delete(`/warehouse/${id}`);
    return res.data;
  },
};
