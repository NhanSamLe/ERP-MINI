import { warehouseApi } from "../api/warehouse.api";
import { getErrorMessage } from "../../../utils/ErrorHelper";

export const warehouseService = {
  async getAllWarehouses() {
    try {
      return await warehouseApi.getAllWarehouses();
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
