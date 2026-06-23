import { createAsyncThunk } from "@reduxjs/toolkit";
import * as scoringRuleApi from "../../api/scoringRule.api";
import {
  CreateScoringRuleDto,
  ScoringRulePreviewDto,
  UpdateScoringRuleDto,
} from "../../dto/scoringRule.dto";

export const fetchScoringRules = createAsyncThunk(
  "scoringRule/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await scoringRuleApi.getAllScoringRules();
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi tải Scoring Rules");
    }
  }
);

export const fetchScoringSignals = createAsyncThunk(
  "scoringRule/fetchSignals",
  async (_, { rejectWithValue }) => {
    try {
      const res = await scoringRuleApi.getScoringSignals();
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi tải danh sách tín hiệu chấm điểm");
    }
  }
);

export const createScoringRule = createAsyncThunk(
  "scoringRule/create",
  async (dto: CreateScoringRuleDto, { rejectWithValue }) => {
    try {
      const res = await scoringRuleApi.createScoringRule(dto);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi tạo Scoring Rule");
    }
  }
);

export const updateScoringRule = createAsyncThunk(
  "scoringRule/update",
  async ({ id, data }: { id: number; data: UpdateScoringRuleDto }, { rejectWithValue }) => {
    try {
      const res = await scoringRuleApi.updateScoringRule(id, data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi cập nhật Scoring Rule");
    }
  }
);

export const deleteScoringRule = createAsyncThunk(
  "scoringRule/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await scoringRuleApi.deleteScoringRule(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi xóa Scoring Rule");
    }
  }
);

export const previewScoringRule = createAsyncThunk(
  "scoringRule/preview",
  async (dto: ScoringRulePreviewDto, { rejectWithValue }) => {
    try {
      const res = await scoringRuleApi.previewScoringRule(dto);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi kiểm thử quy tắc chấm điểm");
    }
  }
);
