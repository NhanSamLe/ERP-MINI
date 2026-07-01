import { Request, Response } from "express";
import * as glJournalService from "../services/glJournal.service";
import { getCompanyIdFromUserBranch } from "../services/companyScope.service";

type FinanceUser = { company_id?: number | null; branch_id?: number | null; role?: string };

function getUser(req: Request) {
  return (req as any).user as FinanceUser | undefined;
}

async function getCompanyId(req: Request) {
  return getCompanyIdFromUserBranch(getUser(req) ?? {});
}

export async function getAll(req: Request, res: Response) {
  try {
    const data = await glJournalService.getAllGlJournals(await getCompanyId(req));
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export const listJournals = async (req: Request, res: Response) => {
  try {
    const data = await glJournalService.listJournals(await getCompanyId(req));
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const listEntriesByJournal = async (req: Request, res: Response) => {
  try {
    const journalId = Number(req.params.journalId);
    const { from, to, status, search } = req.query;

    const user = getUser(req);
    const filter: { from?: string; to?: string; status?: string; search?: string; branch_id?: number } = {};
    if (user?.branch_id) filter.branch_id = user.branch_id;
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
    const user = getUser(req);
    const row = await glJournalService.getEntryDetail(id);
    if (user?.branch_id && (row as any).branch_id && (row as any).branch_id !== user.branch_id) {
      return res.status(403).json({ message: "Khong co quyen truy cap but toan nay." });
    }
    return res.json(row);
  } catch (e: any) {
    return res.status(404).json({ message: e.message });
  }
};

export const createManualEntry = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const branchId = user?.branch_id ?? null;
    const companyId = await getCompanyId(req);
    const data = await glJournalService.createManualEntry(req.body, branchId, companyId);
    return res.status(201).json(data);
  } catch (e: any) {
    return res.status(400).json({ message: e.message || "Loi tao but toan thu cong" });
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
    return res.status(400).json({ message: e.message || "Loi cap nhat trang thai but toan" });
  }
};

export const getTrialBalance = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    const user = getUser(req);

    if (typeof from !== "string" || typeof to !== "string") {
      return res.status(400).json({ message: "Tu ngay va den ngay la bat buoc." });
    }

    const filter: { from: string; to: string; branch_id?: number; company_id?: number } = {
      from,
      to,
      company_id: await getCompanyId(req),
    };
    if (user?.branch_id) filter.branch_id = user.branch_id;
    const data = await glJournalService.getTrialBalance(filter);
    return res.json({ data });
  } catch (e: any) {
    return res.status(400).json({ message: e.message || "Loi tai bang can doi phat sinh" });
  }
};

export const getProfitLoss = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    const user = getUser(req);

    if (typeof from !== "string" || typeof to !== "string") {
      return res.status(400).json({ message: "Tu ngay va den ngay la bat buoc." });
    }

    const filter: { from: string; to: string; branch_id?: number; company_id?: number } = {
      from,
      to,
      company_id: await getCompanyId(req),
    };
    if (user?.branch_id) filter.branch_id = user.branch_id;
    const data = await glJournalService.getProfitLoss(filter);
    return res.json({ data });
  } catch (e: any) {
    return res.status(400).json({ message: e.message || "Loi tai bao cao ket qua kinh doanh" });
  }
};
