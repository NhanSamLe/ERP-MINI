import { AccountMapping } from "../models/accountMapping.model";
import { GlAccount } from "../models/glAccount.model";
import { Branch } from "../../company/models/branch.model";

export async function getAllAccountMappings(filter: { branch_id?: number }) {
  const where: any = {};
  if (filter.branch_id) {
    where.branch_id = filter.branch_id;
  }
  return await AccountMapping.findAll({
    where,
    include: [
      { model: GlAccount, as: "account", attributes: ["id", "code", "name"] },
      { model: Branch, as: "branch", attributes: ["id", "code", "name"] }
    ],
    order: [["mapping_key", "ASC"]]
  });
}

export async function upsertAccountMapping(payload: {
  branch_id: number;
  mapping_key: string;
  account_id: number;
  description?: string | null;
}) {
  const { branch_id, mapping_key, account_id, description } = payload;
  
  if (!branch_id || !mapping_key || !account_id) {
    throw new Error("Missing required fields: branch_id, mapping_key, account_id");
  }

  // Verify branch exists
  const branch = await Branch.findByPk(branch_id);
  if (!branch) throw new Error("Branch not found");

  // Verify account exists
  const account = await GlAccount.findByPk(account_id);
  if (!account) throw new Error("GL Account not found");

  const [row, created] = await AccountMapping.findOrCreate({
    where: { branch_id, mapping_key },
    defaults: {
      branch_id,
      mapping_key,
      account_id,
      description: description ?? null,
    } as any,
  });

  if (!created) {
    await row.update({
      account_id,
      description: description ?? null,
    } as any);
  }

  return row;
}

export async function deleteAccountMapping(id: number) {
  const row = await AccountMapping.findByPk(id);
  if (!row) throw new Error("Account mapping not found");
  await row.destroy();
}
