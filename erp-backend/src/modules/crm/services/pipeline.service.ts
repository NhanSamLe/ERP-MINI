import { Pipeline } from "../models/pipeline.model";
import { PipelineStage } from "../models/pipelineStage.model";

export const getAllPipelines = async () => {
  return await Pipeline.findAll({
    include: [{ model: PipelineStage, as: 'stages' }],
    order: [
      ['id', 'ASC'],
      [{ model: PipelineStage, as: 'stages' }, 'sequence', 'ASC']
    ]
  });
};

export const createPipeline = async (data: { name: string, description?: string }) => {
  return await Pipeline.create({ ...data, is_active: true, is_default: false });
};

export const updatePipeline = async (id: number, data: Partial<any>) => {
  const pipeline = await Pipeline.findByPk(id);
  if (!pipeline) throw new Error("Pipeline not found");
  return await pipeline.update(data);
};

export const addStageToPipeline = async (pipelineId: number, data: { name: string, sequence: number, is_won?: boolean }) => {
  const pipeline = await Pipeline.findByPk(pipelineId);
  if (!pipeline) throw new Error("Pipeline not found");
  
  return await PipelineStage.create({
    pipeline_id: pipelineId,
    name: data.name,
    sequence: data.sequence,
    is_won: data.is_won || false,
    probability: 0,
    is_lost: false
  });
};

export const updateStage = async (stageId: number, data: Partial<any>) => {
  const stage = await PipelineStage.findByPk(stageId);
  if (!stage) throw new Error("Stage not found");
  return await stage.update(data);
};
