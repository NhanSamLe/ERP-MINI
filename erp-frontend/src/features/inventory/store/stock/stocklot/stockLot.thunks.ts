import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  stockLotApi,
  CreateLotDTO,
  UpdateLotDTO,
} from "../../../api/stockLot.api";
import { getErrorMessage } from "../../../../../utils/ErrorHelper";

export const fetchLotsThunk = createAsyncThunk(
  "stockLot/fetchAll",
  async (
    params: { productId?: number; supplierId?: number } | undefined,
    { rejectWithValue },
  ) => {
    try {
      return await stockLotApi.getAll(params);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchLotByIdThunk = createAsyncThunk(
  "stockLot/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      return await stockLotApi.getById(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchLotsByProductThunk = createAsyncThunk(
  "stockLot/fetchByProduct",
  async (productId: number, { rejectWithValue }) => {
    try {
      return await stockLotApi.getByProduct(productId);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchExpiringLotsThunk = createAsyncThunk(
  "stockLot/fetchExpiring",
  async (days: number = 30, { rejectWithValue }) => {
    try {
      return await stockLotApi.getExpiring(days);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const createLotThunk = createAsyncThunk(
  "stockLot/create",
  async (data: CreateLotDTO, { rejectWithValue }) => {
    try {
      return await stockLotApi.create(data);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const updateLotThunk = createAsyncThunk(
  "stockLot/update",
  async (
    { id, data }: { id: number; data: UpdateLotDTO },
    { rejectWithValue },
  ) => {
    try {
      return await stockLotApi.update(id, data);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const deleteLotThunk = createAsyncThunk(
  "stockLot/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await stockLotApi.delete(id);
      return id;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
