import { Op } from "sequelize";
import { GlAccount } from "../models/glAccount.model";
import { GlEntryLine } from "../models/glEntryLine.model";
import { AccountMapping } from "../models/accountMapping.model";

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
  const where: any = {
    [Op.or]: [
      { company_id: companyId },
      { company_id: null }
    ]
  };
  if (search) {
    where[Op.and] = [
      {
        [Op.or]: [
          { code: { [Op.like]: `%${search}%` } },
          { name: { [Op.like]: `%${search}%` } },
        ]
      }
    ];
  }
  return GlAccount.findAll({ where, order: [["code", "ASC"]] });
}

export async function getGlAccountById(id: number, companyId: number) {
  const row = await GlAccount.findOne({
    where: {
      id,
      [Op.or]: [
        { company_id: companyId },
        { company_id: null }
      ]
    }
  });
  if (!row) throw new Error("GL Account not found");
  return row;
}

export async function createGlAccount(payload: GlAccountPayload) {
  const { code, parent_id,company_id } = payload;
  if (!code) throw new Error("Account code is required");
  if (!company_id) throw new Error("company_id is required");

  const exists = await GlAccount.findOne({ where: { company_id, code } });
  if (exists) throw new Error(`Account code "${code}" already exists in this company`);

  if (parent_id) {
    const parent = await GlAccount.findByPk(parent_id);
    if (!parent) throw new Error("Parent account not found");
  }

  const row = await GlAccount.create(payload);
  return row;
}

export async function updateGlAccount(id: number, payload: Partial<GlAccountPayload>, companyId: number) {
  const row = await GlAccount.findOne({ where: { id, company_id: companyId } });
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

  // 1. Check if has sub-accounts
  const childCount = await GlAccount.count({ where: { parent_id: id } });
  if (childCount > 0) {
    throw new Error(
      "Cannot delete GL Account because it has sub-accounts. Please delete or re-assign sub-accounts first."
    );
  }

  // 2. Check if used in journal entry lines
  const usedCount = await GlEntryLine.count({ where: { account_id: id } });
  if (usedCount > 0) {
    throw new Error("Cannot delete GL Account because it has related journal entries");
  }

  // 3. Check if mapped in Account Determination settings
  const mappingCount = await AccountMapping.count({ where: { account_id: id } });
  if (mappingCount > 0) {
    throw new Error(
      "Cannot delete GL Account because it is currently mapped in Account Determination configurations."
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

