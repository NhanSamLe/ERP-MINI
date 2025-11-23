import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UomConversionState } from "./conversion.type";
import { UomConversion } from "../../../dto/uom.dto";
import {
  fetchAllConversionsThunk,
  createConversionThunk,
  updateConversionThunk,
  deleteConversionThunk,
} from "./conversion.thunks";

const initialState: UomConversionState = {
  UomConversions: [],
  loading: false,
  error: null,
};

const conversionSlice = createSlice({
  name: "conversion",
  initialState,
  reducers: {
    clearConversionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchAllConversionsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllConversionsThunk.fulfilled, (state, action: PayloadAction<UomConversion[]>) => {
        state.loading = false;
        state.UomConversions = action.payload;
      })
      .addCase(fetchAllConversionsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create
      .addCase(createConversionThunk.fulfilled, (state, action: PayloadAction<UomConversion>) => {
        state.UomConversions.push(action.payload);
      })

      // Update
      .addCase(updateConversionThunk.fulfilled, (state, action: PayloadAction<UomConversion>) => {
        const updated = action.payload;
        state.UomConversions = state.UomConversions.map((item) =>
          item.id === updated.id ? updated : item
        );
      })

      // Delete
      .addCase(deleteConversionThunk.fulfilled, (state, action: PayloadAction<number>) => {
        state.UomConversions = state.UomConversions.filter((item) => item.id !== action.payload);
      });
  },
});

export const { clearConversionError } = conversionSlice.actions;
export default conversionSlice.reducer;
