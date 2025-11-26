import { createAsyncThunk } from "@reduxjs/toolkit";
import { stockBalanceService } from "../../../services/stockBalance.service";
import { StockBalance } from "./stockBalance.types";
import { getErrorMessage } from "../../../../../utils/ErrorHelper";

export const fetchStockBalancesThunk = createAsyncThunk(
  "stockBalance/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await stockBalanceService.getAllStockBalances();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getStockBalanceByIdThunk = createAsyncThunk(
  "stockBalance/getById",
  async (id: number, { rejectWithValue }) => {
    try {
      return await stockBalanceService.getStockBalanceById(id);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createStockBalanceThunk = createAsyncThunk(
  "stockBalance/create",
  async (data: StockBalance, { rejectWithValue }) => {
    try {
      return await stockBalanceService.createStockBalance(data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateStockBalanceThunk = createAsyncThunk(
  "stockBalance/update",
  async (
    { id, data }: { id: number; data: Partial<StockBalance> },
    { rejectWithValue }
  ) => {
    try {
      return await stockBalanceService.updateStockBalance(id, data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteStockBalanceThunk = createAsyncThunk(
  "stockBalance/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await stockBalanceService.deleteStockBalance(id);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);
