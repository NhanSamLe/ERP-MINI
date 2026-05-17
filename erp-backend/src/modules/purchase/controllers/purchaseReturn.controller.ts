import { Request, Response } from "express";
import {
  praService,
  purchaseReturnService,
  apDebitNoteService,
  vendorRefundService,
} from "../services/purchaseReturn.service";

function handleError(res: Response, err: any) {
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = err?.message ?? "Đã xảy ra lỗi, vui lòng thử lại";
  res.status(status).json({ success: false, message });
}

// ─── PRA Controller ───────────────────────────────────────────────────────────

export const praController = {
  async getAll(req: Request, res: Response) {
    try {
      const data = await praService.getAll(req.query, (req as any).user);
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async getById(req: Request, res: Response) {
    try {
      const data = await praService.getById(
        Number(req.params.id),
        (req as any).user,
      );
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async create(req: Request, res: Response) {
    try {
      const data = await praService.create(req.body, (req as any).user);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async update(req: Request, res: Response) {
    try {
      const data = await praService.update(
        Number(req.params.id),
        req.body,
        (req as any).user,
      );
      res.json({ success: true, message: "PRA updated", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async submit(req: Request, res: Response) {
    try {
      const data = await praService.submit(
        Number(req.params.id),
        (req as any).user,
      );
      res.json({ success: true, message: "PRA submitted for approval", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async approve(req: Request, res: Response) {
    try {
      const data = await praService.approve(
        Number(req.params.id),
        (req as any).user,
      );
      res.json({ success: true, message: "PRA approved", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async reject(req: Request, res: Response) {
    try {
      const { reason } = req.body;
      if (!reason?.trim())
        return res
          .status(400)
          .json({ success: false, message: "reason is required" });
      const data = await praService.reject(
        Number(req.params.id),
        reason,
        (req as any).user,
      );
      res.json({ success: true, message: "PRA rejected", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
};

// ─── Purchase Return Controller ───────────────────────────────────────────────

export const purchaseReturnController = {
  async getAll(req: Request, res: Response) {
    try {
      const data = await purchaseReturnService.getAll(
        req.query,
        (req as any).user,
      );
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async getById(req: Request, res: Response) {
    try {
      const data = await purchaseReturnService.getById(
        Number(req.params.id),
        (req as any).user,
      );
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async create(req: Request, res: Response) {
    try {
      const data = await purchaseReturnService.create(
        req.body,
        (req as any).user,
      );
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async update(req: Request, res: Response) {
    try {
      const data = await purchaseReturnService.update(
        Number(req.params.id),
        req.body,
        (req as any).user,
      );
      res.json({ success: true, message: "Purchase Return updated", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async ship(req: Request, res: Response) {
    try {
      const data = await purchaseReturnService.ship(
        Number(req.params.id),
        (req as any).user,
      );
      res.json({ success: true, message: "Return marked as shipped", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async confirm(req: Request, res: Response) {
    try {
      const { lines } = req.body;
      if (!Array.isArray(lines))
        return res
          .status(400)
          .json({ success: false, message: "lines is required" });
      const data = await purchaseReturnService.confirm(
        Number(req.params.id),
        lines,
        (req as any).user,
      );
      res.json({
        success: true,
        message: "Return confirmed by supplier",
        data,
      });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async complete(req: Request, res: Response) {
    try {
      const data = await purchaseReturnService.complete(
        Number(req.params.id),
        (req as any).user,
      );
      res.json({ success: true, message: "Return completed", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
};

// ─── AP Debit Note Controller ─────────────────────────────────────────────────

export const apDebitNoteController = {
  async getAll(req: Request, res: Response) {
    try {
      const data = await apDebitNoteService.getAll(
        req.query,
        (req as any).user,
      );
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async getById(req: Request, res: Response) {
    try {
      const data = await apDebitNoteService.getById(
        Number(req.params.id),
        (req as any).user,
      );
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async createFromReturn(req: Request, res: Response) {
    try {
      const data = await apDebitNoteService.createFromReturn(
        Number(req.params.returnId),
        (req as any).user,
      );
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async post(req: Request, res: Response) {
    try {
      const data = await apDebitNoteService.post(
        Number(req.params.id),
        (req as any).user,
      );
      res.json({ success: true, message: "Debit Note posted", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async cancel(req: Request, res: Response) {
    try {
      const data = await apDebitNoteService.cancel(
        Number(req.params.id),
        (req as any).user,
      );
      res.json({ success: true, message: "Debit Note cancelled", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
};

// ─── Vendor Refund Controller ─────────────────────────────────────────────────

export const vendorRefundController = {
  async getAll(req: Request, res: Response) {
    try {
      const data = await vendorRefundService.getAll(
        req.query,
        (req as any).user,
      );
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async getById(req: Request, res: Response) {
    try {
      const data = await vendorRefundService.getById(
        Number(req.params.id),
        (req as any).user,
      );
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async create(req: Request, res: Response) {
    try {
      const data = await vendorRefundService.create(
        req.body,
        (req as any).user,
      );
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
  async post(req: Request, res: Response) {
    try {
      const data = await vendorRefundService.post(
        Number(req.params.id),
        (req as any).user,
      );
      res.json({ success: true, message: "Vendor Refund posted", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
};
