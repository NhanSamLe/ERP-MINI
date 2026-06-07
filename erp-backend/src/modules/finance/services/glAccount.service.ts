import { Op } from "sequelize";
import { GlAccount } from "../models/glAccount.model";
import { GlEntryLine } from "../models/glEntryLine.model";
import { AccountMapping } from "../models/accountMapping.model";

export interface GlAccountPayload {
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  normal_side: "debit" | "credit";
  parent_id?: number | null;
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
    include: [
      { model: GlAccount, as: "parent", attributes: ["id", "code", "name"] }
    ],
    order: [["code", "ASC"]],
  });
  return rows;
}

export async function getGlAccountById(id: number) {
  const row = await GlAccount.findByPk(id, {
    include: [
      { model: GlAccount, as: "parent", attributes: ["id", "code", "name"] }
    ]
  });
  if (!row) throw new Error("GL Account not found");
  return row;
}

export async function createGlAccount(payload: GlAccountPayload) {
  const { code, parent_id } = payload;
  if (!code) throw new Error("Account code is required");

  const exists = await GlAccount.findOne({ where: { code } });
  if (exists) throw new Error("Account code already exists");

  if (parent_id) {
    const parent = await GlAccount.findByPk(parent_id);
    if (!parent) throw new Error("Parent account not found");
  }

  const row = await GlAccount.create(payload);
  return row;
}

export async function updateGlAccount(
  id: number,
  payload: Partial<GlAccountPayload>
) {
  const row = await GlAccount.findByPk(id);
  if (!row) throw new Error("GL Account not found");

  if (payload.parent_id === id) {
    throw new Error("An account cannot be its own parent.");
  }

  if (payload.parent_id) {
    const parent = await GlAccount.findByPk(payload.parent_id);
    if (!parent) throw new Error("Parent account not found");
  }

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

/**
 * Lấy tài khoản kế toán được cấu hình động (Account Determination) cho chi nhánh.
 * Nếu không cấu hình, tự động trả về tài khoản mặc định dựa trên mã tài khoản (fallbackCode).
 */
export async function getMappedAccount(
  branchId: number,
  mappingKey: string,
  fallbackCode: string,
  transaction?: any
): Promise<number> {
  const mapping = await AccountMapping.findOne({
    where: { branch_id: branchId, mapping_key: mappingKey },
    transaction
  });

  if (mapping) {
    return Number(mapping.account_id);
  }

  const fallbackAcc = await GlAccount.findOne({
    where: { code: fallbackCode },
    transaction
  });

  if (!fallbackAcc) {
    throw new Error(
      `Không tìm thấy tài khoản cấu hình cho '${mappingKey}' và tài khoản mặc định '${fallbackCode}'`
    );
  }

  return Number(fallbackAcc.id);
}

