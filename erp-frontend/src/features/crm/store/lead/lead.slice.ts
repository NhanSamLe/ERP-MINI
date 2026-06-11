import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAllLeads,
  fetchTodayLeads,
  createLead,
  updateLeadBasic,
  updateLeadEvaluation,
  convertLead,
  markLeadLost,
  reassignLead,
  reopenLead,
  deleteLead,
  fetchLeadById
} from "./lead.thunks";
import { LeadState } from "./lead.type";
import { Lead } from "../../dto/lead.dto";

const initialState: LeadState = {
  allLeads: [],
  todayLeads: [],
  currentLead: null,
  loading: false,
  error: null,
};

const unwrapLeadPayload = (payload: any): Lead => payload?.lead ?? payload?.data ?? payload;

const mergeLead = (existing: Lead | null | undefined, updated: Lead): Lead =>
  existing?.id === updated.id ? { ...existing, ...updated } : updated;

const mergeLeadList = (leads: Lead[], updated: Lead) =>
  leads.map((lead) => (lead.id === updated.id ? mergeLead(lead, updated) : lead));

const applyUpdatedLead = (state: LeadState, payload: any) => {
  const updated = unwrapLeadPayload(payload);
  if (!updated?.id) return;

  state.allLeads = mergeLeadList(state.allLeads, updated);
  state.todayLeads = mergeLeadList(state.todayLeads, updated);

  if (state.currentLead?.id === updated.id) {
    state.currentLead = mergeLead(state.currentLead, updated);
  }
};

export const leadSlice = createSlice({
  name: "lead",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    // ========== GET ALL LEADS ==========
    builder.addCase(fetchAllLeads.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchAllLeads.fulfilled, (state, action) => {
      state.loading = false;
      state.allLeads = action.payload;
    });
    builder.addCase(fetchAllLeads.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Lỗi fetchAllLeads";
    });

    // ========== GET LEAD BY ID ==========
    builder.addCase(fetchLeadById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLeadById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentLead = action.payload;
      // update in list if exists
      const idx = state.allLeads.findIndex(l => l.id === action.payload.id);
      if (idx !== -1) {
        state.allLeads[idx] = action.payload;
      } else {
        state.allLeads.unshift(action.payload);
      }
    });
    builder.addCase(fetchLeadById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Lỗi fetchLeadById";
    });

    // ========== GET MY LEADS ==========
    // builder.addCase(fetchMyLeads.pending, (state) => {
    //   state.loading = true;
    // });
    // builder.addCase(fetchMyLeads.fulfilled, (state, action) => {
    //   state.loading = false;
    //   state.myLeads = action.payload;
    // });
    // builder.addCase(fetchMyLeads.rejected, (state, action) => {
    //   state.loading = false;
    //   state.error = action.error.message || "Lỗi fetchMyLeads";
    // });

    builder.addCase(fetchTodayLeads.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(fetchTodayLeads.fulfilled, (state, action) => {
      state.loading = false;
      state.todayLeads = action.payload; // action.payload phải là Lead[]
    });

    builder.addCase(fetchTodayLeads.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Lỗi fetchTodayLeads";
    });

    // ========== CREATE LEAD ==========
    builder.addCase(createLead.fulfilled, (state, action) => {
      state.allLeads.unshift(action.payload);
      // state.myLeads.unshift(action.payload.data); 
      state.todayLeads.unshift(action.payload);
    });

    // ========== UPDATE  ==========
    builder.addCase(updateLeadBasic.fulfilled, (state, action) => {
      applyUpdatedLead(state, action.payload);
    });

    // UPDATE EVALUATION
    builder.addCase(updateLeadEvaluation.fulfilled, (state, action) => {
      applyUpdatedLead(state, action.payload);
    });

    // ========== CONVERT LEAD => OPP ==========
    builder.addCase(convertLead.fulfilled, (state, action) => {
      applyUpdatedLead(state, action.payload);
    });

    // ========== MARK LOST ==========
    builder.addCase(markLeadLost.fulfilled, (state, action) => {
      applyUpdatedLead(state, action.payload);
    });
    // ========== REASSIGN ==========
    builder.addCase(reassignLead.fulfilled, (state, action) => {
      applyUpdatedLead(state, action.payload);
    });

    // ========== REOPEN ==========
    builder.addCase(reopenLead.fulfilled, (state, action) => {
      applyUpdatedLead(state, action.payload);
    });
    // ========== DELETE LEAD ==========
    builder.addCase(deleteLead.fulfilled, (state, action) => {
      const deletedId = action.meta.arg;
      state.allLeads = state.allLeads.filter(l => l.id !== deletedId);
      // state.myLeads = state.myLeads.filter(l => l.id !== deletedId);
      state.todayLeads = state.todayLeads.filter(l => l.id !== deletedId);
      if (state.currentLead?.id === deletedId) state.currentLead = null;
    });

  },
});

export default leadSlice.reducer;
