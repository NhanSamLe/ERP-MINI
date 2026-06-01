import { Request, Response } from "express";
import * as pipelineService from "../services/pipeline.service";

// ----------- PIPELINE -----------
export const getAllPipelines = async (req: Request, res: Response) => {
  try {
    const { is_active } = req.query;
    const isActive = is_active === "true" ? true : is_active === "false" ? false : undefined;
    const pipelines = await pipelineService.getAllPipelines(isActive);
    res.json({ message: "Lấy danh sách Phễu lọc thành công", data: pipelines });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const createPipeline = async (req: Request, res: Response) => {
  try {
    const pipeline = await pipelineService.createPipeline(req.body);
    res.status(201).json({ message: "Tạo Phễu lọc thành công", data: pipeline });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updatePipeline = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const pipeline = await pipelineService.updatePipeline(id, req.body);
    res.json({ message: "Cập nhật Phễu lọc thành công", data: pipeline });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// ----------- STAGE -----------
export const addStage = async (req: Request, res: Response) => {
  try {
    const pipelineId = Number(req.params.id); // Pipeline ID
    const stage = await pipelineService.addStageToPipeline(pipelineId, req.body);
    res.status(201).json({ message: "Thêm Bước Phễu thành công", data: stage });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateStage = async (req: Request, res: Response) => {
  try {
    const stageId = Number(req.params.stageId);
    const stage = await pipelineService.updateStage(stageId, req.body);
    res.json({ message: "Cập nhật Bước Phễu thành công", data: stage });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteStage = async (req: Request, res: Response) => {
  try {
    const stageId = Number(req.params.stageId);
    const result = await pipelineService.deleteStage(stageId);
    res.json({ message: "Xóa giai đoạn thành công", data: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
