import { createSlice } from "@reduxjs/toolkit";
import {
  loadPositions,
  addPosition,
  editPosition,
  togglePositionStatus,
} from "./position.thunks";
import type { Position } from "./position.type";

interface PositionState {
  items: Position[];
  loading: boolean;
  error?: string;
}

const initialState: PositionState = {
  items: [],
  loading: false,
};

const positionSlice = createSlice({
  name: "position",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Load list
      .addCase(loadPositions.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(loadPositions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadPositions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create
      .addCase(addPosition.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })

      // Update
      .addCase(editPosition.fulfilled, (state, action) => {
        const idx = state.items.findIndex((x) => x.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })

      // Toggle status
      .addCase(togglePositionStatus.fulfilled, (state, action) => {
        const data = (action.payload as any)?.data ?? action.payload;
        const idx = state.items.findIndex((x) => x.id === data?.id);
        if (idx >= 0) state.items[idx] = data;
      });
  },
});

export const positionReducer = positionSlice.reducer;
