import { purchaseOrderService } from "../services/purchaseOrder.service";
import { Request, Response } from "express";

export const purchaseOrderController = {
  async getAllPO(req: Request, res: Response) {
    try {
      const data = await purchaseOrderService.getAllPO();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  },

  async getPOById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await purchaseOrderService.getPOById(id);
      res.json(data);
    } catch (e: any) {
      res.status(404).json({ message: "Purchase order not found" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = await purchaseOrderService.create(req.body);
      res.status(201).json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await purchaseOrderService.update(id, req.body);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  },
  async deletedPO(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await purchaseOrderService.delete(id);
      res.status(200).json({ message: "Deleted" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  },
};
