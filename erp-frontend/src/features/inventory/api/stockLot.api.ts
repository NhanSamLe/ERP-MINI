import axiosClient from "../../../api/axiosClient";
import {
  StockLot,
  CreateLotDTO,
  UpdateLotDTO,
} from "../store/stock/stocklot/stockLot.types";

export type { StockLot };

export const stockLotApi = {
  getAll: async (params?: {
    productId?: number;
    supplierId?: number;
  }): Promise<StockLot[]> => {
    const res = await axiosClient.get("/lots", { params });
    return res.data;
  },

  getById: async (id: number): Promise<StockLot> => {
    const res = await axiosClient.get(`/lots/${id}`);
    return res.data;
  },

  getByProduct: async (productId: number): Promise<StockLot[]> => {
    const res = await axiosClient.get(`/product/${productId}/lots`);
    return res.data;
  },

  getExpiring: async (days = 30): Promise<StockLot[]> => {
    const res = await axiosClient.get("/lots/expiring", { params: { days } });
    return res.data;
  },

  create: async (data: CreateLotDTO): Promise<StockLot> => {
    const res = await axiosClient.post("/lots", data);
    return res.data;
  },

  update: async (id: number, data: UpdateLotDTO): Promise<StockLot> => {
    const res = await axiosClient.put(`/lots/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/lots/${id}`);
  },
};
