// arInvoice.controller.ts
import { Request, Response } from "express";
import { arInvoiceService } from "../services/arInvoice.service";

export const ArInvoiceController = {
  /** LIST */
  async getAll(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await arInvoiceService.getAll(user);
      return res.json({ data });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** DETAIL */
  async getOne(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const result = await arInvoiceService.getById(id, user);
      return res.json({ data: result });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** CREATE */
  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const invoice = await arInvoiceService.create(req.body, user);
      return res.status(201).json({ message: "Created", data: invoice });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** UPDATE */
  async update(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = Number(req.params.id);

      const result = await arInvoiceService.update(id, req.body, user);
      return res.json({ message: "Updated", data: result });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** SUBMIT */
  async submit(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const result = await arInvoiceService.submit(id, user);
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

      const result = await arInvoiceService.approve(id, user);
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

      const result = await arInvoiceService.reject(id, user, req.body.reason);
      return res.json({ message: "Rejected", data: result });
    } catch (err: any) {
      return res.status(403).json({ message: err.message });
    }
  },
};
