import { createAsyncThunk } from "@reduxjs/toolkit";
import * as convService from "../../../service/uomConversion.service";
import {
  CreateUomConversionDto,
  UpdateUomConversionDto,
} from "../../../dto/uom.dto";
import { getErrorMessage } from "../../../../../utils/ErrorHelper";
export const fetchAllConversionsThunk = createAsyncThunk(
  "conversion/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await convService.getAllUomConversions();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// 🔹 CRUD
export const createConversionThunk = createAsyncThunk(
  "conversion/create",
  async (data: CreateUomConversionDto, { rejectWithValue }) => {
    try {
      return await convService.createUomConversion(data);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const updateConversionThunk = createAsyncThunk(
  "conversion/update",
  async (
    payload: { id: number; data: UpdateUomConversionDto },
    { rejectWithValue }
  ) => {
    try {
      return await convService.updateUomConversion(payload.id, payload.data);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const deleteConversionThunk = createAsyncThunk(
  "conversion/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await convService.deleteUomConversion(id);
      return id;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);