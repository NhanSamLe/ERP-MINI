// arReceipt.controller.ts
import { Request, Response } from "express";
import { arReceiptService } from "../services/arReceipt.service";

export const ArReceiptController = {
  /** LIST */
  async getAll(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const receipts = await arReceiptService.getAll(user);
      return res.json({ data: receipts });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** DETAIL */
  async getOne(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const result = await arReceiptService.getById(id, user);
      return res.json({ data: result });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** CREATE */
  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      const receipt = await arReceiptService.create(req.body, user);
      return res.status(201).json({ message: "Created", data: receipt });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** UPDATE */
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const receipt = await arReceiptService.update(id, req.body, user);
      return res.json({ message: "Updated", data: receipt });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** SUBMIT */
  async submit(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const result = await arReceiptService.submit(id, user);
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

      const result = await arReceiptService.approve(id, user);
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

      const result = await arReceiptService.reject(id, user, req.body.reason);
      return res.json({ message: "Rejected", data: result });
    } catch (err: any) {
      return res.status(403).json({ message: err.message });
    }
  },

  /** ALLOCATE TO INVOICE */
  async allocate(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const result = await arReceiptService.allocate(id, req.body.allocations, user);
      return res.json({ message: "Allocated", data: result });
    } catch (err: any) {
      return res.status(403).json({ message: err.message });
    }
  },
};
