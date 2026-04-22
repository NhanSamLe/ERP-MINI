import { createAsyncThunk } from "@reduxjs/toolkit";
import { stockLocationService } from "../../../services/stockLocation.service";
import { CreateLocationDTO, UpdateLocationDTO } from "./stockLocation.types";
import { getErrorMessage } from "../../../../../utils/ErrorHelper";

export const fetchLocationsThunk = createAsyncThunk(
  "stockLocation/fetchAll",
  async (warehouseId: number, { rejectWithValue }) => {
    try {
      return await stockLocationService.getAll(warehouseId);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchLocationTreeThunk = createAsyncThunk(
  "stockLocation/fetchTree",
  async (warehouseId: number, { rejectWithValue }) => {
    try {
      return await stockLocationService.getTree(warehouseId);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchLocationByIdThunk = createAsyncThunk(
  "stockLocation/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      return await stockLocationService.getById(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const createLocationThunk = createAsyncThunk(
  "stockLocation/create",
  async (data: CreateLocationDTO, { rejectWithValue }) => {
    try {
      return await stockLocationService.create(data);
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
      return await stockLocationService.update(id, data);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const deleteLocationThunk = createAsyncThunk(
  "stockLocation/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await stockLocationService.delete(id);
      return id;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
