import { Request, Response } from "express";
import * as glAccountService from "../services/glAccount.service";

export async function getAll(req: Request, res: Response) {
  try {
    const search = (req.query.search as string) || undefined;
    const data = await glAccountService.getAllGlAccounts(search);
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const data = await glAccountService.getGlAccountById(id);
    return res.json(data);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const data = await glAccountService.createGlAccount(req.body);
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const data = await glAccountService.updateGlAccount(id, req.body);
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string, 10);
    await glAccountService.deleteGlAccount(id);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}
