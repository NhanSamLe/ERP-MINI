import { createAsyncThunk } from "@reduxjs/toolkit";
import * as taxService from "../../../service/tax.service";
import { CreateTaxRateDto, UpdateTaxRateDto } from "../../../dto/tax.dto";
import { getErrorMessage } from "../../../../../utils/ErrorHelper";

// 🔹 Get all tax
export const fetchAllTaxRatesThunk = createAsyncThunk(
  "tax/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await taxService.getAllTaxRates();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const fetchTaxRatesByIdThunk = createAsyncThunk(
  "tax/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await taxService.getTaxRateById(id);
      console.log("Fetched Tax Rate:", res);
      return res;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// 🔹 Create
export const createTaxRateThunk = createAsyncThunk(
  "tax/create",
  async (data: CreateTaxRateDto, { rejectWithValue }) => {
    try {
      return await taxService.createTaxRate(data);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// 🔹 Update
export const updateTaxRateThunk = createAsyncThunk(
  "tax/update",
  async (
    payload: { id: number; data: UpdateTaxRateDto },
    { rejectWithValue }
  ) => {
    try {
      return await taxService.updateTaxRate(payload.id, payload.data);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// 🔹 Delete
export const deleteTaxRateThunk = createAsyncThunk(
  "tax/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await taxService.deleteTaxRate(id);
      return id;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);
