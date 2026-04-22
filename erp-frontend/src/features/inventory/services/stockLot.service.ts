import { stockLotApi } from "../api/stockLot.api";
import {
  StockLot,
  CreateLotDTO,
  UpdateLotDTO,
} from "../store/stock/stocklot/stockLot.types";

export const stockLotService = {
  async getAll(params?: {
    productId?: number;
    supplierId?: number;
  }): Promise<StockLot[]> {
    return stockLotApi.getAll(params);
  },

  async getById(id: number): Promise<StockLot> {
    return stockLotApi.getById(id);
  },

  async getByProduct(productId: number): Promise<StockLot[]> {
    return stockLotApi.getByProduct(productId);
  },

  async getExpiring(days = 30): Promise<StockLot[]> {
    return stockLotApi.getExpiring(days);
  },

  async create(data: CreateLotDTO): Promise<StockLot> {
    return stockLotApi.create(data);
  },

  async update(id: number, data: UpdateLotDTO): Promise<StockLot> {
    return stockLotApi.update(id, data);
  },

  async delete(id: number): Promise<void> {
    return stockLotApi.delete(id);
  },
};
