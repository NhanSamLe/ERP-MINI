import { createAsyncThunk } from "@reduxjs/toolkit";
import { getErrorMessage } from "../../../../../utils/ErrorHelper";
import { warehouseService } from "../../../services/warehouse.service";
import { WarehouseDTO } from "./warehouse.types";

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

export const fetchWarehouseByIdThunk = createAsyncThunk(
  "warehouse/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      return await warehouseService.getWarehouseById(id);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createWarehouseThunk = createAsyncThunk(
  "warehouse/create",
  async (data: WarehouseDTO, { rejectWithValue }) => {
    try {
      return await warehouseService.createWarehouse(data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateWarehouseThunk = createAsyncThunk(
  "warehouse/update",
  async (
    { id, data }: { id: number; data: WarehouseDTO },
    { rejectWithValue }
  ) => {
    try {
      return await warehouseService.updateWarehouse(id, data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteWarehouseThunk = createAsyncThunk(
  "warehouse/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await warehouseService.deleteWarehouse(id);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);
