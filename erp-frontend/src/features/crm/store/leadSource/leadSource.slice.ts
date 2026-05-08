import { createSlice } from "@reduxjs/toolkit";
import { LeadSourceState } from "./leadSource.type";
import {
  fetchLeadSources,
  createLeadSource,
  updateLeadSource,
  deleteLeadSource,
} from "./leadSource.thunks";

const initialState: LeadSourceState = {
  leadSources: [],
  loading: false,
  error: null,
};

const leadSourceSlice = createSlice({
  name: "leadSource",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeadSources.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchLeadSources.fulfilled, (s, a) => { s.loading = false; s.leadSources = a.payload; })
      .addCase(fetchLeadSources.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(createLeadSource.fulfilled, (s, a) => { s.leadSources.push(a.payload); })
      .addCase(updateLeadSource.fulfilled, (s, a) => {
        const idx = s.leadSources.findIndex((ls) => ls.id === a.payload.id);
        if (idx !== -1) s.leadSources[idx] = a.payload;
      })
      .addCase(deleteLeadSource.fulfilled, (s, a) => {
        s.leadSources = s.leadSources.filter((ls) => ls.id !== a.payload);
      });
  },
});

export default leadSourceSlice.reducer;
