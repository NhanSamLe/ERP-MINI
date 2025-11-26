import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { StockBalance, StockBalanceState } from "./stockBalance.types";
import {
  fetchStockBalancesThunk,
  getStockBalanceByIdThunk,
  createStockBalanceThunk,
  updateStockBalanceThunk,
  deleteStockBalanceThunk,
} from "./stockBalance.thunks";

const initialState: StockBalanceState = {
  items: [],
  loading: false,
  selected: null,
  error: null,
};

export const stockBalanceSlice = createSlice({
  name: "stockBalance",
  initialState,
  reducers: {
    resetSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchStockBalancesThunk.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(
      fetchStockBalancesThunk.fulfilled,
      (state, action: PayloadAction<StockBalance[]>) => {
        state.loading = false;
        state.items = action.payload;
      }
    );

    builder.addCase(fetchStockBalancesThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(getStockBalanceByIdThunk.fulfilled, (state, action) => {
      state.selected = action.payload;
    });

    builder.addCase(createStockBalanceThunk.fulfilled, (state, action) => {
      state.items.push(action.payload);
    });

    builder.addCase(updateStockBalanceThunk.fulfilled, (state, action) => {
      state.items = state.items.map((item) =>
        item.id === action.payload.id ? action.payload : item
      );
    });

    builder.addCase(deleteStockBalanceThunk.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    });
  },
});

export const { resetSelected } = stockBalanceSlice.actions;
export default stockBalanceSlice.reducer;
