import { createSlice } from "@reduxjs/toolkit";
import { PhysicalInventoryState } from "./physicalInventory.types";
import {
  fetchPhysicalInventoriesThunk,
  fetchPhysicalInventoryByIdThunk,
  createPhysicalInventoryThunk,
  startPhysicalInventoryThunk,
  validatePhysicalInventoryThunk,
  submitPhysicalInventoryThunk,
  approvePhysicalInventoryThunk,
  rejectPhysicalInventoryThunk,
  cancelPhysicalInventoryThunk,
} from "./physicalInventory.thunks";

const initialState: PhysicalInventoryState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
};

const physicalInventorySlice = createSlice({
  name: "physicalInventory",
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPhysicalInventoriesThunk.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchPhysicalInventoriesThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchPhysicalInventoriesThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload as string;
      })

      .addCase(fetchPhysicalInventoryByIdThunk.fulfilled, (s, a) => {
        s.selected = a.payload;
      })

      .addCase(createPhysicalInventoryThunk.fulfilled, (s, a) => {
        s.items.unshift(a.payload);
      })

      .addCase(startPhysicalInventoryThunk.fulfilled, (s, a) => {
        s.items = s.items.map((i) => (i.id === a.payload.id ? a.payload : i));
        s.selected = a.payload;
      })

      .addCase(validatePhysicalInventoryThunk.fulfilled, (s, a) => {
        s.items = s.items.map((i) => (i.id === a.payload.id ? a.payload : i));
        s.selected = a.payload;
      })

      .addCase(submitPhysicalInventoryThunk.fulfilled, (s, a) => {
        s.items = s.items.map((i) => (i.id === a.payload.id ? a.payload : i));
        s.selected = a.payload;
      })

      .addCase(approvePhysicalInventoryThunk.fulfilled, (s, a) => {
        s.items = s.items.map((i) => (i.id === a.payload.id ? a.payload : i));
        s.selected = a.payload;
      })

      .addCase(rejectPhysicalInventoryThunk.fulfilled, (s, a) => {
        s.items = s.items.map((i) => (i.id === a.payload.id ? a.payload : i));
        s.selected = a.payload;
      })

      .addCase(cancelPhysicalInventoryThunk.fulfilled, (s, a) => {
        s.items = s.items.map((i) => (i.id === a.payload.id ? a.payload : i));
        s.selected = a.payload;
      });
  },
});

export const { clearSelected } = physicalInventorySlice.actions;
export const physicalInventoryReducer = physicalInventorySlice.reducer;
