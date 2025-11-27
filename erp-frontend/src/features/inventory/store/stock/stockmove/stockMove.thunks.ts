// src/features/stock/store/stock/stockmove/stockMove.thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { stockMoveService } from "../../../services/stockMove.service";
import { StockMove, StockMoveCreate, StockMoveUpdate } from "./stockMove.types";
import { getErrorMessage } from "../../../../../utils/ErrorHelper";

export const fetchStockMovesThunk = createAsyncThunk<StockMove[]>(
  "stockMove/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await stockMoveService.getAll();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchStockMoveByIdThunk = createAsyncThunk<StockMove, number>(
  "stockMove/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      return await stockMoveService.getById(id);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createStockMoveThunk = createAsyncThunk<
  StockMove,
  StockMoveCreate
>("stockMove/create", async (data, { rejectWithValue }) => {
  try {
    return await stockMoveService.create(data);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const updateStockMoveThunk = createAsyncThunk<
  StockMove,
  { id: number; data: StockMoveUpdate }
>("stockMove/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await stockMoveService.update(id, data);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const deleteStockMoveThunk = createAsyncThunk<number, number>(
  "stockMove/delete",
  async (id, { rejectWithValue }) => {
    try {
      await stockMoveService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);
