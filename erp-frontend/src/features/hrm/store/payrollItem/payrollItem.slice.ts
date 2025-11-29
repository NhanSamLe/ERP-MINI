import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchPayrollItems,
  createPayrollItemThunk,
  updatePayrollItemThunk,
  deletePayrollItemThunk,
} from "./payrollItem.thunks";
import { PayrollItemDTO } from "../../dto/payrollItem.dto";

interface PayrollItemState {
  items: PayrollItemDTO[];
  loading: boolean;
  error: string | null;
}

const initialState: PayrollItemState = {
  items: [],
  loading: false,
  error: null,
};

const payrollItemSlice = createSlice({
  name: "payrollItem",
  initialState,
  reducers: {
    clearPayrollItemError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPayrollItems.fulfilled,
        (state, action: PayloadAction<PayrollItemDTO[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchPayrollItems.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to load payroll items";
      })

      .addCase(createPayrollItemThunk.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(createPayrollItemThunk.rejected, (state, action) => {
        state.error =
          (action.payload as any)?.message ||
          action.error.message ||
          null;
      })

      .addCase(updatePayrollItemThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(updatePayrollItemThunk.rejected, (state, action) => {
        state.error =
          (action.payload as any)?.message ||
          action.error.message ||
          null;
      })

      .addCase(deletePayrollItemThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      .addCase(deletePayrollItemThunk.rejected, (state, action) => {
        state.error =
          (action.payload as any)?.message ||
          action.error.message ||
          null;
      });
  },
});

export const { clearPayrollItemError } = payrollItemSlice.actions;
export default payrollItemSlice.reducer;
