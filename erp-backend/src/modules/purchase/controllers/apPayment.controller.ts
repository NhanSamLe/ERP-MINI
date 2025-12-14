import { Request, Response } from "express";
import { apPaymentService } from "../services/apPayment.service";

export const apPaymentController = {
  async getAll(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apPaymentService.getAll(req.query, user);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apPaymentService.getById(Number(req.params.id), user);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "AP Payment not found",
        });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apPaymentService.create(req.body, user);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(error.status || 400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async submitForApproval(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apPaymentService.submitForApproval(
        Number(req.params.id),
        user
      );

      res.json({
        success: true,
        message: "Payment submitted for approval",
        data,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async approve(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await apPaymentService.approve(Number(req.params.id), user);

      res.json({
        success: true,
        message: "Payment approved successfully",
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

      const data = await apPaymentService.reject(
        Number(req.params.id),
        reason,
        user
      );

      res.json({
        success: true,
        message: "Payment rejected successfully",
        data,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
