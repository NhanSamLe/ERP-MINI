import { purchaseOrderService } from "../services/purchaseOrder.service";
import { Request, Response } from "express";

export const purchaseOrderController = {
  async getAllPO(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await purchaseOrderService.getAllPO(user);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  },

  async getByStatus(req: Request, res: Response) {
    const statusParam = req.query.status as string;
    if (!statusParam) {
      return res.status(400).json({ message: "status is required" });
    }

    const user = (req as any).user;
    const statusList = statusParam.split(",");
    try {
      const data = await purchaseOrderService.getByStatus(statusList, user);
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
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
      const user = (req as any).user;
      const data = await purchaseOrderService.create(req.body, user);
      res.status(201).json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;
      const data = await purchaseOrderService.update(id, req.body, user);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  },
  async deletedPO(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;
      await purchaseOrderService.delete(id, user);
      res.status(200).json({ message: "Deleted" });
    } catch (e: any) {
      const status = e.status || 400;
      const message = e.message || "Something went wrong";
      res.status(status).json({ message });
    }
  },

  async submitForApproval(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const data = await purchaseOrderService.submitForApproval(id, user, req.app);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  },
  async approvePO(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const result = await purchaseOrderService.approvalPO(id, user, req.app);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  async cancelPO(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;
      const { reason } = req.body;

      const result = await purchaseOrderService.cancelPO(id, user, reason, req.app);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
  async getAvailableForInvoice(req: Request, res: Response) {
    const user = (req as any).user;

    const data = await purchaseOrderService.getAvailablePurchaseOrders(user);
    return res.json({
      success: true,
      data,
    });
  },
};
