import { Request, Response } from "express";
import { matchingToleranceService } from "../services/matchingTolerance.service";

export const matchingToleranceController = {
  async getAll(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await matchingToleranceService.getAll(user.branch_id);
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await matchingToleranceService.getById(id);
      if (!data) return res.status(404).json({ message: "Not found" });
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await matchingToleranceService.create(
        { ...req.body, branch_id: user.branch_id },
        user.id
      );
      return res.status(201).json(data);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const updated = await matchingToleranceService.update(id, req.body);
      if (!updated) return res.status(404).json({ message: "Not found" });
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const deleted = await matchingToleranceService.delete(id);
      if (!deleted) return res.status(404).json({ message: "Not found" });
      return res.json({ message: "Deleted successfully" });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },
};
