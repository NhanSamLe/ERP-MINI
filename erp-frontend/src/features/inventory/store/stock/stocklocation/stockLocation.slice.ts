import { createSlice } from "@reduxjs/toolkit";
import { StockLocationState } from "./stockLocation.types";
import {
  fetchLocationsThunk,
  fetchLocationTreeThunk,
  fetchLocationByIdThunk,
  createLocationThunk,
  updateLocationThunk,
  deleteLocationThunk,
} from "./stockLocation.thunks";

const initialState: StockLocationState = {
  items: [],
  tree: [],
  selectedItem: null,
  loading: false,
  error: null,
};

const stockLocationSlice = createSlice({
  name: "stockLocation",
  initialState,
  reducers: {
    clearSelected(state) {
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocationsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLocationsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchLocationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchLocationTreeThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLocationTreeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.tree = action.payload;
      })
      .addCase(fetchLocationTreeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchLocationByIdThunk.fulfilled, (state, action) => {
        state.selectedItem = action.payload;
      })

      .addCase(createLocationThunk.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })

      .addCase(updateLocationThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex(
          (i) => Number(i.id) === Number(action.payload.id),
        );
        if (idx !== -1) state.items[idx] = action.payload;
        if (
          state.selectedItem &&
          Number(state.selectedItem.id) === Number(action.payload.id)
        ) {
          state.selectedItem = action.payload;
        }
      })

      .addCase(deleteLocationThunk.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (i) => Number(i.id) !== action.payload,
        );
        if (
          state.selectedItem &&
          Number(state.selectedItem.id) === action.payload
        ) {
          state.selectedItem = null;
        }
      });
  },
});

export const { clearSelected } = stockLocationSlice.actions;
export default stockLocationSlice.reducer;
