import { createAsyncThunk } from "@reduxjs/toolkit";
import { stockLotService } from "../../../services/stockLot.service";
import { CreateLotDTO, UpdateLotDTO } from "./stockLot.types";
import { getErrorMessage } from "../../../../../utils/ErrorHelper";

export const fetchLotsThunk = createAsyncThunk(
  "stockLot/fetchAll",
  async (
    params: { productId?: number; supplierId?: number } | undefined,
    { rejectWithValue },
  ) => {
    try {
      return await stockLotService.getAll(params);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchLotByIdThunk = createAsyncThunk(
  "stockLot/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      return await stockLotService.getById(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchLotsByProductThunk = createAsyncThunk(
  "stockLot/fetchByProduct",
  async (productId: number, { rejectWithValue }) => {
    try {
      return await stockLotService.getByProduct(productId);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchExpiringLotsThunk = createAsyncThunk(
  "stockLot/fetchExpiring",
  async (days: number = 30, { rejectWithValue }) => {
    try {
      return await stockLotService.getExpiring(days);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const createLotThunk = createAsyncThunk(
  "stockLot/create",
  async (data: CreateLotDTO, { rejectWithValue }) => {
    try {
      return await stockLotService.create(data);
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
      return await stockLotService.update(id, data);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const deleteLotThunk = createAsyncThunk(
  "stockLot/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await stockLotService.delete(id);
      return id;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
