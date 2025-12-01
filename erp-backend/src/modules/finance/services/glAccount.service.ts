import { Op } from "sequelize";
import { GlAccount } from "../models/glAccount.model";
import { GlEntryLine } from "../models/glEntryLine.model";

export interface GlAccountPayload {
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  normal_side: "debit" | "credit";
}

export async function getAllGlAccounts(search?: string) {
  const where: any = {};
  if (search) {
    where[Op.or] = [
      { code: { [Op.like]: `%${search}%` } },
      { name: { [Op.like]: `%${search}%` } },
    ];
  }
  const rows = await GlAccount.findAll({
    where,
    order: [["code", "ASC"]],
  });
  return rows;
}

export async function getGlAccountById(id: number) {
  const row = await GlAccount.findByPk(id);
  if (!row) throw new Error("GL Account not found");
  return row;
}

export async function createGlAccount(payload: GlAccountPayload) {
  const { code } = payload;
  if (!code) throw new Error("Account code is required");

  const exists = await GlAccount.findOne({ where: { code } });
  if (exists) throw new Error("Account code already exists");

  const row = await GlAccount.create(payload);
  return row;
}

export async function updateGlAccount(
  id: number,
  payload: Partial<GlAccountPayload>
) {
  const row = await GlAccount.findByPk(id);
  if (!row) throw new Error("GL Account not found");

  if (payload.code && payload.code !== row.code) {
    const exists = await GlAccount.findOne({
      where: { code: payload.code, id: { [Op.ne]: id } },
    });
    if (exists) throw new Error("Account code already exists");
  }

  await row.update(payload);
  return row;
}

/**
 * Chỉ cho xóa khi chưa phát sinh bút toán:
 * kiểm tra bảng gl_entry_lines có record nào dùng account_id hay chưa.
 */
export async function deleteGlAccount(id: number) {
  const row = await GlAccount.findByPk(id);
  if (!row) throw new Error("GL Account not found");

  const usedCount = await GlEntryLine.count({ where: { account_id: id } });
  if (usedCount > 0) {
    throw new Error(
      "Cannot delete GL Account because it has related journal entries"
    );
  }

  await row.destroy();
}
