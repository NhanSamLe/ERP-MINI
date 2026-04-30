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
  searchPurchaseOrdersThunk,
  bulkApprovePurchaseOrdersThunk,
  bulkCancelPurchaseOrdersThunk,
} from "./purchaseOrder.thunks";
import {
  PurchaseOrder,
  PurchaseOrderState,
  SearchQuery,
  Pagination,
} from "./purchaseOrder.types";

const initialState: PurchaseOrderState = {
  items: [],
  selectedPO: undefined,
  availableForInvoice: [],
  loading: false,
  error: null,
  filters: {},
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  selectedIds: [],
  bulkActionLoading: false,
};

export const purchaseOrderSlice = createSlice({
  name: "purchaseOrder",
  initialState,
  reducers: {
    clearSelectedPO(state) {
      state.selectedPO = undefined;
    },
    setFilters(state, action: PayloadAction<SearchQuery>) {
      state.filters = action.payload;
    },
    setSelectedIds(state, action: PayloadAction<number[]>) {
      state.selectedIds = action.payload;
    },
    setBulkActionLoading(state, action: PayloadAction<boolean>) {
      state.bulkActionLoading = action.payload;
    },
    clearSelectedIds(state) {
      state.selectedIds = [];
    },
    setPagination(state, action: PayloadAction<Pagination>) {
      state.pagination = action.payload;
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
          po.id === action.payload.id ? action.payload : po,
        );
      })

      .addCase(submitPurchaseOrderThunk.fulfilled, (state, action) => {
        state.items = state.items.map((po) =>
          po.id === action.payload.id ? action.payload : po,
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
        },
      )
      // Cancel
      .addCase(
        cancelPurchaseOrderThunk.fulfilled,
        (state, action: PayloadAction<PurchaseOrder>) => {
          state.selectedPO = action.payload;
        },
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
        },
      )
      .addCase(
        getPurchaseOrdersAvailableForInvoiceThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        },
      )

      // ================= SEARCH =================
      .addCase(searchPurchaseOrdersThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchPurchaseOrdersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(searchPurchaseOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ================= BULK APPROVE =================
      .addCase(bulkApprovePurchaseOrdersThunk.pending, (state) => {
        state.bulkActionLoading = true;
      })
      .addCase(bulkApprovePurchaseOrdersThunk.fulfilled, (state, action) => {
        state.bulkActionLoading = false;
        state.selectedIds = [];
      })
      .addCase(bulkApprovePurchaseOrdersThunk.rejected, (state, action) => {
        state.bulkActionLoading = false;
        state.error = action.payload as string;
      })

      // ================= BULK CANCEL =================
      .addCase(bulkCancelPurchaseOrdersThunk.pending, (state) => {
        state.bulkActionLoading = true;
      })
      .addCase(bulkCancelPurchaseOrdersThunk.fulfilled, (state, action) => {
        state.bulkActionLoading = false;
        state.selectedIds = [];
      })
      .addCase(bulkCancelPurchaseOrdersThunk.rejected, (state, action) => {
        state.bulkActionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearSelectedPO,
  setFilters,
  setSelectedIds,
  setBulkActionLoading,
  clearSelectedIds,
  setPagination,
} = purchaseOrderSlice.actions;
export default purchaseOrderSlice.reducer;
