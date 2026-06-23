import { Request, Response } from "express";
import { stockBalanceService } from "../services/stockBalance.service";

export const stockBalanceController = {
  async getAvailableStock(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const productId = req.query.product_id ? Number(req.query.product_id) : undefined;
      const warehouseId = req.query.warehouse_id ? Number(req.query.warehouse_id) : undefined;
      const data = await stockBalanceService.getAvailableStock(user, productId, warehouseId);
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },

  async getAll(req: Request, res: Response) {
    const user = (req as any).user;
    const data = await stockBalanceService.getAll(user);
    return res.json(data);
  },

  async getGrouped(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const warehouseId = req.query.warehouse_id
        ? Number(req.query.warehouse_id)
        : undefined;
      const productId = req.query.product_id
        ? Number(req.query.product_id)
        : undefined;
      const data = await stockBalanceService.getGrouped(
        user,
        warehouseId,
        productId,
      );
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
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

  async search(req: Request, res: Response) {
    const user = (req as any).user;
    const keyword = String(req.query.q ?? "");
    const data = await stockBalanceService.search(keyword, user);
    return res.json(data);
  },

  async recalculateCosts(req: Request, res: Response) {
    try {
      const result = await stockBalanceService.recalculateCosts();
      return res.json({
        message: `Recalculated ${result.updated}/${result.total} balances`,
        ...result,
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },
};
