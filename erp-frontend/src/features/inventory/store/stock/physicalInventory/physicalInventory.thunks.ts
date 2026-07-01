import { createAsyncThunk } from "@reduxjs/toolkit";
import { physicalInventoryService } from "../../../services/physicalInventory.service";
import { CreateInventoryDTO } from "./physicalInventory.types";
import { getErrorMessage } from "../../../../../utils/ErrorHelper";

export const fetchPhysicalInventoriesThunk = createAsyncThunk(
  "physicalInventory/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await physicalInventoryService.getAll();
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchPhysicalInventoryByIdThunk = createAsyncThunk(
  "physicalInventory/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      return await physicalInventoryService.getById(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const createPhysicalInventoryThunk = createAsyncThunk(
  "physicalInventory/create",
  async (data: CreateInventoryDTO, { rejectWithValue }) => {
    try {
      return await physicalInventoryService.create(data);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const startPhysicalInventoryThunk = createAsyncThunk(
  "physicalInventory/start",
  async (id: number, { rejectWithValue }) => {
    try {
      return await physicalInventoryService.start(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const validatePhysicalInventoryThunk = createAsyncThunk(
  "physicalInventory/validate",
  async (id: number, { rejectWithValue }) => {
    try {
      return await physicalInventoryService.validate(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const submitPhysicalInventoryThunk = createAsyncThunk(
  "physicalInventory/submit",
  async (id: number, { rejectWithValue }) => {
    try {
      return await physicalInventoryService.submit(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const approvePhysicalInventoryThunk = createAsyncThunk(
  "physicalInventory/approve",
  async (id: number, { rejectWithValue }) => {
    try {
      return await physicalInventoryService.approve(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const rejectPhysicalInventoryThunk = createAsyncThunk(
  "physicalInventory/reject",
  async (
    { id, reject_reason }: { id: number; reject_reason: string },
    { rejectWithValue },
  ) => {
    try {
      return await physicalInventoryService.reject(id, reject_reason);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const cancelPhysicalInventoryThunk = createAsyncThunk(
  "physicalInventory/cancel",
  async (id: number, { rejectWithValue }) => {
    try {
      return await physicalInventoryService.cancel(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
