import { Request, Response } from "express";
import * as branchService  from "../services/branch.service";

export const getAllBranches = async (req: Request, res: Response) => {
  try {
    const branches = await branchService.getAllBranches();
    res.json(branches);
    } catch (err: any) {    
    res.status(400).json({ message: err.message });
    }
};
export const getBranch = async (req: Request, res: Response) => {
  const row = await branchService.getBranchById(Number(req.params.id));
  res.json(row);
};

export const createBranch = async (req: Request, res: Response) => {
  const row = await branchService.createBranch(req.body);
  res.status(201).json(row);
};

export const updateBranch = async (req: Request, res: Response) => {
  const row = await branchService.updateBranch(Number(req.params.id), req.body);
  res.json(row);
};

export const deactivateBranch = async (req: Request, res: Response) => {
  const out = await branchService.deactivateBranch(Number(req.params.id));
  res.json(out);
};

export const deleteBranch = async (req: Request, res: Response) => {
  const out = await branchService.deleteBranch(Number(req.params.id));
  res.json(out);
};