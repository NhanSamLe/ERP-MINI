// src/features/stock/store/stock/stockmove/stockMove.thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { stockMoveService } from "../../../services/stockMove.service";
import {
  StockMove,
  StockMoveAdjustmentCreate,
  StockMoveAdjustmentUpdate,
  StockMoveCreate,
  StockMoveTransferCreate,
  StockMoveTransferUpdate,
  StockMoveUpdate,
} from "./stockMove.types";
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

export const createReceiptStockMoveThunk = createAsyncThunk<
  StockMove,
  StockMoveCreate
>("stockMove/createReceipt", async (data, { rejectWithValue }) => {
  try {
    return await stockMoveService.createReceiptStockMove(data);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const createTransferStockMoveThunk = createAsyncThunk<
  StockMove,
  StockMoveTransferCreate
>("stockMove/createTransfer", async (data, { rejectWithValue }) => {
  try {
    return await stockMoveService.createTransferStockMove(data);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const createAdjustmentStockMoveThunk = createAsyncThunk<
  StockMove,
  StockMoveAdjustmentCreate
>("stockMove/createAdjustment", async (data, { rejectWithValue }) => {
  try {
    return await stockMoveService.createAdjustmentStockMove(data);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const updateReceiptStockMoveThunk = createAsyncThunk<
  StockMove,
  { id: number; data: StockMoveUpdate }
>("stockMove/updateReceipt", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await stockMoveService.updateReceiptStockMove(id, data);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const updateTransferStockMoveThunk = createAsyncThunk<
  StockMove,
  { id: number; data: StockMoveTransferUpdate }
>("stockMove/updateTransfer", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await stockMoveService.updateTransferStockMove(id, data);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const updateAdjustmentStockMoveThunk = createAsyncThunk<
  StockMove,
  { id: number; data: StockMoveAdjustmentUpdate }
>("stockMove/updateAdjustment", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await stockMoveService.updateAdjustmentStockMove(id, data);
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
