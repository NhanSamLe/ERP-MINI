import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PayrollPeriodDTO } from "../../dto/payrollPeriod.dto";
import {
  fetchPayrollPeriods,
  createPayrollPeriodThunk,
  updatePayrollPeriodThunk,
  closePayrollPeriodThunk,
  deletePayrollPeriodThunk,
} from "./payrollPeriod.thunks";

interface PayrollPeriodState {
  items: PayrollPeriodDTO[];
  loading: boolean;
  error?: string | null;
}

const initialState: PayrollPeriodState = {
  items: [],
  loading: false,
  error: null,
};

const payrollPeriodSlice = createSlice({
  name: "payrollPeriod",
  initialState,
  reducers: {
    clearPayrollError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetch
    builder.addCase(fetchPayrollPeriods.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchPayrollPeriods.fulfilled,
      (state, action: PayloadAction<PayrollPeriodDTO[]>) => {
        state.loading = false;
        state.items = action.payload;
      }
    );
    builder.addCase(fetchPayrollPeriods.rejected, (state, action) => {
      state.loading = false;
      state.error =
        (action.payload as string) ||
        action.error.message ||
        "Failed to load payroll periods";
    });

    // create
    builder.addCase(
      createPayrollPeriodThunk.fulfilled,
      (state, action: PayloadAction<PayrollPeriodDTO>) => {
        state.items.unshift(action.payload);
        state.error = null;
      }
    );
    builder.addCase(createPayrollPeriodThunk.rejected, (state, action) => {
      state.error =
        (action.payload as string) ||
        action.error.message ||
        "Failed to create payroll period";
    });

    // update
    builder.addCase(
      updatePayrollPeriodThunk.fulfilled,
      (state, action: PayloadAction<PayrollPeriodDTO>) => {
        const idx = state.items.findIndex(
          (x) => x.id === action.payload.id
        );
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
        state.error = null;
      }
    );
    builder.addCase(updatePayrollPeriodThunk.rejected, (state, action) => {
      state.error =
        (action.payload as string) ||
        action.error.message ||
        "Failed to update payroll period";
    });

    // close
    builder.addCase(
      closePayrollPeriodThunk.fulfilled,
      (state, action: PayloadAction<number>) => {
        const idx = state.items.findIndex((x) => x.id === action.payload);
        if (idx !== -1) {
          state.items[idx].status = "closed";
        }
        state.error = null;
      }
    );
    builder.addCase(closePayrollPeriodThunk.rejected, (state, action) => {
      state.error =
        (action.payload as string) ||
        action.error.message ||
        "Failed to close payroll period";
    });

    // delete
    builder.addCase(
      deletePayrollPeriodThunk.fulfilled,
      (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((x) => x.id !== action.payload);
        state.error = null;
      }
    );
    builder.addCase(deletePayrollPeriodThunk.rejected, (state, action) => {
      state.error =
        (action.payload as string) ||
        action.error.message ||
        "Failed to delete payroll period";
    });
  },
});

export const { clearPayrollError } = payrollPeriodSlice.actions;
export default payrollPeriodSlice.reducer;
