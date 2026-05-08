import { createAsyncThunk } from "@reduxjs/toolkit";
import * as leadSourceApi from "../../api/leadSource.api";
import { CreateLeadSourceDto, UpdateLeadSourceDto } from "../../dto/leadSource.dto";

export const fetchLeadSources = createAsyncThunk(
  "leadSource/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await leadSourceApi.getAllLeadSources();
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi tải Lead Sources");
    }
  }
);

export const createLeadSource = createAsyncThunk(
  "leadSource/create",
  async (dto: CreateLeadSourceDto, { rejectWithValue }) => {
    try {
      const res = await leadSourceApi.createLeadSource(dto);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi tạo Lead Source");
    }
  }
);

export const updateLeadSource = createAsyncThunk(
  "leadSource/update",
  async ({ id, data }: { id: number; data: UpdateLeadSourceDto }, { rejectWithValue }) => {
    try {
      const res = await leadSourceApi.updateLeadSource(id, data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi cập nhật Lead Source");
    }
  }
);

export const deleteLeadSource = createAsyncThunk(
  "leadSource/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await leadSourceApi.deleteLeadSource(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi xóa Lead Source");
    }
  }
);
