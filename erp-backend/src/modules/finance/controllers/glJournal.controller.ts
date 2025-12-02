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
