import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UomState} from "./uom.type";
import { Uom } from "../../../dto/uom.dto";
import { fetchAllUomsThunk, createUomThunk, updateUomThunk, deleteUomThunk } from "./uom.thunks";

const initialState: UomState = {
  Uoms: [],
  loading: false,
  error: null,
};

const uomSlice = createSlice({
  name: "uom",
  initialState,
  reducers: {
    clearUomError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchAllUomsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllUomsThunk.fulfilled, (state, action: PayloadAction<Uom[]>) => {
        state.loading = false;
        state.Uoms = action.payload;
      })
      .addCase(fetchAllUomsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create
      .addCase(createUomThunk.fulfilled, (state, action: PayloadAction<Uom>) => {
        state.Uoms.push(action.payload);
      })

      // Update
      .addCase(updateUomThunk.fulfilled, (state, action: PayloadAction<Uom>) => {
        const updated = action.payload;
        state.Uoms = state.Uoms.map((item) =>
          item.id === updated.id ? updated : item
        );
      })

      // Delete
      .addCase(deleteUomThunk.fulfilled, (state, action: PayloadAction<number>) => {
        state.Uoms = state.Uoms.filter((item) => item.id !== action.payload);
      });
  },
});

export const { clearUomError } = uomSlice.actions;
export default uomSlice.reducer;
