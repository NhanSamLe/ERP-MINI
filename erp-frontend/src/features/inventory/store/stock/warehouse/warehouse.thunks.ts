import { createAsyncThunk } from "@reduxjs/toolkit";
import { warehouseApi } from "../../../api/warehouse.api";
import { getErrorMessage } from "../../../../../utils/ErrorHelper";

export const fetchWarehousesThunk = createAsyncThunk(
  "warehouse/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await warehouseApi.getAllWarehouses();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);
