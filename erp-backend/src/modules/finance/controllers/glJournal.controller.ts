import { Request, Response } from "express";
import * as glJournalService from "../services/glJournal.service";

export async function getAll(req: Request, res: Response) {
  try {
    const data = await glJournalService.getAllGlJournals();
    return res.json(data); // trả về array đơn giản
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}
export const listJournals = async (req: Request, res: Response) => {
  const data = await glJournalService.listJournals();
  return res.json(data);
};

export const listEntriesByJournal = async (req: Request, res: Response) => {
  try {
    const journalId = Number(req.params.journalId);
    const { from, to, status, search } = req.query;

const filter: { from?: string; to?: string; status?: string; search?: string } = {};

if (typeof from === "string") filter.from = from;
if (typeof to === "string") filter.to = to;
if (typeof status === "string") filter.status = status;
if (typeof search === "string") filter.search = search;

const data = await glJournalService.listEntriesByJournal(journalId, filter);
return res.json(data);

  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
};

export const getEntryDetail = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const row = await glJournalService.getEntryDetail(id);
    return res.json(row);
  } catch (e: any) {
    return res.status(404).json({ message: e.message });
  }
};

export const createManualEntry = async (req: Request, res: Response) => {
  try {
    const branchId = (req as any).user?.branch_id || null;
    const data = await glJournalService.createManualEntry(req.body, branchId);
    return res.status(201).json(data);
  } catch (e: any) {
    console.error("[glJournal.controller] createManualEntry error:", e);
    return res.status(400).json({ message: e.message || "Lỗi tạo bút toán thủ công" });
  }
};

export const updateEntryStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const user = (req as any).user;
    const data = await glJournalService.updateEntryStatus(id, status, user);
    return res.json(data);
  } catch (e: any) {
    console.error("[glJournal.controller] updateEntryStatus error:", e);
    return res.status(400).json({ message: e.message || "Lỗi cập nhật trạng thái bút toán" });
  }
};

export const getTrialBalance = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    const branchId = (req as any).user?.branch_id || undefined;
    
    if (typeof from !== "string" || typeof to !== "string") {
      return res.status(400).json({ message: "Từ ngày và Đến ngày là bắt buộc." });
    }

    const data = await glJournalService.getTrialBalance({ from, to, branch_id: branchId });
    return res.json({ data });
  } catch (e: any) {
    console.error("[glJournal.controller] getTrialBalance error:", e);
    return res.status(400).json({ message: e.message || "Lỗi tải bảng cân đối phát sinh" });
  }
};

export const getProfitLoss = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    const branchId = (req as any).user?.branch_id || undefined;

    if (typeof from !== "string" || typeof to !== "string") {
      return res.status(400).json({ message: "Từ ngày và Đến ngày là bắt buộc." });
    }

    const data = await glJournalService.getProfitLoss({ from, to, branch_id: branchId });
    return res.json({ data });
  } catch (e: any) {
    console.error("[glJournal.controller] getProfitLoss error:", e);
    return res.status(400).json({ message: e.message || "Lỗi tải báo cáo kết quả kinh doanh" });
  }
};