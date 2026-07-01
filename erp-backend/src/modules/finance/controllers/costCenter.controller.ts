import { Request, Response } from "express";
import * as costCenterService from "../services/costCenter.service";

export async function getCostCentersHandler(req: Request, res: Response) {
  try {
    const { search, branch_id } = req.query;
    const filter: any = {};
    if (search) filter.search = search as string;
    if (branch_id) filter.branch_id = Number(branch_id);
    const rows = await costCenterService.getAllCostCenters(filter);
    return res.json(rows);
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function getCostCenterByIdHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const row = await costCenterService.getCostCenterById(id);
    return res.json(row);
  } catch (e: any) {
    return res.status(404).json({ message: e.message });
  }
}

export async function createCostCenterHandler(req: Request, res: Response) {
  try {
    const row = await costCenterService.createCostCenter(req.body);
    return res.status(201).json(row);
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function updateCostCenterHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const row = await costCenterService.updateCostCenter(id, req.body);
    return res.json(row);
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function deleteCostCenterHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await costCenterService.deleteCostCenter(id);
    return res.status(204).send();
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}
