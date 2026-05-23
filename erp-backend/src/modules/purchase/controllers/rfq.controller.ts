import { Request, Response } from "express";
import { rfqService } from "../services/rfq.service";

function handleError(res: Response, err: any) {
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = err?.message ?? "Đã xảy ra lỗi, vui lòng thử lại";
  res.status(status).json({ success: false, message });
}

export const rfqController = {
  async getAll(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await rfqService.getAll(req.query, user);
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async getById(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await rfqService.getById(Number(req.params.id), user);
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async create(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await rfqService.create(req.body, user);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async update(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await rfqService.update(
        Number(req.params.id),
        req.body,
        user,
      );
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async delete(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      await rfqService.delete(Number(req.params.id), user);
      res.json({ success: true, message: "RFQ deleted successfully" });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async send(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await rfqService.send(Number(req.params.id), user);
      res.json({ success: true, message: "RFQ sent to supplier", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async markReceived(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await rfqService.markReceived(Number(req.params.id), user);
      res.json({ success: true, message: "RFQ marked as received", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async accept(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await rfqService.accept(Number(req.params.id), user);
      res.json({ success: true, message: "RFQ accepted", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async reject(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await rfqService.reject(Number(req.params.id), user);
      res.json({ success: true, message: "RFQ rejected", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async submit(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await rfqService.submit(Number(req.params.id), user);
      res.json({ success: true, message: "RFQ submitted for approval", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async approve(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await rfqService.approve(Number(req.params.id), user);
      res.json({ success: true, message: "RFQ approved", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async rejectApproval(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await rfqService.rejectApproval(
        Number(req.params.id),
        req.body,
        user,
      );
      res.json({ success: true, message: "RFQ approval rejected", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async convertToPo(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await rfqService.convertToPo(Number(req.params.id), user);
      res
        .status(201)
        .json({ success: true, message: "PO created from RFQ", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async createNewVersion(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const data = await rfqService.createNewVersion(
        Number(req.params.id),
        user,
      );
      res
        .status(201)
        .json({ success: true, message: "New RFQ version created", data });
    } catch (err: any) {
      handleError(res, err);
    }
  },

  async compare(req: Request, res: Response) {
    const user = (req as any).user;
    try {
      const ids = String(req.query.ids ?? "")
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0);
      if (ids.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Provide at least 2 RFQ ids via ?ids=1,2,3",
        });
      }
      const data = await rfqService.compare(ids, user);
      res.json({ success: true, data });
    } catch (err: any) {
      handleError(res, err);
    }
  },
};
