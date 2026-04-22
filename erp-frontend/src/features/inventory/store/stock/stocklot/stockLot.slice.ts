import { createSlice } from "@reduxjs/toolkit";
import { StockLotState } from "./stockLot.types";
import {
  fetchLotsThunk,
  fetchLotByIdThunk,
  fetchExpiringLotsThunk,
  createLotThunk,
  updateLotThunk,
  deleteLotThunk,
} from "./stockLot.thunks";

const initialState: StockLotState = {
  items: [],
  expiring: [],
  selectedItem: null,
  loading: false,
  error: null,
};

const stockLotSlice = createSlice({
  name: "stockLot",
  initialState,
  reducers: {
    clearSelected(state) {
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLotsThunk.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchLotsThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchLotsThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload as string;
      })

      .addCase(fetchLotByIdThunk.fulfilled, (s, a) => {
        s.selectedItem = a.payload;
      })

      .addCase(fetchExpiringLotsThunk.fulfilled, (s, a) => {
        s.expiring = a.payload;
      })

      .addCase(createLotThunk.fulfilled, (s, a) => {
        if (a.payload) s.items.unshift(a.payload);
      })
      .addCase(updateLotThunk.fulfilled, (s, a) => {
        if (!a.payload) return;
        const idx = s.items.findIndex(
          (i) => Number(i.id) === Number(a.payload!.id),
        );
        if (idx !== -1) s.items[idx] = a.payload;
        if (
          s.selectedItem &&
          Number(s.selectedItem.id) === Number(a.payload.id)
        )
          s.selectedItem = a.payload;
      })
      .addCase(deleteLotThunk.fulfilled, (s, a) => {
        s.items = s.items.filter((i) => Number(i.id) !== a.payload);
        if (s.selectedItem && Number(s.selectedItem.id) === a.payload)
          s.selectedItem = null;
      });
  },
});

export const { clearSelected } = stockLotSlice.actions;
export default stockLotSlice.reducer;
