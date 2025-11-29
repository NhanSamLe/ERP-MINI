// saleOrder.controller.ts
import { Request, Response } from "express";
import { saleOrderService } from "../services/saleOrder.service";

export const SaleOrderController = {
  /** GET LIST */
  async getAll(req: Request, res: Response) {
    try {
      const user = (req as any).user; // JWT payload

      const orders = await saleOrderService.getAll(user);
      return res.json({ data: orders });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** GET DETAIL */
  async getOne(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = Number(req.params.id);

      const order = await saleOrderService.getById(id, user);
      return res.json({ data: order });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** CREATE */
  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const result = await saleOrderService.create(req.body, user);

      return res.status(201).json({ message: "Created", data: result });
    } catch (err: any) {
       console.error("🔥 BE ERROR:", err); 
      return res.status(400).json({ message: err.message });
    }
  },

  /** UPDATE */
  async update(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = Number(req.params.id);

      const result = await saleOrderService.update(id, req.body, user);
      return res.json({ message: "Updated", data: result });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** SUBMIT FOR APPROVAL */
  async submit(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const result = await saleOrderService.submit(id, user);
      return res.json({ message: "Submitted", data: result });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** APPROVE */
  async approve(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const result = await saleOrderService.approve(id, user);
      return res.json({ message: "Approved", data: result });
    } catch (err: any) {
      return res.status(403).json({ message: err.message });
    }
  },

  /** REJECT */
  async reject(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const { reason } = req.body;
      const result = await saleOrderService.reject(id, user, reason);

      return res.json({ message: "Rejected", data: result });
    } catch (err: any) {
      return res.status(403).json({ message: err.message });
    }
  },
};
