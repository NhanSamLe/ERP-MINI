import { createAsyncThunk } from "@reduxjs/toolkit";
import * as opportunityService from "../../service/opportunity.service";
import { CreateOpportunityDto, UpdateOpportunityDto } from "../../dto/opportunity.dto";

export const fetchAllOpportunities = createAsyncThunk(
  "opportunity/fetchAll",
  async (_, { rejectWithValue }) => {   
    try {
      return await opportunityService.getAllOpportunities();
    } catch (error) {
      return rejectWithValue(error);
    }   
    }   
);
// export const fetchMyOpportunities = createAsyncThunk(
//   "opportunity/fetchMine",
//   async (_, { rejectWithValue }) => {   
//     try {
//       return await opportunityService.getMyOpportunities();
//     } catch (error) {
//       return rejectWithValue(error);
//     }   
//     }   
// );
export const createOpportunity = createAsyncThunk(
  "opportunity/create",
  async (payload: CreateOpportunityDto, { rejectWithValue }) => {   
    try {
      return await opportunityService.createOpportunity(payload);
    } catch (error) {
      return rejectWithValue(error);
    }   
    }   
);
export const updateOpportunity = createAsyncThunk(
  "opportunity/update",
  async (payload: { data: UpdateOpportunityDto }, { rejectWithValue }) => {
    try {
      return await opportunityService.updateOpportunity(payload.data);
    } catch (error) {
        return rejectWithValue(error);  
    } 
    }   
);
export const moveToNegotiation = createAsyncThunk(
  "opportunity/moveToNegotiation",
  async (oppId: number, { rejectWithValue }) => {   
    try {
      return await opportunityService.moveToNegotiation(oppId);
    } catch (error) {
      return rejectWithValue(error);
    }
    }
);
export const markWon = createAsyncThunk(
  "opportunity/markWon",
  async (oppId: number, { rejectWithValue }) => {       
    try {
      return await opportunityService.markWon(oppId);
    }   
    catch (error) {
      return rejectWithValue(error);
    }   
    }
);
export const markLost = createAsyncThunk(
  "opportunity/markLost",
  async (payload: { oppId: number; reason: string }, { rejectWithValue }) => {  
    try {
      return await opportunityService.markLost(payload.oppId, payload.reason);
    }  
    catch (error) {
      return rejectWithValue(error);
    }   
    }
);
export const reassignOpportunity = createAsyncThunk(
  "opportunity/reassign",
  async (payload: { oppId: number; newUserId: number }, { rejectWithValue }) => {  
    try {
      return await opportunityService.reassignOpportunity(payload.oppId, payload.newUserId);    
    }  
    catch (error) {
      return rejectWithValue(error);
    }
    }
);
export const fetchOpportunityDetail = createAsyncThunk(
  "opportunity/fetchDetail",
  async (oppId: number, { rejectWithValue }) => {
    try {
      return await opportunityService.getOpportunityById(oppId);
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);
export const deleteOpportunity = createAsyncThunk(
  "opportunity/delete",
  async (oppId: number, { rejectWithValue }) => {
    try {
      return await opportunityService.deleteOpportunity(oppId);
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

