import { createSlice } from "@reduxjs/toolkit";
import { ApInvoice, ApPostedSummary } from "./apInvoice.types";
import {
  getAllApInvoicesThunk,
  getApInvoiceByIdThunk,
  submitApInvoiceThunk,
  approveApInvoiceThunk,
  rejectApInvoiceThunk,
  createApInvoiceFromPoThunk,
  fetchApPostedSummaryThunk,
} from "./apInvoice.thunks";

interface ApInvoiceState {
  list: ApInvoice[];
  selected?: ApInvoice;
  postedSummary?: ApPostedSummary;
  loading: boolean;
  error?: string;
}

const initialState: ApInvoiceState = {
  list: [],
  loading: false,
};

const apInvoiceSlice = createSlice({
  name: "apInvoice",
  initialState,
  reducers: {
    clearSelectedApInvoice(state) {
      state.selected = undefined;
    },
  },
  extraReducers: (builder) => {
    builder

      /* ===== GET ALL ===== */
      .addCase(getAllApInvoicesThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllApInvoicesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(getAllApInvoicesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ===== GET BY ID ===== */
      .addCase(getApInvoiceByIdThunk.fulfilled, (state, action) => {
        state.selected = action.payload;
      })

      .addCase(createApInvoiceFromPoThunk.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(createApInvoiceFromPoThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
        state.selected = action.payload;
      })
      .addCase(createApInvoiceFromPoThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ===== SUBMIT / APPROVE / REJECT ===== */
      .addCase(submitApInvoiceThunk.fulfilled, (state, action) => {
        updateInvoiceInState(state, action.payload);
      })
      .addCase(approveApInvoiceThunk.fulfilled, (state, action) => {
        updateInvoiceInState(state, action.payload);
      })
      .addCase(rejectApInvoiceThunk.fulfilled, (state, action) => {
        updateInvoiceInState(state, action.payload);
      })

      .addCase(fetchApPostedSummaryThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchApPostedSummaryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.postedSummary = action.payload;
      })
      .addCase(fetchApPostedSummaryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

function updateInvoiceInState(state: ApInvoiceState, invoice: ApInvoice) {
  const index = state.list.findIndex((i) => i.id === invoice.id);
  if (index !== -1) {
    state.list[index] = invoice;
  }
  if (state.selected?.id === invoice.id) {
    state.selected = invoice;
  }
}

export const { clearSelectedApInvoice } = apInvoiceSlice.actions;
export default apInvoiceSlice.reducer;
