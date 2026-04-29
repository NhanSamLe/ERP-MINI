// documentIntelligence.thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { documentIntelligenceApi } from "../../api/documentIntelligence.api";
import {
  StatusResponse,
  EnrichedResult,
  ConfirmPayload,
  HistoryParams,
  HistoryResponse,
} from "./documentIntelligence.types";
import { getErrorMessage } from "@/utils/ErrorHelper";

/* ===== UPLOAD ===== */
export const uploadDocumentThunk = createAsyncThunk<
  { documentId: number; status: string },
  File,
  { rejectValue: string }
>("documentIntelligence/upload", async (file, { rejectWithValue }) => {
  try {
    return await documentIntelligenceApi.uploadDocument(file);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* ===== POLL STATUS ===== */
export const pollDocumentStatusThunk = createAsyncThunk<
  StatusResponse,
  number,
  { rejectValue: string }
>("documentIntelligence/pollStatus", async (id, { rejectWithValue }) => {
  try {
    return await documentIntelligenceApi.getStatus(id);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* ===== GET RESULT ===== */
export const getDocumentResultThunk = createAsyncThunk<
  EnrichedResult,
  number,
  { rejectValue: string }
>("documentIntelligence/getResult", async (id, { rejectWithValue }) => {
  try {
    return await documentIntelligenceApi.getResult(id);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* ===== CONFIRM ===== */
export const confirmDocumentThunk = createAsyncThunk<
  { purchase_invoice_id: number },
  { id: number; payload: ConfirmPayload },
  { rejectValue: string }
>(
  "documentIntelligence/confirm",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await documentIntelligenceApi.confirmDocument(id, payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/* ===== HISTORY ===== */
export const getDocumentHistoryThunk = createAsyncThunk<
  HistoryResponse,
  HistoryParams,
  { rejectValue: string }
>("documentIntelligence/getHistory", async (params, { rejectWithValue }) => {
  try {
    return await documentIntelligenceApi.getHistory(params);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});
