import axiosClient from "../../../api/axiosClient";
import {
  StockLocation,
  StockLocationType,
  CreateLocationDTO,
  UpdateLocationDTO,
} from "../store/stock/stocklocation/stockLocation.types";

export const stockLocationApi = {
  getAll: async (warehouseId: number): Promise<StockLocation[]> => {
    const res = await axiosClient.get("/locations", {
      params: { warehouseId },
    });
    return res.data;
  },

  getTree: async (warehouseId: number): Promise<StockLocation[]> => {
    const res = await axiosClient.get("/locations/tree", {
      params: { warehouseId },
    });
    return res.data;
  },

  getById: async (id: number): Promise<StockLocation> => {
    const res = await axiosClient.get(`/locations/${id}`);
    return res.data;
  },

  getByType: async (
    warehouseId: number,
    type: StockLocationType,
  ): Promise<StockLocation[]> => {
    const res = await axiosClient.get("/locations/by-type", {
      params: { warehouseId, type },
    });
    return res.data;
  },

  create: async (data: CreateLocationDTO): Promise<StockLocation> => {
    const res = await axiosClient.post("/locations", data);
    return res.data;
  },

  update: async (
    id: number,
    data: UpdateLocationDTO,
  ): Promise<StockLocation> => {
    const res = await axiosClient.put(`/locations/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/locations/${id}`);
  },
};
