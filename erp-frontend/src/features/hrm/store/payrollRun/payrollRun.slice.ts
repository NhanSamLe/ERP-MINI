import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchPayrollRuns,
  fetchPayrollRunDetail,
  createPayrollRunThunk,
  cancelPayrollRunThunk,
  postPayrollRunThunk,
  createPayrollRunLineThunk,
  updatePayrollRunLineThunk,
  deletePayrollRunLineThunk,
} from "./payrollRun.thunks";
import {
  PayrollRunDTO,
  PayrollRunLineDTO,
} from "../../dto/payrollRun.dto";

interface PayrollRunState {
  items: PayrollRunDTO[];
  currentRun: PayrollRunDTO | null;
  loading: boolean;
  loadingDetail: boolean;
  error: string | null;
}

const initialState: PayrollRunState = {
  items: [],
  currentRun: null,
  loading: false,
  loadingDetail: false,
  error: null,
};

const payrollRunSlice = createSlice({
  name: "payrollRun",
  initialState,
  reducers: {
    clearPayrollRunError(state) {
      state.error = null;
    },
    clearCurrentRun(state) {
      state.currentRun = null;
    },
  },
  extraReducers: (builder) => {
    // list
    builder
      .addCase(fetchPayrollRuns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPayrollRuns.fulfilled,
        (state, action: PayloadAction<PayrollRunDTO[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchPayrollRuns.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to load payroll runs";
      });

    // detail
    builder
      .addCase(fetchPayrollRunDetail.pending, (state) => {
        state.loadingDetail = true;
        state.error = null;
      })
      .addCase(
        fetchPayrollRunDetail.fulfilled,
        (state, action: PayloadAction<PayrollRunDTO>) => {
          state.loadingDetail = false;
          state.currentRun = action.payload;
        }
      )
      .addCase(fetchPayrollRunDetail.rejected, (state, action) => {
        state.loadingDetail = false;
        state.error =
          action.error.message || "Failed to load payroll run detail";
      });

    // create
    builder
      .addCase(createPayrollRunThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(createPayrollRunThunk.rejected, (state, action) => {
        state.error =
          (action.payload as any)?.message || action.error.message || null;
      });

    // cancel
    builder.addCase(cancelPayrollRunThunk.fulfilled, (state, action) => {
      state.items = state.items.filter((r) => r.id !== action.payload);
      if (state.currentRun?.id === action.payload) {
        state.currentRun = null;
      }
    });

    // post
    builder
      .addCase(postPayrollRunThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
        if (state.currentRun?.id === action.payload.id) {
          state.currentRun = action.payload;
        }
      })
      .addCase(postPayrollRunThunk.rejected, (state, action) => {
        state.error =
          (action.payload as any)?.message || action.error.message || null;
      });

    // lines
    builder
      .addCase(createPayrollRunLineThunk.fulfilled, (state, action) => {
        if (
          state.currentRun &&
          state.currentRun.id === action.payload.runId
        ) {
          if (!state.currentRun.lines) state.currentRun.lines = [];
          state.currentRun.lines.push(action.payload.line);
        }
      })
      .addCase(updatePayrollRunLineThunk.fulfilled, (state, action) => {
        if (
          state.currentRun &&
          state.currentRun.id === action.payload.runId &&
          state.currentRun.lines
        ) {
          const idx = state.currentRun.lines.findIndex(
            (l) => l.id === action.payload.line.id
          );
          if (idx >= 0) state.currentRun.lines[idx] = action.payload.line;
        }
      })
      .addCase(deletePayrollRunLineThunk.fulfilled, (state, action) => {
        if (
          state.currentRun &&
          state.currentRun.id === action.payload.runId &&
          state.currentRun.lines
        ) {
          state.currentRun.lines = state.currentRun.lines.filter(
            (l) => l.id !== action.payload.lineId
          );
        }
      });
  },
});

export const { clearPayrollRunError, clearCurrentRun } =
  payrollRunSlice.actions;
export default payrollRunSlice.reducer;
