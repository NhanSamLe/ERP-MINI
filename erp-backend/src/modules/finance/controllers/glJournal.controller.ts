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