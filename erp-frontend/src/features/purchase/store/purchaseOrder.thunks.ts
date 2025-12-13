import { createAsyncThunk } from "@reduxjs/toolkit";
import { purchaseOrderService } from "./services/purchaseOrder.service";
import {
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
} from "./purchaseOrder.types";
import { getErrorMessage } from "@/utils/ErrorHelper";

export const fetchPurchaseOrdersThunk = createAsyncThunk(
  "purchaseOrder/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.getAllPO();
      return res;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getPurchaseOrdersAvailableForInvoiceThunk = createAsyncThunk<
  PurchaseOrder[],
  void,
  { rejectValue: string }
>("purchaseOrder/getAvailableForInvoice", async (_, { rejectWithValue }) => {
  try {
    return await purchaseOrderService.getAvailableForInvoice();
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchPurchaseOrderByIdThunk = createAsyncThunk(
  "purchaseOrder/fetchOne",
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.getPOById(id);
      return res;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchPurchaseOrderByStatus = createAsyncThunk(
  "purchaseOrder/fetchByStatus",
  async (status: string, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.getPOByStatus(status);
      return res;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createPurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/create",
  async (body: PurchaseOrderCreate, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.create(body);
      return res;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
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
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deletePurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await purchaseOrderService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const submitPurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/submitApproval",
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await purchaseOrderService.submitForApproval(id);
      return res;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const approvePurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/approve",
  async (id: number) => {
    return await purchaseOrderService.approve(id);
  }
);

export const cancelPurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/cancel",
  async ({ id, reason }: { id: number; reason: string }) => {
    return await purchaseOrderService.cancel(id, reason);
  }
);
