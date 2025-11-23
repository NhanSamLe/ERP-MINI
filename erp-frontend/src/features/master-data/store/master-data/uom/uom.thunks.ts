import { createAsyncThunk } from "@reduxjs/toolkit";
import * as uomService from "../../../service/uom.service";
import {
  CreateUomDto, UpdateUomDto
} from "../../../dto/uom.dto";
import { getErrorMessage } from "../../../../../utils/ErrorHelper";

export const fetchAllUomsThunk = createAsyncThunk(
  "uom/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await uomService.getAllUoms();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// 🔹 CRUD
export const createUomThunk = createAsyncThunk(
  "uom/create",
  async (data: CreateUomDto, { rejectWithValue }) => {
    try {
      return await uomService.createUom(data);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const updateUomThunk = createAsyncThunk(
  "uom/update",
  async (payload: { id: number; data: UpdateUomDto }, { rejectWithValue }) => {
    try {
      return await uomService.updateUom(payload.id, payload.data);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const deleteUomThunk = createAsyncThunk(
  "uom/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await uomService.deleteUom(id);
      return id;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);