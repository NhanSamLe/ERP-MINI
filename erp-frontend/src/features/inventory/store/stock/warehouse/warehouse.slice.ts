import { createSlice } from "@reduxjs/toolkit";
import { WarehouseState } from "./warehouse.types";
import {
  fetchWarehousesThunk,
  createWarehouseThunk,
  updateWarehouseThunk,
  deleteWarehouseThunk,
  fetchWarehouseByIdThunk,
} from "./warehouse.thunks";

const initialState: WarehouseState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
};

export const warehouseSlice = createSlice({
  name: "warehouse",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchWarehousesThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWarehousesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchWarehousesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch warehouses";
      })
      .addCase(fetchWarehouseByIdThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWarehouseByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchWarehouseByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch warehouse";
      })
      // CREATE
      .addCase(createWarehouseThunk.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })

      // UPDATE
      .addCase(updateWarehouseThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      // DELETE
      .addCase(deleteWarehouseThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default warehouseSlice.reducer;
