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
  deleteOpportunity,
  changePipelineStage
} from "./opportunity.thunks";
import { OpportunityState } from "./opportunity.type";
import { Opportunity } from "../../dto/opportunity.dto";

const initialState: OpportunityState = {
  allOpportunities: [],
  detail: null,
  loading: false,
  error: null,
};

const unwrapOpportunityPayload = (payload: any): Opportunity =>
  payload?.opp ?? payload?.opportunity ?? payload?.data?.opp ?? payload?.data ?? payload;

const mergeOpportunity = (
  existing: Opportunity | null | undefined,
  updated: Opportunity,
): Opportunity => (existing?.id === updated.id ? { ...existing, ...updated } : updated);

const mergeOpportunityList = (items: Opportunity[], updated: Opportunity) =>
  items.map((item) => (item.id === updated.id ? mergeOpportunity(item, updated) : item));

const applyUpdatedOpportunity = (state: OpportunityState, payload: any) => {
  const updated = unwrapOpportunityPayload(payload);
  if (!updated?.id) return;

  state.allOpportunities = mergeOpportunityList(state.allOpportunities, updated);
  if (state.detail?.id === updated.id) {
    state.detail = mergeOpportunity(state.detail, updated);
  }
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
      applyUpdatedOpportunity(state, action.payload);
    });
    // ========== MOVE TO NEGOTIATION ==========
    builder.addCase(moveToNegotiation.fulfilled, (state, action) => {
      applyUpdatedOpportunity(state, action.payload);
    });
    // ========== CHANGE PIPELINE STAGE ==========
    builder.addCase(changePipelineStage.fulfilled, (state, action) => {
      applyUpdatedOpportunity(state, action.payload);
    });
    // ========== MARK WON ==========
    builder.addCase(markWon.fulfilled, (state, action) => {
      applyUpdatedOpportunity(state, action.payload);
    });
    // ========== MARK LOST ==========
    builder.addCase(markLost.fulfilled, (state, action) => {
      applyUpdatedOpportunity(state, action.payload);
    });
    builder.addCase(reassignOpportunity.fulfilled, (state, action) => {     
      applyUpdatedOpportunity(state, action.payload);
    });
    builder.addCase(deleteOpportunity.fulfilled, (state, action) => {
      const deletedId = action.meta.arg;
      state.allOpportunities = state.allOpportunities.filter(o => o.id !== deletedId);
      state.detail = null;
    });

  },
});
export default opportunitySlice.reducer;
