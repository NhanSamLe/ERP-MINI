import { createSlice } from "@reduxjs/toolkit";
import { PipelineState } from "./pipeline.type";
import {
  fetchPipelines,
  createPipeline,
  updatePipeline,
  addPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
} from "./pipeline.thunks";

const initialState: PipelineState = {
  pipelines: [],
  loading: false,
  error: null,
};

const pipelineSlice = createSlice({
  name: "pipeline",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPipelines.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchPipelines.fulfilled, (s, a) => { s.loading = false; s.pipelines = a.payload; })
      .addCase(fetchPipelines.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(createPipeline.fulfilled, (s, a) => { s.pipelines.push({ ...a.payload, stages: a.payload.stages || [] }); })
      .addCase(updatePipeline.fulfilled, (s, a) => {
        const idx = s.pipelines.findIndex((p) => p.id === a.payload.id);
        if (idx !== -1) s.pipelines[idx] = { ...s.pipelines[idx], ...a.payload, stages: s.pipelines[idx].stages || [] };
      })
      .addCase(addPipelineStage.fulfilled, (s, a) => {
        const pipeline = s.pipelines.find((p) => p.id === a.payload.pipelineId);
        if (pipeline) {
          if (!pipeline.stages) pipeline.stages = [];
          pipeline.stages.push(a.payload.stage);
        }
      })
      .addCase(updatePipelineStage.fulfilled, (s, a) => {
        for (const p of s.pipelines) {
          if (!p.stages) continue;
          const idx = p.stages.findIndex((st) => st.id === a.payload.id);
          if (idx !== -1) { p.stages[idx] = a.payload; break; }
        }
      })
      .addCase(deletePipelineStage.fulfilled, (s, a) => {
        const pipeline = s.pipelines.find((p) => p.id === a.payload.pipelineId);
        if (pipeline?.stages) {
          pipeline.stages = pipeline.stages.filter((st) => st.id !== a.payload.stageId);
        }
      });
  },
});

export default pipelineSlice.reducer;
