import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Partner } from "./partner.types";
import {
  loadPartners,
  loadPartnerDetail,
  createPartnerThunk,
  updatePartnerThunk,
  deletePartnerThunk,
} from "./partner.thunks";

interface PartnerState {
  items: Partner[];
  selected?: Partner;
  loading: boolean;
  error?: string | null;
}

const initialState: PartnerState = {
  items: [],
  loading: false,
  error: null,
};

const partnerSlice = createSlice({
  name: "partners",
  initialState,
  reducers: {
    clearPartnerDetail(state) {
      state.selected = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      // list
      .addCase(loadPartners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPartners.fulfilled, (state, action: PayloadAction<Partner[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadPartners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // detail
      .addCase(loadPartnerDetail.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      // create
      .addCase(createPartnerThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // update
      .addCase(updatePartnerThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
      })
      // delete
      .addCase(deletePartnerThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export const { clearPartnerDetail } = partnerSlice.actions;
export default partnerSlice.reducer;
