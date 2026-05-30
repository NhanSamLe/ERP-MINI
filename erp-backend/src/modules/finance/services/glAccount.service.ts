import { Op } from "sequelize";
import { GlAccount } from "../models/glAccount.model";
import { GlEntryLine } from "../models/glEntryLine.model";

// normal_side tự động từ type — không nhận từ client
const NORMAL_SIDE: Record<GlAccountAttrs["type"], "debit" | "credit"> = {
  asset: "debit",
  expense: "debit",
  liability: "credit",
  equity: "credit",
  revenue: "credit",
};

import type { GlAccountAttrs } from "../models/glAccount.model";

export interface GlAccountPayload {
  parent_id?: number | null;
  code: string;
  name: string;
  type: GlAccountAttrs["type"];
  is_group?: boolean;
  reconcile?: boolean;
  is_active?: boolean;
  description?: string | null;
}

// ─── helpers ────────────────────────────────────────────────────────────────

async function resolveLevel(parent_id?: number | null): Promise<number> {
  if (!parent_id) return 1;
  const parent = await GlAccount.findByPk(parent_id, {
    attributes: ["id", "level", "is_group"],
  });
  if (!parent) throw new Error("Parent account not found");
  if (!parent.is_group)
    throw new Error("Parent account must be a group account (is_group = true)");
  return parent.level + 1;
}

/** Đệ quy build cây nested từ flat list */
function buildTree(rows: GlAccount[], parentId: number | null = null): any[] {
  return rows
    .filter((r) => r.parent_id === parentId)
    .map((r) => ({
      ...r.toJSON(),
      children: buildTree(rows, r.id),
    }));
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function getAllGlAccounts(search?: string) {
  const where: any = {};
  if (search) {
    where[Op.or] = [
      { code: { [Op.like]: `%${search}%` } },
      { name: { [Op.like]: `%${search}%` } },
    ];
  }
  return GlAccount.findAll({ where, order: [["code", "ASC"]] });
}

/** Trả về cây tài khoản dạng nested */
export async function getGlAccountTree() {
  const rows = await GlAccount.findAll({
    where: { is_active: true },
    order: [["code", "ASC"]],
  });
  return buildTree(rows, null);
}

export async function getGlAccountById(id: number) {
  const row = await GlAccount.findByPk(id, {
    include: [{ model: GlAccount, as: "parent", attributes: ["id", "code", "name"] }],
  });
  if (!row) throw new Error("GL Account not found");
  return row;
}

export async function createGlAccount(payload: GlAccountPayload) {
  const { code, type, parent_id } = payload;
  if (!code) throw new Error("Account code is required");

  const exists = await GlAccount.findOne({ where: { code } });
  if (exists) throw new Error("Account code already exists");

  const normal_side = NORMAL_SIDE[type];
  const level = await resolveLevel(parent_id);

  return GlAccount.create({ ...payload, normal_side, level });
}

export async function updateGlAccount(
  id: number,
  payload: Partial<GlAccountPayload>
) {
  const row = await GlAccount.findByPk(id);
  if (!row) throw new Error("GL Account not found");

  // Kiểm tra code trùng
  if (payload.code && payload.code !== row.code) {
    const exists = await GlAccount.findOne({
      where: { code: payload.code, id: { [Op.ne]: id } },
    });
    if (exists) throw new Error("Account code already exists");
  }

  // Nếu đổi parent hoặc type thì tính lại level và normal_side
  const updates: any = { ...payload };

  if (payload.type) {
    updates.normal_side = NORMAL_SIDE[payload.type];
  }

  if ("parent_id" in payload) {
    updates.level = await resolveLevel(payload.parent_id);
  }

  // Không cho tắt is_group nếu còn tài khoản con
  if (payload.is_group === false) {
    const childCount = await GlAccount.count({ where: { parent_id: id } });
    if (childCount > 0)
      throw new Error("Cannot unset is_group: account still has child accounts");
  }

  await row.update(updates);
  return row;
}

export async function deleteGlAccount(id: number) {
  const row = await GlAccount.findByPk(id);
  if (!row) throw new Error("GL Account not found");

  const childCount = await GlAccount.count({ where: { parent_id: id } });
  if (childCount > 0)
    throw new Error("Cannot delete account that has child accounts");

  const usedCount = await GlEntryLine.count({ where: { account_id: id } });
  if (usedCount > 0)
    throw new Error("Cannot delete GL Account because it has related journal entries");

  await row.destroy();
}

/**
 * Guard dùng bởi các service khác (GlEntry, AP, AR...)
 * trước khi hạch toán vào một tài khoản.
 */
export async function assertPostableAccount(account_id: number): Promise<void> {
  const acc = await GlAccount.findByPk(account_id, {
    attributes: ["id", "is_group", "is_active"],
  });
  if (!acc) throw new Error(`GL Account #${account_id} not found`);
  if (!acc.is_active) throw new Error(`GL Account #${account_id} is inactive`);
  if (acc.is_group)
    throw new Error(
      `GL Account #${account_id} is a group account and cannot be posted to directly`
    );
}
