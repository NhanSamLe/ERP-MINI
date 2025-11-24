import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CurrencyState } from "./currency.type";
import * as thunks from "./currency.thunks";
import { Currency } from "../../../dto/currency.dto";

const initialState: CurrencyState = {
  currencies: [],
  currenciesReal: [],
  loading: false,
  error: null,
};

const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {
    clearCurrencyError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
      // ====== FETCH CURRENCIES ======
      builder
        .addCase(thunks.fetchCurrencies.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(
          thunks.fetchCurrencies.fulfilled,
          (state, action: PayloadAction<Currency[]>) => {
            state.loading = false;
            state.currencies = action.payload;
          }
        )
        .addCase(thunks.fetchCurrencies.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        });
  
      // ====== FETCH REAL CURRENCIES (API ngoài) ======
      builder
        .addCase(thunks.fetchRealCurrencies.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(
          thunks.fetchRealCurrencies.fulfilled,
          (state, action: PayloadAction<Currency[]>) => {
            state.loading = false;
            state.currenciesReal = action.payload;
          }
        )
        .addCase(thunks.fetchRealCurrencies.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        });
  
      // ====== ADD NEW CURRENCY ======
      builder
        .addCase(thunks.addCurrencyThunk.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(
          thunks.addCurrencyThunk.fulfilled,
          (state, action: PayloadAction<{
          message: string;
          currency: Currency;
        }>) => {
            state.loading = false;
              const newCurrency = action.payload.currency;
            // thêm vào danh sách currencies (nếu chưa có)
            const exists = state.currencies.some(
              (c) => c.code === newCurrency.code
            );
            if (!exists) {
              state.currencies.push(newCurrency);
            }
          }
        )
        .addCase(thunks.addCurrencyThunk.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        });
    },
});

export const { clearCurrencyError } = currencySlice.actions;
export default currencySlice.reducer;
