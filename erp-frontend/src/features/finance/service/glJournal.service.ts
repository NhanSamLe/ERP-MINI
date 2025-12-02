// src/features/finance/service/glJournal.service.ts
import { glJournalApi } from "../api/glJournal.api";
import { GlJournalDTO } from "../dto/glJournal.dto";

export async function fetchGlJournals(): Promise<GlJournalDTO[]> {
  const res = await glJournalApi.getAll();
  return res.data;
}
