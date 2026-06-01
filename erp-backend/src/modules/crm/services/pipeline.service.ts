import { Pipeline } from "../models/pipeline.model";
import { PipelineStage } from "../models/pipelineStage.model";

export const getAllPipelines = async (isActive?: boolean) => {
  const where: any = {};
  if (isActive !== undefined) where.is_active = isActive;

  return await Pipeline.findAll({
    where,
    include: [{ model: PipelineStage, as: "stages" }],
    order: [
      ["id", "ASC"],
      [{ model: PipelineStage, as: "stages" }, "sequence", "ASC"],
    ],
  });
};

export const createPipeline = async (data: { name: string; description?: string }) => {
  return await Pipeline.create({ ...data, is_active: true, is_default: false });
};

export const updatePipeline = async (id: number, data: Partial<any>) => {
  const pipeline = await Pipeline.findByPk(id);
  if (!pipeline) throw new Error("Pipeline not found");
  return await pipeline.update(data);
};

export const addStageToPipeline = async (
  pipelineId: number,
  data: { name: string; probability?: number; is_won?: boolean; is_lost?: boolean; color?: string }
) => {
  const pipeline = await Pipeline.findByPk(pipelineId);
  if (!pipeline) throw new Error("Pipeline not found");

  const maxStage = await PipelineStage.findOne({
    where: { pipeline_id: pipelineId },
    order: [["sequence", "DESC"]],
  });
  const nextSequence = maxStage ? maxStage.sequence + 1 : 1;

  return await PipelineStage.create({
    pipeline_id: pipelineId,
    name: data.name,
    sequence: nextSequence,
    is_won: data.is_won || false,
    is_lost: data.is_lost || false,
    probability: data.probability || 0,
    color: data.color || "#f97316",
  });
};

export const updateStage = async (stageId: number, data: Partial<any>) => {
  const stage = await PipelineStage.findByPk(stageId);
  if (!stage) throw new Error("Stage not found");
  return await stage.update(data);
};

export const deleteStage = async (stageId: number) => {
  const stage = await PipelineStage.findByPk(stageId);
  if (!stage) throw new Error("Stage not found");
  await stage.destroy();
  return { stageId, pipelineId: stage.pipeline_id };
};
