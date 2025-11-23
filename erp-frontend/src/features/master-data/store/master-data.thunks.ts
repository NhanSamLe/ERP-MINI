import { createAsyncThunk } from "@reduxjs/toolkit";
import * as currencyService from "../service/currency.service";
import { getErrorMessage } from "../../../utils/ErrorHelper";

export const fetchCurrencies = createAsyncThunk(
  "currency/fetchCurrencies",
  async (_, { rejectWithValue }) => {
    try {
      const data = await currencyService.getCurrencies();
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchRealCurrencies = createAsyncThunk(
  "currency/fetchRealCurrencies",
  async (_, { rejectWithValue }) => {
    try {
      const data = await currencyService.getRealCurrencies();
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addCurrencyThunk = createAsyncThunk(
  "currency/addCurrency",
  async (code: string, { rejectWithValue }) => {
    try {
      const data = await currencyService.addCurrency(code);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);