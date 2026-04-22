import { stockLocationApi } from "../api/stockLocation.api";
import {
  StockLocation,
  StockLocationType,
  CreateLocationDTO,
  UpdateLocationDTO,
} from "../store/stock/stocklocation/stockLocation.types";

export const stockLocationService = {
  async getAll(warehouseId: number): Promise<StockLocation[]> {
    return stockLocationApi.getAll(warehouseId);
  },

  async getTree(warehouseId: number): Promise<StockLocation[]> {
    return stockLocationApi.getTree(warehouseId);
  },

  async getById(id: number): Promise<StockLocation> {
    return stockLocationApi.getById(id);
  },

  async getByType(
    warehouseId: number,
    type: StockLocationType,
  ): Promise<StockLocation[]> {
    return stockLocationApi.getByType(warehouseId, type);
  },

  async create(data: CreateLocationDTO): Promise<StockLocation> {
    return stockLocationApi.create(data);
  },

  async update(id: number, data: UpdateLocationDTO): Promise<StockLocation> {
    return stockLocationApi.update(id, data);
  },

  async delete(id: number): Promise<void> {
    return stockLocationApi.delete(id);
  },
};
