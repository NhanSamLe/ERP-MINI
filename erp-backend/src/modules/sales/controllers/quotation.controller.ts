import { Request, Response } from "express";
import { quotationService } from "../services/quotation.service";

export const getByOpportunity = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oppId = parseInt(req.params.oppId || "0");
    const quotations = await quotationService.getByOpportunity(oppId, user);
    res.status(200).json({ success: true, data: quotations });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const quotations = await quotationService.getAll(user);
    res.status(200).json({ success: true, data: quotations });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const qId = parseInt(req.params.id || "0");
    const quotation = await quotationService.getById(qId, user);
    res.status(200).json({ success: true, data: quotation });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const quotation = await quotationService.create(req.body, user);
    res.status(201).json({ success: true, data: quotation });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const qId = parseInt(req.params.id || "0");
    const quotation = await quotationService.update(qId, req.body, user);
    res.status(200).json({ success: true, data: quotation });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const submit = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const qId = parseInt(req.params.id || "0");
    const quotation = await quotationService.submit(qId, user);
    res.status(200).json({ success: true, data: quotation });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const approve = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const qId = parseInt(req.params.id || "0");
    const quotation = await quotationService.approve(qId, user);
    res.status(200).json({ success: true, data: quotation });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const reject = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const qId = parseInt(req.params.id || "0");
    const quotation = await quotationService.reject(qId, user, req.body.reason);
    res.status(200).json({ success: true, data: quotation });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const markAccepted = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const qId = parseInt(req.params.id || "0");
    const quotation = await quotationService.markAccepted(qId, user);
    res.status(200).json({ success: true, data: quotation });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const convertToOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const qId = parseInt(req.params.id || "0");
    const order = await quotationService.convertToOrder(qId, user);
    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    // Trả cả `message` (FE đọc response.data.message) lẫn `error` cho tương thích.
    res.status(400).json({ success: false, message: error.message, error: error.message });
  }
};
