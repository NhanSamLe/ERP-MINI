import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  stockLocationApi,
  CreateLocationDTO,
  UpdateLocationDTO,
} from "../../../api/stockLocation.api";
import { getErrorMessage } from "../../../../../utils/ErrorHelper";

export const fetchLocationsThunk = createAsyncThunk(
  "stockLocation/fetchAll",
  async (warehouseId: number, { rejectWithValue }) => {
    try {
      return await stockLocationApi.getAll(warehouseId);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchLocationTreeThunk = createAsyncThunk(
  "stockLocation/fetchTree",
  async (warehouseId: number, { rejectWithValue }) => {
    try {
      return await stockLocationApi.getTree(warehouseId);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchLocationByIdThunk = createAsyncThunk(
  "stockLocation/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      return await stockLocationApi.getById(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const createLocationThunk = createAsyncThunk(
  "stockLocation/create",
  async (data: CreateLocationDTO, { rejectWithValue }) => {
    try {
      return await stockLocationApi.create(data);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const updateLocationThunk = createAsyncThunk(
  "stockLocation/update",
  async (
    { id, data }: { id: number; data: UpdateLocationDTO },
    { rejectWithValue },
  ) => {
    try {
      return await stockLocationApi.update(id, data);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const deleteLocationThunk = createAsyncThunk(
  "stockLocation/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await stockLocationApi.delete(id);
      return id;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
