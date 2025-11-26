import { createSlice } from "@reduxjs/toolkit";
import { WarehouseState } from "./warehouse.types";
import { fetchWarehousesThunk } from "./warehouse.thunks";

const initialState: WarehouseState = {
  items: [],
  loading: false,
  error: null,
};

export const warehouseSlice = createSlice({
  name: "warehouse",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export default warehouseSlice.reducer;
