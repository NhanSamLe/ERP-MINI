import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  praApi,
  purchaseReturnApi,
  apDebitNoteApi,
  vendorRefundApi,
} from "../../api/purchaseReturn.api";
import { getErrorMessage } from "@/utils/ErrorHelper";

// ─── PRA ──────────────────────────────────────────────────────────────────────
export const fetchPrasThunk = createAsyncThunk(
  "pra/fetchAll",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      return await praApi.getAll(params);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const fetchPraByIdThunk = createAsyncThunk(
  "pra/fetchOne",
  async (id: number, { rejectWithValue }) => {
    try {
      return await praApi.getById(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const createPraThunk = createAsyncThunk(
  "pra/create",
  async (body: Parameters<typeof praApi.create>[0], { rejectWithValue }) => {
    try {
      return await praApi.create(body);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const submitPraThunk = createAsyncThunk(
  "pra/submit",
  async (id: number, { rejectWithValue }) => {
    try {
      return await praApi.submit(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const approvePraThunk = createAsyncThunk(
  "pra/approve",
  async (id: number, { rejectWithValue }) => {
    try {
      return await praApi.approve(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const rejectPraThunk = createAsyncThunk(
  "pra/reject",
  async (
    { id, reason }: { id: number; reason: string },
    { rejectWithValue },
  ) => {
    try {
      return await praApi.reject(id, reason);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

// ─── Purchase Return ───────────────────────────────────────────────────────────
export const fetchReturnsThunk = createAsyncThunk(
  "purchaseReturn/fetchAll",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      return await purchaseReturnApi.getAll(params);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const fetchReturnByIdThunk = createAsyncThunk(
  "purchaseReturn/fetchOne",
  async (id: number, { rejectWithValue }) => {
    try {
      return await purchaseReturnApi.getById(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const createReturnThunk = createAsyncThunk(
  "purchaseReturn/create",
  async (
    body: Parameters<typeof purchaseReturnApi.create>[0],
    { rejectWithValue },
  ) => {
    try {
      return await purchaseReturnApi.create(body);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const shipReturnThunk = createAsyncThunk(
  "purchaseReturn/ship",
  async (id: number, { rejectWithValue }) => {
    try {
      return await purchaseReturnApi.ship(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const confirmReturnThunk = createAsyncThunk(
  "purchaseReturn/confirm",
  async (
    {
      id,
      lines,
    }: { id: number; lines: Parameters<typeof purchaseReturnApi.confirm>[1] },
    { rejectWithValue },
  ) => {
    try {
      return await purchaseReturnApi.confirm(id, lines);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const completeReturnThunk = createAsyncThunk(
  "purchaseReturn/complete",
  async (id: number, { rejectWithValue }) => {
    try {
      return await purchaseReturnApi.complete(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

// ─── AP Debit Note ─────────────────────────────────────────────────────────────
export const fetchDebitNotesThunk = createAsyncThunk(
  "apDebitNote/fetchAll",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      return await apDebitNoteApi.getAll(params);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const fetchDebitNoteByIdThunk = createAsyncThunk(
  "apDebitNote/fetchOne",
  async (id: number, { rejectWithValue }) => {
    try {
      return await apDebitNoteApi.getById(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const createDebitNoteFromReturnThunk = createAsyncThunk(
  "apDebitNote/createFromReturn",
  async (returnId: number, { rejectWithValue }) => {
    try {
      return await apDebitNoteApi.createFromReturn(returnId);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const postDebitNoteThunk = createAsyncThunk(
  "apDebitNote/post",
  async (id: number, { rejectWithValue }) => {
    try {
      return await apDebitNoteApi.post(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const cancelDebitNoteThunk = createAsyncThunk(
  "apDebitNote/cancel",
  async (id: number, { rejectWithValue }) => {
    try {
      return await apDebitNoteApi.cancel(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

// ─── Vendor Refund ─────────────────────────────────────────────────────────────
export const fetchVendorRefundsThunk = createAsyncThunk(
  "vendorRefund/fetchAll",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      return await vendorRefundApi.getAll(params);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const fetchVendorRefundByIdThunk = createAsyncThunk(
  "vendorRefund/fetchOne",
  async (id: number, { rejectWithValue }) => {
    try {
      return await vendorRefundApi.getById(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const createVendorRefundThunk = createAsyncThunk(
  "vendorRefund/create",
  async (
    body: Parameters<typeof vendorRefundApi.create>[0],
    { rejectWithValue },
  ) => {
    try {
      return await vendorRefundApi.create(body);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
export const postVendorRefundThunk = createAsyncThunk(
  "vendorRefund/post",
  async (id: number, { rejectWithValue }) => {
    try {
      return await vendorRefundApi.post(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
