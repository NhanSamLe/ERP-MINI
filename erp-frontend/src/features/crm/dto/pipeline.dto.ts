export interface PipelineStage {
  id: number;
  pipeline_id: number;
  name: string;
  sequence: number;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pipeline {
  id: number;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  stages: PipelineStage[];
  created_at: string;
  updated_at: string;
}

export interface CreatePipelineDto {
  name: string;
  description?: string;
}

export interface UpdatePipelineDto {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface CreatePipelineStageDto {
  name: string;
  sequence: number;
  probability?: number;
  is_won?: boolean;
  is_lost?: boolean;
  color?: string;
}

export interface UpdatePipelineStageDto {
  name?: string;
  sequence?: number;
  probability?: number;
  is_won?: boolean;
  is_lost?: boolean;
  color?: string;
}
