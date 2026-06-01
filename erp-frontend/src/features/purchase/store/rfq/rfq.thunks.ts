import { createAsyncThunk } from "@reduxjs/toolkit";
import { rfqApi } from "../../api/rfq.api";
import { getErrorMessage } from "@/utils/ErrorHelper";

export const fetchRfqsThunk = createAsyncThunk(
  "rfq/fetchAll",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      return await rfqApi.getAll(params);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchRfqByIdThunk = createAsyncThunk(
  "rfq/fetchOne",
  async (id: number, { rejectWithValue }) => {
    try {
      return await rfqApi.getById(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const createRfqThunk = createAsyncThunk(
  "rfq/create",
  async (body: Parameters<typeof rfqApi.create>[0], { rejectWithValue }) => {
    try {
      return await rfqApi.create(body);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const updateRfqThunk = createAsyncThunk(
  "rfq/update",
  async (
    { id, body }: { id: number; body: Parameters<typeof rfqApi.update>[1] },
    { rejectWithValue },
  ) => {
    try {
      return await rfqApi.update(id, body);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const deleteRfqThunk = createAsyncThunk(
  "rfq/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await rfqApi.delete(id);
      return id;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const sendRfqThunk = createAsyncThunk(
  "rfq/send",
  async (id: number, { rejectWithValue }) => {
    try {
      return await rfqApi.send(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const markRfqReceivedThunk = createAsyncThunk(
  "rfq/markReceived",
  async (id: number, { rejectWithValue }) => {
    try {
      return await rfqApi.markReceived(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const acceptRfqThunk = createAsyncThunk(
  "rfq/accept",
  async (id: number, { rejectWithValue }) => {
    try {
      return await rfqApi.accept(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const rejectRfqThunk = createAsyncThunk(
  "rfq/reject",
  async (id: number, { rejectWithValue }) => {
    try {
      return await rfqApi.reject(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const convertRfqToPoThunk = createAsyncThunk(
  "rfq/convertToPo",
  async (id: number, { rejectWithValue }) => {
    try {
      return await rfqApi.convertToPo(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const createRfqVersionThunk = createAsyncThunk(
  "rfq/newVersion",
  async (id: number, { rejectWithValue }) => {
    try {
      return await rfqApi.createNewVersion(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const compareRfqsThunk = createAsyncThunk(
  "rfq/compare",
  async (ids: number[], { rejectWithValue }) => {
    try {
      return await rfqApi.compare(ids);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const submitRfqThunk = createAsyncThunk(
  "rfq/submit",
  async (id: number, { rejectWithValue }) => {
    try {
      return await rfqApi.submit(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const approveRfqThunk = createAsyncThunk(
  "rfq/approve",
  async (id: number, { rejectWithValue }) => {
    try {
      return await rfqApi.approve(id);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const rejectRfqApprovalThunk = createAsyncThunk(
  "rfq/rejectApproval",
  async (
    { id, reason }: { id: number; reason: string },
    { rejectWithValue },
  ) => {
    try {
      return await rfqApi.rejectApproval(id, reason);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
