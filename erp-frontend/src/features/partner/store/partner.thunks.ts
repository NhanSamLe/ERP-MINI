import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchPartners,
  fetchPartnerById,
  createPartnerApi,
  updatePartnerApi,
  deletePartnerApi,
} from "../api/partner.api";
import { Partner, PartnerFilter } from "./partner.types";

export const loadPartners = createAsyncThunk<
  Partner[],
  PartnerFilter | undefined
>("partners/load", async (filter, { rejectWithValue }) => {
  try {
    return await fetchPartners(filter);
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.message || e.message);
  }
});

export const loadPartnerDetail = createAsyncThunk<Partner, number>(
  "partners/loadOne",
  async (id, { rejectWithValue }) => {
    try {
      return await fetchPartnerById(id);
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
    return await createPartnerApi(payload);
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.message || e.message);
  }
});

export const updatePartnerThunk = createAsyncThunk<
  Partner,
  { id: number; data: Partial<Partner> }
>("partners/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await updatePartnerApi(id, data);
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.message || e.message);
  }
});

export const deletePartnerThunk = createAsyncThunk<number, number>(
  "partners/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deletePartnerApi(id);
      return id;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);
