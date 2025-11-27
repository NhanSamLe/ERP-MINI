import { createAsyncThunk } from "@reduxjs/toolkit";
import { getErrorMessage } from "../../../../../utils/ErrorHelper";
import { warehouseService } from "../../../services/warehouse.service";

export const fetchWarehousesThunk = createAsyncThunk(
  "warehouse/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await warehouseService.getAllWarehouses();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);
