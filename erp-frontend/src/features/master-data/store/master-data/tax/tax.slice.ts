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
      .addCase(createTaxRateThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTaxRateThunk.fulfilled, (state, action: PayloadAction<Tax>) => {
        state.loading = false;
        state.Taxes.push(action.payload);
      })
      .addCase(createTaxRateThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ------- Update -------
      .addCase(updateTaxRateThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateTaxRateThunk.fulfilled, (state, action: PayloadAction<Tax>) => {
        state.loading = false;
        const updated = action.payload;
        state.Taxes = state.Taxes.map((item) =>
          item.id === updated.id ? updated : item
        );
      })
      .addCase(updateTaxRateThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ------- Delete -------
      .addCase(deleteTaxRateThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteTaxRateThunk.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.Taxes = state.Taxes.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteTaxRateThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});


export const { clearTaxError } = taxSlice.actions;
export default taxSlice.reducer;
