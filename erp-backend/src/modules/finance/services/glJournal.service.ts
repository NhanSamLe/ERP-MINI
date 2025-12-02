import { GlJournal } from "../models/glJournal.model";

export async function getAllGlJournals() {
  const rows = await GlJournal.findAll({
    order: [["code", "ASC"]],
  });
  return rows;
}
