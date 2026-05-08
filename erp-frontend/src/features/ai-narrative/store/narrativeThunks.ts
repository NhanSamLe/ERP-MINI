import { createAsyncThunk } from "@reduxjs/toolkit";
import * as service from "../service/narrative.service";
import { GenerateNarrativeRequest } from "../types/narrative.types";
import { getErrorMessage } from "@/utils/ErrorHelper";

export const generateNarrativeThunk = createAsyncThunk(
  "narrative/generate",
  async (req: GenerateNarrativeRequest, { rejectWithValue }) => {
    try {
      // Timeout 35s — tránh treo vô hạn trên UI
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Request timeout sau 35 giây")),
          35000,
        ),
      );
      const result = await Promise.race([
        service.generateNarrative(req),
        timeoutPromise,
      ]);
      return result;
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchNarrativeLogsThunk = createAsyncThunk(
  "narrative/fetchLogs",
  async (
    {
      companyId,
      limit,
      offset,
    }: { companyId: number; limit?: number; offset?: number },
    { rejectWithValue },
  ) => {
    try {
      return await service.getNarrativeLogs(companyId, limit, offset);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const fetchCacheStatsThunk = createAsyncThunk(
  "narrative/fetchCacheStats",
  async (companyId: number, { rejectWithValue }) => {
    try {
      return await service.getCacheStats(companyId);
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);

export const clearExpiredCacheThunk = createAsyncThunk(
  "narrative/clearExpiredCache",
  async (_, { rejectWithValue }) => {
    try {
      return await service.clearExpiredCache();
    } catch (e) {
      return rejectWithValue(getErrorMessage(e));
    }
  },
);
