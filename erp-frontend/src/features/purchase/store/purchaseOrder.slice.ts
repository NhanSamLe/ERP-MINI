import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPurchaseOrdersThunk,
  fetchPurchaseOrderByIdThunk,
  createPurchaseOrderThunk,
  updatePurchaseOrderThunk,
  deletePurchaseOrderThunk,
  fetchPurchaseOrderByStatus,
} from "./purchaseOrder.thunks";
import { PurchaseOrderState } from "./purchaseOrder.types";

const initialState: PurchaseOrderState = {
  items: [],
  selectedPO: undefined,
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

      .addCase(deletePurchaseOrderThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((po) => po.id !== action.payload);
      });
  },
});

export const { clearSelectedPO } = purchaseOrderSlice.actions;
export default purchaseOrderSlice.reducer;
