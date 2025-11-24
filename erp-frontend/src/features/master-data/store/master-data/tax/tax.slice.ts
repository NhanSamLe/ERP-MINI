import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TaxState} from "./tax.type";
import { Tax } from "../../../dto/tax.dto";
import {
  fetchAllTaxRatesThunk,
  createTaxRateThunk,
  updateTaxRateThunk,
  deleteTaxRateThunk,
} from "./tax.thunks";

const initialState: TaxState = {
  Taxes: [],
  loading: false,
  error: null,
};

const taxSlice = createSlice({
  name: "tax",
  initialState,
  reducers: {
    clearTaxError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ------- Fetch -------
      .addCase(fetchAllTaxRatesThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllTaxRatesThunk.fulfilled, (state, action: PayloadAction<Tax[]>) => {
        state.loading = false;
        state.Taxes = action.payload;
      })
      .addCase(fetchAllTaxRatesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ------- Create -------
      .addCase(createTaxRateThunk.fulfilled, (state, action: PayloadAction<Tax>) => {
        state.Taxes.push(action.payload);
      })

      // ------- Update -------
      .addCase(updateTaxRateThunk.fulfilled, (state, action: PayloadAction<Tax>) => {
        const updated = action.payload;
        state.Taxes = state.Taxes.map((item) =>
          item.id === updated.id ? updated : item
        );
      })

      // ------- Delete -------
      .addCase(deleteTaxRateThunk.fulfilled, (state, action: PayloadAction<number>) => {
        state.Taxes = state.Taxes.filter((item) => item.id !== action.payload);
      });
  },
});

export const { clearTaxError } = taxSlice.actions;
export default taxSlice.reducer;
