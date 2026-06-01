import { Request, Response } from "express";
import { salesReturnService } from "../services/salesReturn.service";

function statusOf(err: any) {
  return err?.status || (String(err?.message || "").includes("permission") ? 403 : 400);
}

export const SalesReturnController = {
  async getRmas(req: Request, res: Response) {
    try {
      const data = await salesReturnService.getRmas((req as any).user);
      return res.json({ data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async getRma(req: Request, res: Response) {
    try {
      const data = await salesReturnService.getRma(Number(req.params.id), (req as any).user);
      return res.json({ data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async createRma(req: Request, res: Response) {
    try {
      const data = await salesReturnService.createRma(req.body, (req as any).user);
      return res.status(201).json({ message: "Created", data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async submitRma(req: Request, res: Response) {
    try {
      const data = await salesReturnService.submitRma(Number(req.params.id), (req as any).user);
      return res.json({ message: "Submitted", data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async approveRma(req: Request, res: Response) {
    try {
      const data = await salesReturnService.approveRma(Number(req.params.id), (req as any).user);
      return res.json({ message: "Approved", data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async rejectRma(req: Request, res: Response) {
    try {
      const data = await salesReturnService.rejectRma(Number(req.params.id), req.body.reason, (req as any).user);
      return res.json({ message: "Rejected", data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async createReturnFromRma(req: Request, res: Response) {
    try {
      const data = await salesReturnService.createReturnFromRma(Number(req.params.id), req.body, (req as any).user);
      return res.status(201).json({ message: "Created", data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async getReturns(req: Request, res: Response) {
    try {
      const data = await salesReturnService.getReturns((req as any).user);
      return res.json({ data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async getReturn(req: Request, res: Response) {
    try {
      const data = await salesReturnService.getReturn(Number(req.params.id), (req as any).user);
      return res.json({ data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async inspectReturn(req: Request, res: Response) {
    try {
      const data = await salesReturnService.inspectReturn(Number(req.params.id), req.body, (req as any).user);
      return res.json({ message: "Inspected", data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async completeReturn(req: Request, res: Response) {
    try {
      const data = await salesReturnService.completeReturn(Number(req.params.id), (req as any).user);
      return res.json({ message: "Completed", data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async createCreditNote(req: Request, res: Response) {
    try {
      const data = await salesReturnService.createCreditNoteFromReturn(Number(req.params.id), (req as any).user);
      return res.status(201).json({ message: "Created", data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async getCreditNotes(req: Request, res: Response) {
    try {
      const data = await salesReturnService.getCreditNotes((req as any).user);
      return res.json({ data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async getCreditNote(req: Request, res: Response) {
    try {
      const data = await salesReturnService.getCreditNote(Number(req.params.id), (req as any).user);
      return res.json({ data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async approveCreditNote(req: Request, res: Response) {
    try {
      const data = await salesReturnService.approveCreditNote(Number(req.params.id), (req as any).user);
      return res.json({ message: "Approved", data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async createRefund(req: Request, res: Response) {
    try {
      const data = await salesReturnService.createRefundFromCreditNote(Number(req.params.id), req.body, (req as any).user);
      return res.status(201).json({ message: "Created", data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async getRefund(req: Request, res: Response) {
    try {
      const data = await salesReturnService.getRefund(Number(req.params.id), (req as any).user);
      return res.json({ data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },

  async approveRefund(req: Request, res: Response) {
    try {
      const data = await salesReturnService.approveRefund(Number(req.params.id), (req as any).user);
      return res.json({ message: "Approved", data });
    } catch (err: any) {
      return res.status(statusOf(err)).json({ message: err.message });
    }
  },
};
