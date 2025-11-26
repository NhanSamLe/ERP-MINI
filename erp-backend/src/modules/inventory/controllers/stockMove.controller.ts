import { Request, Response } from "express";
import { stockMoveService } from "../services/stockMove.service";

export const StockMoveController = {
  async getAll(req: Request, res: Response) {
    const data = await stockMoveService.getAll();
    return res.json(data);
  },

  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const data = await stockMoveService.getById(id);
    if (!data) return res.status(404).json({ message: "Not found" });
    return res.json(data);
  },

  async create(req: Request, res: Response) {
    const data = await stockMoveService.create(req.body);
    return res.status(201).json(data);
  },

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const updated = await stockMoveService.update(id, req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.json(updated);
  },

  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const deleted = await stockMoveService.delete(id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Deleted successfully" });
  },

  async findByType(req: Request, res: Response) {
    const type = req.params.type;
    if (!type) {
      return res.json({ message: "Type parameter is required" });
    }
    const data = await stockMoveService.findByType(type);
    return res.json(data);
  },

  async findByWarehouse(req: Request, res: Response) {
    const warehouseId = Number(req.params.warehouseId);
    const data = await stockMoveService.findByWarehouse(warehouseId);
    return res.json(data);
  },

  async findByStatus(req: Request, res: Response) {
    const status = req.params.status;
    if (status) {
      const data = await stockMoveService.findByStatus(status);
      return res.json(data);
    }
    return res.json({ message: "Status parameter is required" });
  },
};
