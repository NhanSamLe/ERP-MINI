import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchPurchaseOrdersThunk,
  fetchPurchaseOrderByIdThunk,
  createPurchaseOrderThunk,
  updatePurchaseOrderThunk,
  deletePurchaseOrderThunk,
  fetchPurchaseOrderByStatus,
  submitPurchaseOrderThunk,
  approvePurchaseOrderThunk,
  cancelPurchaseOrderThunk,
  getPurchaseOrdersAvailableForInvoiceThunk,
} from "./purchaseOrder.thunks";
import { PurchaseOrder, PurchaseOrderState } from "./purchaseOrder.types";

const initialState: PurchaseOrderState = {
  items: [],
  selectedPO: undefined,
  availableForInvoice: [],
  loading: false,
  error: null,
};

export const purchaseOrderSlice = createSlice({
  name: "purchaseOrder",
  initialState,
  reducers: {
    clearSelectedPO(state) {
      state.selectedPO = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseOrdersThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPurchaseOrdersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPurchaseOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPurchaseOrderByStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPurchaseOrderByIdThunk.fulfilled, (state, action) => {
        state.selectedPO = action.payload;
      })

      .addCase(createPurchaseOrderThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })

      .addCase(updatePurchaseOrderThunk.fulfilled, (state, action) => {
        state.items = state.items.map((po) =>
          po.id === action.payload.id ? action.payload : po
        );
      })

      .addCase(submitPurchaseOrderThunk.fulfilled, (state, action) => {
        state.items = state.items.map((po) =>
          po.id === action.payload.id ? action.payload : po
        );
      })

      .addCase(deletePurchaseOrderThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((po) => po.id !== action.payload);
      })
      // Approve
      .addCase(
        approvePurchaseOrderThunk.fulfilled,
        (state, action: PayloadAction<PurchaseOrder>) => {
          state.selectedPO = action.payload;
        }
      )
      // Cancel
      .addCase(
        cancelPurchaseOrderThunk.fulfilled,
        (state, action: PayloadAction<PurchaseOrder>) => {
          state.selectedPO = action.payload;
        }
      )

      // ================= AVAILABLE FOR INVOICE =================
      .addCase(getPurchaseOrdersAvailableForInvoiceThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        getPurchaseOrdersAvailableForInvoiceThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.availableForInvoice = action.payload;
        }
      )
      .addCase(
        getPurchaseOrdersAvailableForInvoiceThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export const { clearSelectedPO } = purchaseOrderSlice.actions;
export default purchaseOrderSlice.reducer;
