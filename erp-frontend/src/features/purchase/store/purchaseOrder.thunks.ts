import { createAsyncThunk } from "@reduxjs/toolkit";
import { purchaseOrderService } from "../purchaseOrder.service";
import {
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
} from "./purchaseOrder.types";

export const fetchPurchaseOrdersThunk = createAsyncThunk(
  "purchaseOrder/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.getAllPO();
      return res;
    } catch (error: unknown) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Unknown error");
    }
  }
);

export const fetchPurchaseOrderByIdThunk = createAsyncThunk(
  "purchaseOrder/fetchOne",
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.getPOById(id);
      return res;
    } catch (error: unknown) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Unknown error");
    }
  }
);

export const fetchPurchaseOrderByStatus = createAsyncThunk(
  "purchaseOrder/fetchByStatus",
  async (status: string, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.getPOByStatus(status);
      return res;
    } catch (error: unknown) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Unknown error");
    }
  }
);

export const createPurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/create",
  async (body: PurchaseOrderCreate, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.create(body);
      return res;
    } catch (error: unknown) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Unknown error");
    }
  }
);

export const updatePurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/update",
  async (
    { id, body }: { id: number; body: PurchaseOrderUpdate },
    { rejectWithValue }
  ) => {
    try {
      const res = await purchaseOrderService.update(id, body);
      return res;
    } catch (error: unknown) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Unknown error");
    }
  }
);

export const deletePurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await purchaseOrderService.delete(id);
      return id;
    } catch (error: unknown) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Unknown error");
    }
  }
);
