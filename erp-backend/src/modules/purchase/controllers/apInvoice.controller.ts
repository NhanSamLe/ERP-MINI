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
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    const status = e.status || 400;
    res.status(status).json({ success: false, message: e.message });
  }
  },

  async submitForApproval(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apInvoiceService.submitForApproval(
        Number(req.params.id),
        user,
        req.app
      );

      res.json({
        success: true,
        message: "Invoice submitted for approval",
        data,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async approve(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apInvoiceService.approve(Number(req.params.id), user, req.app);

      res.json({
        success: true,
        message: "Invoice approved successfully",
        data,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async reject(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const { reason } = req.body;
      if (!reason?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Reject reason is required",
        });
      }

      const data = await apInvoiceService.reject(
        Number(req.params.id),
        reason,
        user,
        req.app
      );

      res.json({
        success: true,
        message: "Invoice rejected successfully",
        data,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  async getPostedSummaryBySupplier(req: Request, res: Response) {
    const user = (req as any).user;

    try {
      const supplierId = Number(req.query.supplier_id);
      if (!supplierId) {
        return res.status(400).json({
          success: false,
          message: "supplier_id is required",
        });
      }

      const result = await apInvoiceService.getPostedSummaryBySupplier(
        supplierId,
        user
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },
  async getPostedSuppliers(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apInvoiceService.getPostedSuppliers(user);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  },
};
