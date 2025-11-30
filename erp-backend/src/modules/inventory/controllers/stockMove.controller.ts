import { Request, Response } from "express";
import { stockMoveService } from "../services/stockMove.service";
import {
  StockMoveAdjustmentDTO,
  StockMoveCreateDTO,
  StockMoveTransferDTO,
} from "../dto/stockMoveCreate.dto";

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

  async createReceiptStockMove(req: Request, res: Response) {
    const body = req.body as StockMoveCreateDTO;
    const data = await stockMoveService.createReceipt(body);
    return res.status(201).json(data);
  },

  async createTransferStockMove(req: Request, res: Response) {
    const body = req.body as StockMoveTransferDTO;
    const data = await stockMoveService.createTransfer(body);
    return res.status(201).json(data);
  },

  async createAdjustmentStockMove(req: Request, res: Response) {
    const body = req.body as StockMoveAdjustmentDTO;
    const data = await stockMoveService.createAdjustment(body);
    return res.status(201).json(data);
  },

  async updateReceiptStockMove(req: Request, res: Response) {
    const id = Number(req.params.id);
    const updated = await stockMoveService.updateReceipt(id, req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.json(updated);
  },

  async updateTransferStockMove(req: Request, res: Response) {
    const id = Number(req.params.id);
    const updated = await stockMoveService.updateTransfer(id, req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.json(updated);
  },

  async updateAdjustmentStockMove(req: Request, res: Response) {
    const id = Number(req.params.id);
    const updated = await stockMoveService.updateAdjustment(id, req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.json(updated);
  },

  async deleteStockMove(req: Request, res: Response) {
    const id = Number(req.params.id);
    const deleted = await stockMoveService.delete(id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Deleted successfully" });
  },

  async findByTypeStockMove(req: Request, res: Response) {
    const type = req.params.type;
    if (!type) {
      return res.json({ message: "Type parameter is required" });
    }
    const data = await stockMoveService.findByType(type);
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
