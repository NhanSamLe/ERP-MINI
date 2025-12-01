import { createSlice } from "@reduxjs/toolkit";
import {
  fetchStockMovesThunk,
  fetchStockMoveByIdThunk,
  createReceiptStockMoveThunk,
  updateReceiptStockMoveThunk,
  deleteStockMoveThunk,
  createTransferStockMoveThunk,
  updateTransferStockMoveThunk,
  createAdjustmentStockMoveThunk,
  updateAdjustmentStockMoveThunk,
  createIssueStockMoveThunk,
  updateIssueStockMoveThunk,
} from "./stockMove.thunks";

import { StockMoveState } from "./stockMove.types";

const initialState: StockMoveState = {
  loading: false,
  error: null,
  items: [],
  selected: null,
};

export const stockMoveSlice = createSlice({
  name: "stockMove",
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    // ---- GET ALL ----
    builder.addCase(fetchStockMovesThunk.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchStockMovesThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchStockMovesThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ---- GET BY ID ----
    builder.addCase(fetchStockMoveByIdThunk.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchStockMoveByIdThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.selected = action.payload;
    });
    builder.addCase(fetchStockMoveByIdThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ---- CREATE ----
    builder.addCase(createReceiptStockMoveThunk.fulfilled, (state, action) => {
      state.items.push(action.payload);
    });

    builder.addCase(createIssueStockMoveThunk.fulfilled, (state, action) => {
      state.items.push(action.payload);
    });

    builder.addCase(createTransferStockMoveThunk.fulfilled, (state, action) => {
      state.items.push(action.payload);
    });

    builder.addCase(
      createAdjustmentStockMoveThunk.fulfilled,
      (state, action) => {
        state.items.push(action.payload);
      }
    );

    // ---- UPDATE ----
    builder.addCase(updateReceiptStockMoveThunk.fulfilled, (state, action) => {
      const index = state.items.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    });

    builder.addCase(updateIssueStockMoveThunk.fulfilled, (state, action) => {
      const index = state.items.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    });

    builder.addCase(updateTransferStockMoveThunk.fulfilled, (state, action) => {
      const index = state.items.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    });
    builder.addCase(
      updateAdjustmentStockMoveThunk.fulfilled,
      (state, action) => {
        const index = state.items.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      }
    );

    // ---- DELETE ----
    builder.addCase(deleteStockMoveThunk.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    });
  },
});

export const { clearSelected } = stockMoveSlice.actions;

export default stockMoveSlice.reducer;
