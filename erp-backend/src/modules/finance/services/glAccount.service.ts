import { Op } from "sequelize";
import { GlAccount } from "../models/glAccount.model";
import { GlEntryLine } from "../models/glEntryLine.model";

export interface GlAccountPayload {
  company_id: number;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  normal_side: "debit" | "credit";
  parent_id?: number | null;
  description?: string | null;
  is_active?: boolean;
}

export async function getAllGlAccounts(companyId: number, search?: string) {
  const where: any = { company_id: companyId };
  if (search) {
    where[Op.or] = [
      { code: { [Op.like]: `%${search}%` } },
      { name: { [Op.like]: `%${search}%` } },
    ];
  }
  return GlAccount.findAll({ where, order: [["code", "ASC"]] });
}

export async function getGlAccountById(id: number, companyId: number) {
  const row = await GlAccount.findOne({ where: { id, company_id: companyId } });
  if (!row) throw new Error("GL Account not found");
  return row;
}

export async function createGlAccount(payload: GlAccountPayload) {
  const { code, company_id } = payload;
  if (!code) throw new Error("Account code is required");
  if (!company_id) throw new Error("company_id is required");

  const exists = await GlAccount.findOne({ where: { company_id, code } });
  if (exists) throw new Error(`Account code "${code}" already exists in this company`);

  return GlAccount.create(payload as any);
}

export async function updateGlAccount(id: number, payload: Partial<GlAccountPayload>, companyId: number) {
  const row = await GlAccount.findOne({ where: { id, company_id: companyId } });
  if (!row) throw new Error("GL Account not found");

  if (payload.code && payload.code !== row.code) {
    const exists = await GlAccount.findOne({
      where: { company_id: companyId, code: payload.code, id: { [Op.ne]: id } },
    });
    if (exists) throw new Error(`Account code "${payload.code}" already exists`);
  }

  await row.update(payload);
  return row;
}

export async function deleteGlAccount(id: number, companyId: number) {
  const row = await GlAccount.findOne({ where: { id, company_id: companyId } });
  if (!row) throw new Error("GL Account not found");

  const usedCount = await GlEntryLine.count({ where: { account_id: id } });
  if (usedCount > 0) {
    throw new Error("Cannot delete GL Account because it has related journal entries");
  }

  await row.destroy();
}
