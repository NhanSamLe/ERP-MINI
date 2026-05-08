import { createSlice } from "@reduxjs/toolkit";
import { ScoringRuleState } from "./scoringRule.type";
import {
  fetchScoringRules,
  createScoringRule,
  updateScoringRule,
  deleteScoringRule,
} from "./scoringRule.thunks";

const initialState: ScoringRuleState = {
  scoringRules: [],
  loading: false,
  error: null,
};

const scoringRuleSlice = createSlice({
  name: "scoringRule",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchScoringRules.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchScoringRules.fulfilled, (s, a) => { s.loading = false; s.scoringRules = a.payload; })
      .addCase(fetchScoringRules.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(createScoringRule.fulfilled, (s, a) => { s.scoringRules.push(a.payload); })
      .addCase(updateScoringRule.fulfilled, (s, a) => {
        const idx = s.scoringRules.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.scoringRules[idx] = a.payload;
      })
      .addCase(deleteScoringRule.fulfilled, (s, a) => {
        s.scoringRules = s.scoringRules.filter((r) => r.id !== a.payload);
      });
  },
});

export default scoringRuleSlice.reducer;
