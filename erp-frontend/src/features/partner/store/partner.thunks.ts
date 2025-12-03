import { createAsyncThunk } from "@reduxjs/toolkit";
import { partnerApi } from "../api/partner.api";
import { Partner, PartnerFilter } from "./partner.types";

export const loadPartners = createAsyncThunk<
  Partner[],
  PartnerFilter | undefined
>("partners/load", async (filter, { rejectWithValue }) => {
  try {
    return await partnerApi.getAllPartners(filter);
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.message || e.message);
  }
});

export const loadPartnerDetail = createAsyncThunk<Partner, number>(
  "partners/loadOne",
  async (id, { rejectWithValue }) => {
    try {
      return await partnerApi.getPartnerById(id);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const createPartnerThunk = createAsyncThunk<
  Partner,
  Partial<Partner>
>("partners/create", async (payload, { rejectWithValue }) => {
  try {
    return await partnerApi.createPartner(payload);
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.message || e.message);
  }
});

export const updatePartnerThunk = createAsyncThunk<
  Partner,
  { id: number; data: Partial<Partner> }
>("partners/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await partnerApi.updatePartner(id, data);
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.message || e.message);
  }
});

export const deletePartnerThunk = createAsyncThunk<number, number>(
  "partners/delete",
  async (id, { rejectWithValue }) => {
    try {
      await partnerApi.deletePartner(id);
      return id;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);
