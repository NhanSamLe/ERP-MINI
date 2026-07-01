import { Request, Response } from "express";
import * as mappingService from "../services/payrollAccountMapping.service";

export async function getMappingsHandler(req: Request, res: Response) {
  try {
    const { branch_id, department_id, item_type } = req.query;
    const filter: any = {};
    if (branch_id) filter.branch_id = Number(branch_id);
    if (department_id) filter.department_id = Number(department_id);
    if (item_type) filter.item_type = item_type as any;
    const rows = await mappingService.getAllMappings(filter);
    return res.json(rows);
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function createMappingHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!req.body.branch_id && user?.branch_id) {
      req.body.branch_id = user.branch_id;
    }
    const row = await mappingService.createMapping(req.body);
    return res.status(201).json(row);
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function updateMappingHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const row = await mappingService.updateMapping(id, req.body);
    return res.json(row);
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function deleteMappingHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await mappingService.deleteMapping(id);
    return res.status(204).send();
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}
