import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAllOpportunities,
  createOpportunity,
  updateOpportunity,
  moveToNegotiation,
  markWon,
  markLost,
  reassignOpportunity,
  fetchOpportunityDetail,
  deleteOpportunity
} from "./opportunity.thunks";
import { OpportunityState } from "./opportunity.type";

const initialState: OpportunityState = {
  allOpportunities: [],
  detail: null,
  loading: false,
  error: null,
};
export const opportunitySlice = createSlice({
  name: "opportunity",
  initialState,
  reducers: {}, 
    extraReducers: (builder) => {
    // ========== GET ALL OPPORTUNITIES ==========
    builder.addCase(fetchAllOpportunities.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchAllOpportunities.fulfilled, (state, action) => {
      state.loading = false;
      state.allOpportunities = action.payload;
    });
    builder.addCase(fetchAllOpportunities.rejected, (state, action) => {
        state.loading = false;  
        state.error = action.error.message || "Lỗi fetchAllOpportunities";
    });

    // ========== GET MY OPPORTUNITIES ==========
    // builder.addCase(fetchMyOpportunities.pending, (state) => {
    //   state.loading = true;
    // });
    // builder.addCase(fetchMyOpportunities.fulfilled, (state, action) => {
    //   state.loading = false;
    //   state.myOpportunities = action.payload;
    // });
    // builder.addCase(fetchMyOpportunities.rejected, (state, action) => {
    //     state.loading = false;  
    //     state.error = action.error.message || "Lỗi fetchMyOpportunities";
    // });
    builder.addCase(fetchOpportunityDetail.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(fetchOpportunityDetail.fulfilled, (state, action) => {
      state.loading = false;
      state.detail = action.payload;
    });

    builder.addCase(fetchOpportunityDetail.rejected, (state) => {
      state.loading = false;
      state.error = "Không thể load chi tiết Opportunity";
    });

    // ========== CREATE OPPORTUNITY ==========
    builder.addCase(createOpportunity.fulfilled, (state, action) => {
      state.allOpportunities.unshift(action.payload);
      // state.myOpportunities.unshift(action.payload); 
    });
    // ========== UPDATE OPPORTUNITY ==========
    builder.addCase(updateOpportunity.fulfilled, (state, action) => {
      const updated = action.payload;
        state.allOpportunities = state.allOpportunities.map((o) => o.id === updated.id ? updated : o);
        // state.myOpportunities = state.myOpportunities.map((o) => o.id === updated.id ? updated : o);
    });
    // ========== MOVE TO NEGOTIATION ==========
    builder.addCase(moveToNegotiation.fulfilled, (state, action) => {
      const updated = action.payload;
        state.allOpportunities = state.allOpportunities.                map((o) => o.id === updated.id ? updated : o);
        // state.myOpportunities = state.myOpportunities.map((o) => o.id === updated.id ? updated : o);
    });
    // ========== MARK WON ==========
    builder.addCase(markWon.fulfilled, (state, action) => {
      const updated = action.payload;
        state.allOpportunities = state.allOpportunities.map((o) => o.id === updated.id ? updated : o);
        // state.myOpportunities = state.myOpportunities.map((o) => o.id === updated.id ? updated : o);
    });
    // ========== MARK LOST ==========
    builder.addCase(markLost.fulfilled, (state, action) => {
      const updated = action.payload;
        state.allOpportunities = state.allOpportunities.map((o) => o.id === updated.id ? updated : o);
        // state.myOpportunities = state.myOpportunities.map((o) => o.id === updated.id ? updated : o);
    });
    builder.addCase(reassignOpportunity.fulfilled, (state, action) => {     
        const updated = action.payload; 
        state.allOpportunities = state.allOpportunities.map((o) => o.id === updated.id ? updated : o);
    });
    builder.addCase(deleteOpportunity.fulfilled, (state, action) => {
      const deletedId = action.meta.arg;
      state.allOpportunities = state.allOpportunities.filter(o => o.id !== deletedId);
      state.detail = null;
    });

  },
});
export default opportunitySlice.reducer;