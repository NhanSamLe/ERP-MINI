import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  GenerateNarrativeResponse,
  NarrativeLog,
  CacheStats,
} from "../types/narrative.types";
import {
  generateNarrativeThunk,
  fetchNarrativeLogsThunk,
  fetchCacheStatsThunk,
} from "./narrativeThunks";

// ─── State ────────────────────────────────────────────────────────────────────

interface NarrativeState {
  // Generate
  result: GenerateNarrativeResponse | null;
  generating: boolean;
  generateError: string | null;

  // Logs
  logs: NarrativeLog[];
  logsTotal: number;
  logsLoading: boolean;

  // Cache stats
  cacheStats: CacheStats | null;
  cacheStatsLoading: boolean;
}

const initialState: NarrativeState = {
  result: null,
  generating: false,
  generateError: null,
  logs: [],
  logsTotal: 0,
  logsLoading: false,
  cacheStats: null,
  cacheStatsLoading: false,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const narrativeSlice = createSlice({
  name: "narrative",
  initialState,
  reducers: {
    clearResult(state) {
      state.result = null;
      state.generateError = null;
    },
  },
  extraReducers: (builder) => {
    // generate
    builder
      .addCase(generateNarrativeThunk.pending, (s) => {
        s.generating = true;
        s.generateError = null;
        s.result = null;
      })
      .addCase(
        generateNarrativeThunk.fulfilled,
        (s, a: PayloadAction<GenerateNarrativeResponse>) => {
          s.generating = false;
          s.result = a.payload;
        },
      )
      .addCase(generateNarrativeThunk.rejected, (s, a) => {
        s.generating = false;
        s.generateError = a.payload as string;
      });

    // logs
    builder
      .addCase(fetchNarrativeLogsThunk.pending, (s) => {
        s.logsLoading = true;
      })
      .addCase(fetchNarrativeLogsThunk.fulfilled, (s, a) => {
        s.logsLoading = false;
        s.logs = a.payload.logs;
        s.logsTotal = a.payload.total;
      })
      .addCase(fetchNarrativeLogsThunk.rejected, (s) => {
        s.logsLoading = false;
      });

    // cache stats
    builder
      .addCase(fetchCacheStatsThunk.pending, (s) => {
        s.cacheStatsLoading = true;
      })
      .addCase(fetchCacheStatsThunk.fulfilled, (s, a) => {
        s.cacheStatsLoading = false;
        s.cacheStats = a.payload;
      })
      .addCase(fetchCacheStatsThunk.rejected, (s) => {
        s.cacheStatsLoading = false;
      });
  },
});

export const { clearResult } = narrativeSlice.actions;
export const narrativeReducer = narrativeSlice.reducer;
