 import { Transaction } from "sequelize";
import { Branch } from "../../company/models/branch.model";

export async function getCompanyIdFromBranch(
  branchId?: number | null,
  transaction?: Transaction,
): Promise<number> {
  if (!branchId) {
    throw new Error("Không xác định được chi nhánh để suy ra công ty.");
  }

  const options: any = {
    attributes: ["id", "company_id"],
  };
  if (transaction) options.transaction = transaction;

  const branch = await Branch.findByPk(branchId, options);

  const companyId = (branch as any)?.company_id;
  if (!companyId) {
    throw new Error("Chi nhánh chưa gắn công ty, không thể hạch toán GL.");
  }

  return Number(companyId);
}

export async function getCompanyIdFromUserBranch(
  user: { company_id?: number | null; branch_id?: number | null },
  transaction?: Transaction,
): Promise<number> {
  if (user?.company_id) return Number(user.company_id);
  return getCompanyIdFromBranch(user?.branch_id, transaction);
}

export async function getCompanyBranchIds(user: any): Promise<number[]> {
  const companyId = await getCompanyIdFromUserBranch(user);
  const branches = await Branch.findAll({
    where: { company_id: companyId },
    attributes: ["id"]
  });
  return branches.map((b: any) => Number(b.id));
}
