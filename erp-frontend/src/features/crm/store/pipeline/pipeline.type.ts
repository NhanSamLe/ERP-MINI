import { Pipeline } from "../../dto/pipeline.dto";

export interface PipelineState {
  pipelines: Pipeline[];
  loading: boolean;
  error: string | null;
}
