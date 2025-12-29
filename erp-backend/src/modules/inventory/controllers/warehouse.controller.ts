import { Request, Response } from "express";
import { warehouseService } from "../services/warehouse.service";

export const WarehouseController = {
  async getAll(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await warehouseService.getAll(user);
    return res.json(data);
  },

  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const data = await warehouseService.getById(id);

    if (!data) return res.status(404).json({ message: "Not found" });

    return res.json(data);
  },

  async create(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await warehouseService.create(req.body, user);
    return res.status(201).json(data);
  },

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const updated = await warehouseService.update(id, req.body, user);
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.json(updated);
  },

  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const ok = await warehouseService.delete(id, user);

    if (!ok) return res.status(404).json({ message: "Not found" });

    return res.json({ message: "Deleted successfully" });
  },

  async getByBranch(req: Request, res: Response) {
    const branchId = Number(req.params.branchId);
    const data = await warehouseService.getByBranchId(branchId);
    return res.json(data);
  },

  async findByCode(req: Request, res: Response) {
    const code = req.params.code;
    if (!code) {
      return res.status(400).json({ message: "Code parameter is required" });
    }
    const data = await warehouseService.findByCode(code);
    if (!data) return res.status(404).json({ message: "Not found" });
    return res.json(data);
  },
};
