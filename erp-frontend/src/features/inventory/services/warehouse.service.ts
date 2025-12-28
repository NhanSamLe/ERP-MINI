import { warehouseApi } from "../api/warehouse.api";
import { getErrorMessage } from "../../../utils/ErrorHelper";
import { WarehouseDTO } from "../store/stock/warehouse/warehouse.types";

export const warehouseService = {
  async getAllWarehouses() {
    try {
      return await warehouseApi.getAllWarehouses();
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getWarehouseById(id: number) {
    try {
      return await warehouseApi.getWarehouseById(id);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async createWarehouse(data: WarehouseDTO) {
    try {
      return await warehouseApi.createWarehouse(data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async updateWarehouse(id: number, data: WarehouseDTO) {
    try {
      return await warehouseApi.updateWarehouse(id, data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async deleteWarehouse(id: number) {
    try {
      return await warehouseApi.deleteWarehouse(id);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
