import { createSlice } from "@reduxjs/toolkit";
import { ApPayment } from "./apPayment.types";
import {
  getAllApPaymentsThunk,
  getApPaymentByIdThunk,
  createApPaymentThunk,
  submitApPaymentThunk,
  approveApPaymentThunk,
  rejectApPaymentThunk,
} from "./apPayment.thunks";

interface ApPaymentState {
  list: ApPayment[];
  selected?: ApPayment;
  loading: boolean;
  error?: string;
}

const initialState: ApPaymentState = {
  list: [],
  loading: false,
};

const apPaymentSlice = createSlice({
  name: "apPayment",
  initialState,
  reducers: {
    clearSelectedApPayment(state) {
      state.selected = undefined;
    },
  },
  extraReducers: (builder) => {
    builder

      /* ===== GET ALL ===== */
      .addCase(getAllApPaymentsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllApPaymentsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(getAllApPaymentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ===== GET BY ID ===== */
      .addCase(getApPaymentByIdThunk.fulfilled, (state, action) => {
        state.selected = action.payload;
      })

      /* ===== CREATE ===== */
      .addCase(createApPaymentThunk.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(createApPaymentThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
        state.selected = action.payload;
      })
      .addCase(createApPaymentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ===== SUBMIT / APPROVE / REJECT ===== */
      .addCase(submitApPaymentThunk.fulfilled, (state, action) => {
        updatePaymentInState(state, action.payload);
      })
      .addCase(approveApPaymentThunk.fulfilled, (state, action) => {
        updatePaymentInState(state, action.payload);
      })
      .addCase(rejectApPaymentThunk.fulfilled, (state, action) => {
        updatePaymentInState(state, action.payload);
      });
  },
});

function updatePaymentInState(state: ApPaymentState, payment: ApPayment) {
  const index = state.list.findIndex((p) => p.id === payment.id);
  if (index !== -1) {
    state.list[index] = payment;
  }
  if (state.selected?.id === payment.id) {
    state.selected = payment;
  }
}

export const { clearSelectedApPayment } = apPaymentSlice.actions;
export default apPaymentSlice.reducer;
