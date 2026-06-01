import { createAsyncThunk } from "@reduxjs/toolkit";
import * as pipelineApi from "../../api/pipeline.api";
import {
  CreatePipelineDto,
  UpdatePipelineDto,
  CreatePipelineStageDto,
  UpdatePipelineStageDto,
} from "../../dto/pipeline.dto";

export const fetchPipelines = createAsyncThunk(
  "pipeline/fetchAll",
  async (isActive: boolean | undefined = undefined, { rejectWithValue }) => {
    try {
      const res = await pipelineApi.getAllPipelines(isActive);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi tải Pipelines");
    }
  }
);

export const createPipeline = createAsyncThunk(
  "pipeline/create",
  async (dto: CreatePipelineDto, { rejectWithValue }) => {
    try {
      const res = await pipelineApi.createPipeline(dto);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi tạo Pipeline");
    }
  }
);

export const updatePipeline = createAsyncThunk(
  "pipeline/update",
  async ({ id, data }: { id: number; data: UpdatePipelineDto }, { rejectWithValue }) => {
    try {
      const res = await pipelineApi.updatePipeline(id, data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi cập nhật Pipeline");
    }
  }
);

export const addPipelineStage = createAsyncThunk(
  "pipeline/addStage",
  async ({ pipelineId, data }: { pipelineId: number; data: CreatePipelineStageDto }, { rejectWithValue }) => {
    try {
      const res = await pipelineApi.addStage(pipelineId, data);
      return { pipelineId, stage: res.data.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi thêm Stage");
    }
  }
);

export const updatePipelineStage = createAsyncThunk(
  "pipeline/updateStage",
  async ({ stageId, data }: { stageId: number; data: UpdatePipelineStageDto }, { rejectWithValue }) => {
    try {
      const res = await pipelineApi.updateStage(stageId, data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi cập nhật Stage");
    }
  }
);

export const deletePipelineStage = createAsyncThunk(
  "pipeline/deleteStage",
  async (stageId: number, { rejectWithValue }) => {
    try {
      const res = await pipelineApi.deleteStage(stageId);
      return res.data.data as { stageId: number; pipelineId: number };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Lỗi xóa Stage");
    }
  }
);
