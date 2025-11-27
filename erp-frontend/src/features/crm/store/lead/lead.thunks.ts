import { createAsyncThunk } from "@reduxjs/toolkit";
import * as leadService from "../../service/lead.service";
import {
  CreateLeadDto,
  UpdateLeadBasicDto,
  UpdateLeadEvaluationDto,
} from "../../dto/lead.dto";

// Lấy toàn bộ leads
export const fetchAllLeads = createAsyncThunk(
  "lead/fetchAll",
  async (_, {rejectWithValue}) => {
    try {
      return await leadService.getAllLeads();
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// // Lấy lead của user hiện tại
// export const fetchMyLeads = createAsyncThunk(
//   "lead/fetchMine",
//   async () => {
//     return await leadService.getMyLeads();
//   }
// );

// Tạo lead
export const createLead = createAsyncThunk(
  "lead/create",
  async (payload: CreateLeadDto) => {
    return await leadService.createLead(payload);
  }
);

// Update basic
export const updateLeadBasic = createAsyncThunk(
  "lead/updateBasic",
  async ({ leadId, data }: { leadId: number; data: UpdateLeadBasicDto }) => {
    return await leadService.updateLeadBasic(leadId, data);
  }
);

// Update evaluation
export const updateLeadEvaluation = createAsyncThunk(
  "lead/updateEvaluation",
  async ({
    leadId,
    data,
  }: {
    leadId: number;
    data: UpdateLeadEvaluationDto;
  }) => {
    return await leadService.updateLeadEvaluation(leadId, data);
  }
);
// Convert lead → customer
export const convertLead = createAsyncThunk(
  "lead/convert",
  async (leadId: number) => {
    return await leadService.convertLead(leadId);
  }
);

// Đánh dấu lost
export const markLeadLost = createAsyncThunk(
  "lead/lost",
  async ({ leadId, reason }: { leadId: number; reason: string }) => {
    return await leadService.markLeadLost(leadId,  reason );
  }
);

// Reassign
export const reassignLead = createAsyncThunk(
  "lead/reassign",
  async ({ leadId, newUserId }: { leadId: number; newUserId: number }) => {
    return await leadService.reassignLead(leadId, newUserId);
  }
);

// Reopen lead
export const reopenLead = createAsyncThunk(
  "lead/reopen",
  async (leadId: number) => {
    return await leadService.reopenLead(leadId);
  }
);

export const fetchTodayLeads = createAsyncThunk(
  "lead/fetchToday",
  async () => {
    return await leadService.getLeadToday();
  }
);

export const deleteLead = createAsyncThunk(
  "lead/delete",
  async (leadId: number) => {
    return await leadService.deleteLead(leadId);
  }
);

