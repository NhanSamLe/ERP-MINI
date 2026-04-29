// documentIntelligence.slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  DocumentIntelligenceState,
  StatusResponse,
  EnrichedResult,
  HistoryItem,
} from "./documentIntelligence.types";
import {
  uploadDocumentThunk,
  pollDocumentStatusThunk,
  getDocumentResultThunk,
  confirmDocumentThunk,
  getDocumentHistoryThunk,
} from "./documentIntelligence.thunks";

const initialState: DocumentIntelligenceState = {
  uploading: false,
  currentDocumentId: null,
  status: null,
  result: null,
  history: [],
  historyTotal: 0,
  loading: false,
  error: null,
};

const documentIntelligenceSlice = createSlice({
  name: "documentIntelligence",
  initialState,
  reducers: {
    resetDocumentState(state) {
      state.uploading = false;
      state.currentDocumentId = null;
      state.status = null;
      state.result = null;
      state.error = null;
    },
    setCurrentDocumentId(state, action: PayloadAction<number>) {
      state.currentDocumentId = action.payload;
    },
    setStatus(state, action: PayloadAction<StatusResponse>) {
      state.status = action.payload;
    },
    setResult(state, action: PayloadAction<EnrichedResult>) {
      state.result = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ===== UPLOAD =====
    builder
      .addCase(uploadDocumentThunk.pending, (state) => {
        state.uploading = true;
        state.error = null;
        state.status = null;
        state.result = null;
        state.currentDocumentId = null;
      })
      .addCase(uploadDocumentThunk.fulfilled, (state, action) => {
        state.uploading = false;
        state.currentDocumentId = action.payload.documentId;
        state.status = { status: action.payload.status as any };
      })
      .addCase(uploadDocumentThunk.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload ?? "Lỗi tải lên tài liệu";
      });

    // ===== POLL STATUS =====
    builder
      .addCase(pollDocumentStatusThunk.fulfilled, (state, action) => {
        state.status = action.payload;
      })
      .addCase(pollDocumentStatusThunk.rejected, (state, action) => {
        state.error = action.payload ?? "Lỗi kiểm tra trạng thái";
      });

    // ===== GET RESULT =====
    builder
      .addCase(getDocumentResultThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDocumentResultThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })
      .addCase(getDocumentResultThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Lỗi lấy kết quả OCR";
      });

    // ===== CONFIRM =====
    builder
      .addCase(confirmDocumentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmDocumentThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(confirmDocumentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Lỗi xác nhận tài liệu";
      });

    // ===== HISTORY =====
    builder
      .addCase(getDocumentHistoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDocumentHistoryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload.data;
        state.historyTotal = action.payload.total;
      })
      .addCase(getDocumentHistoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Lỗi lấy lịch sử";
      });
  },
});

export const {
  resetDocumentState,
  setCurrentDocumentId,
  setStatus,
  setResult,
  clearError,
} = documentIntelligenceSlice.actions;

export default documentIntelligenceSlice.reducer;
