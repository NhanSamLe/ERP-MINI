import { Request, Response } from "express";
import { apInvoiceService } from "../services/apInvoice.service";

export const apInvoiceController = {
  async getAll(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apInvoiceService.getAll(req.query, user);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getById(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const invoice = await apInvoiceService.getById(
        Number(req.params.id),
        user
      );

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "AP Invoice not found",
        });
      }

      res.json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async createFromPO(req: Request, res: Response) {
    try {
      const poId = Number(req.params.poId);
      const user = (req as any).user;

      const data = await apInvoiceService.createFromPO(poId, user);
      res.status(201).json(data);
    } catch (e: any) {
      const status = e.status || 400;
      res.status(status).json({ message: e.message });
    }
  },
};
