import { GlJournal } from "../models/glJournal.model";
import * as model from "../../../models/index";
import { Op } from "sequelize";


export async function getAllGlJournals() {
  const rows = await GlJournal.findAll({
    order: [["code", "ASC"]],
  });
  return rows;
}
export async function listJournals() {
  return model.GlJournal.findAll({ order: [["id", "ASC"]] });
}

export async function listEntriesByJournal(
  journalId: number,
  filter: { from?: string; to?: string; status?: string; search?: string }
) {
  const where: any = { journal_id: journalId };

  if (filter.status) where.status = filter.status;

  if (filter.from || filter.to) {
    where.entry_date = {};
    if (filter.from) where.entry_date[Op.gte] = new Date(filter.from + " 00:00:00");
    if (filter.to) where.entry_date[Op.lte] = new Date(filter.to + " 23:59:59");
  }

  if (filter.search) {
    where[Op.or] = [
      { entry_no: { [Op.like]: `%${filter.search}%` } },
      { memo: { [Op.like]: `%${filter.search}%` } },
      { reference_type: { [Op.like]: `%${filter.search}%` } },
    ];
  }

  return model.GlEntry.findAll({
    where,
    order: [["entry_date", "DESC"], ["id", "DESC"]],
    include: [
      { model: model.GlJournal, as: "journal" },
    ],
  });
}

export async function getEntryDetail(id: number) {
  const row = await model.GlEntry.findByPk(id, {
    include: [
      { model: model.GlJournal, as: "journal" },
      {
        model: model.GlEntryLine,
        as: "lines",
        include: [
          { model: model.GlAccount, as: "account" },
          { model: model.Partner, as: "partner" },
        ],
      },
    ],
    order: [[{ model: model.GlEntryLine, as: "lines" }, "id", "ASC"]],
  });

  if (!row) throw new Error("Entry not found");
  return row;
}