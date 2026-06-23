import { Request, Response } from "express";
import * as accountMappingService from "../services/accountMapping.service";

export async function getAccountMappingsHandler(req: Request, res: Response) {
  try {
    const { branch_id } = req.query;
    const filter: any = {};
    if (branch_id) filter.branch_id = Number(branch_id);
    const rows = await accountMappingService.getAllAccountMappings(filter);
    return res.json(rows);
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function upsertAccountMappingHandler(req: Request, res: Response) {
  try {
    const row = await accountMappingService.upsertAccountMapping(req.body);
    return res.status(200).json(row);
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}

export async function deleteAccountMappingHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await accountMappingService.deleteAccountMapping(id);
    return res.status(204).send();
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}
