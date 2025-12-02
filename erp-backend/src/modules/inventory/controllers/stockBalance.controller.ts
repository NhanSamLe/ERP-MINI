import { Request, Response } from "express";
import { stockBalanceService } from "../services/stockBalance.service";

export const stockBalanceController = {
  async getAll(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await stockBalanceService.getAll(user);
    return res.json(data);
  },

  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const data = await stockBalanceService.getById(id);
    if (!data) return res.status(404).json({ message: "Not found" });
    return res.json(data);
  },

  async create(req: Request, res: Response) {
    const data = await stockBalanceService.create(req.body);
    return res.status(201).json(data);
  },

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const updated = await stockBalanceService.update(id, req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.json(updated);
  },

  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const deleted = await stockBalanceService.delete(id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Deleted successfully" });
  },

  async findByWarehouse(req: Request, res: Response) {
    const warehouseId = Number(req.params.warehouseId);
    const data = await stockBalanceService.findByWarehouse(warehouseId);
    return res.json(data);
  },

  async findByProduct(req: Request, res: Response) {
    const productId = Number(req.params.productId);
    const data = await stockBalanceService.findByProduct(productId);
    return res.json(data);
  },
};
