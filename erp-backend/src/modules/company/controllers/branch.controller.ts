import { Request, Response } from "express";
import * as branchService from "../services/branch.service";

export const getAllBranches = async (req: Request, res: Response) => {
  try {
    const branches = await branchService.getAllBranches();
    res.json(branches);
    } catch (err: any) {    
    res.status(400).json({ message: err.message });
    }
};
