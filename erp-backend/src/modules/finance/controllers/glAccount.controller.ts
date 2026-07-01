import { Request, Response } from "express";
import * as glAccountService from "../services/glAccount.service";
import { getCompanyIdFromUserBranch } from "../services/companyScope.service";

async function requireCompanyId(req: Request): Promise<number> {
  return getCompanyIdFromUserBranch((req as any).user ?? {});
}

export async function getAll(req: Request, res: Response) {
  try {
    const companyId = await requireCompanyId(req);
    const search = (req.query.search as string) || undefined;
    const data = await glAccountService.getAllGlAccounts(companyId, search);
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const companyId = await requireCompanyId(req);
    const id = parseInt(req.params.id as string, 10);
    const data = await glAccountService.getGlAccountById(id, companyId);
    return res.json(data);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const companyId = await requireCompanyId(req);
    const data = await glAccountService.createGlAccount({ ...req.body, company_id: companyId });
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const companyId = await requireCompanyId(req);
    const id = parseInt(req.params.id as string, 10);
    const data = await glAccountService.updateGlAccount(id, req.body, companyId);
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const companyId = await requireCompanyId(req);
    const id = parseInt(req.params.id as string, 10);
    await glAccountService.deleteGlAccount(id, companyId);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}
