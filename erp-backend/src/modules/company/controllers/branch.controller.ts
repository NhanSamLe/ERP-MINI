import { Request, Response } from "express";
import * as branchService from "../services/branch.service";
import * as model from "../../../models/index";

async function getCompanyId(req: Request): Promise<number | undefined> {
  const user = (req as any).user;
  if (user?.company_id) return user.company_id;
  if (user?.branch_id) {
    const branch = await model.Branch.findByPk(user.branch_id, { attributes: ['company_id'] });
    return (branch as any)?.company_id ?? undefined;
  }
  return undefined;
}

export const getAllBranches = async (req: Request, res: Response) => {
  try {
    const company_id = await getCompanyId(req);
    const branches = await branchService.getAllBranches(company_id);
    res.json(branches);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getBranch = async (req: Request, res: Response) => {
  try {
    const company_id = await getCompanyId(req);
    const row = await branchService.getBranchById(Number(req.params.id), company_id);
    res.json(row);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const company_id = await getCompanyId(req);
    if (!company_id) {
      return res.status(400).json({ message: "User không có company_id. Vui lòng đăng nhập lại." });
    }
    const row = await branchService.createBranch({ ...req.body, company_id });
    res.status(201).json(row);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const company_id = await getCompanyId(req);
    await branchService.getBranchById(Number(req.params.id), company_id);
    const row = await branchService.updateBranch(Number(req.params.id), req.body, company_id);
    res.json(row);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deactivateBranch = async (req: Request, res: Response) => {
  try {
    const company_id = await getCompanyId(req);
    await branchService.getBranchById(Number(req.params.id), company_id);
    const out = await branchService.deactivateBranch(Number(req.params.id));
    res.json(out);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const activateBranch = async (req: Request, res: Response) => {
  try {
    const company_id = await getCompanyId(req);
    await branchService.getBranchById(Number(req.params.id), company_id);
    const out = await branchService.activateBranch(Number(req.params.id));
    res.json(out);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const company_id = await getCompanyId(req);
    await branchService.getBranchById(Number(req.params.id), company_id);
    const out = await branchService.deleteBranch(Number(req.params.id));
    res.json(out);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const company_id = await getCompanyId(req);
    await branchService.getBranchById(Number(req.params.id), company_id);
    const row = await branchService.updateBranchStatus(Number(req.params.id), status);
    res.json(row);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
