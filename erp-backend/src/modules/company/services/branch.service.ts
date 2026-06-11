import * as model from "../../../models/index";
import { Op } from "sequelize";
import { Branch } from "../models/branch.model";

const BRANCH_MUTABLE_FIELDS = [
  "code",
  "name",
  "address",
  "province",
  "district",
  "ward",
  "tax_code",
  "phone",
  "bank_account",
  "bank_name",
  "status",
] as const;

function normalizeBranchPayload(payload: any, includeCompany = false) {
  const data: any = {};

  for (const field of BRANCH_MUTABLE_FIELDS) {
    if (payload[field] !== undefined) {
      data[field] = typeof payload[field] === "string" ? payload[field].trim() : payload[field];
    }
  }

  if (includeCompany && payload.company_id !== undefined) {
    data.company_id = Number(payload.company_id);
  }

  if (data.status && !["active", "inactive"].includes(data.status)) {
    throw new Error("Trang thai chi nhanh khong hop le");
  }

  if (data.code !== undefined && !data.code) {
    throw new Error("Vui long nhap ma chi nhanh");
  }

  if (data.name !== undefined && !data.name) {
    throw new Error("Vui long nhap ten chi nhanh");
  }

  return data;
}

export async function getAllBranches(companyId?: number) {
  const where: any = {};
  if (companyId) where.company_id = companyId;
  return model.Branch.findAll({ where, order: [["id", "ASC"]] });
}

export async function getBranchById(id: number, companyId?: number) {
  const where: any = { id };
  if (companyId) where.company_id = companyId;
  const row = await Branch.findOne({ where });
  if (!row) throw new Error("Branch not found");
  return row;
}

export async function createBranch(payload: any) {
  const data = normalizeBranchPayload(payload, true);
  const { code, company_id } = data;
  if (!company_id) throw new Error("Khong xac dinh duoc cong ty cua chi nhanh");
  if (!code) throw new Error("Vui long nhap ma chi nhanh");
  if (!data.name) throw new Error("Vui long nhap ten chi nhanh");

  const exists = await Branch.findOne({ where: { code, company_id } });
  if (exists) throw new Error("Ma chi nhanh da ton tai trong cong ty nay");

  const row = await Branch.create(data);
  return row;
}

export async function updateBranch(id: number, payload: any, companyId?: number) {
  const where: any = { id };
  if (companyId) where.company_id = companyId;

  const row = await Branch.findOne({ where });
  if (!row) throw new Error("Branch not found");
  const data = normalizeBranchPayload(payload);

  // nếu đổi code thì check trùng
  if (data.code) {
    const dup = await Branch.findOne({
      where: { code: data.code, company_id: row.company_id, id: { [Op.ne]: id } },
    });
    if (dup) throw new Error("Ma chi nhanh da ton tai trong cong ty nay");
  }

  await row.update(data);
  return row;
}

export async function deactivateBranch(id: number) {
  const row = await Branch.findByPk(id);
  if (!row) throw new Error("Branch not found");
  await row.update({ status: "inactive" });
  return { message: "Branch deactivated" };
}
export async function activateBranch(id: number) {
  const row = await Branch.findByPk(id);
  if (!row) throw new Error("Branch not found");
  await row.update({ status: "active" });
  return { message: "Branch activated" };
}
export async function updateBranchStatus(id: number, status: "active"|"inactive") {
  const row = await Branch.findByPk(id);
  if (!row) throw new Error("Branch not found");
  await row.update({ status });
  return row; // trả về bản ghi mới
}
/** Nếu vẫn muốn có delete cứng thì chặn khi còn dữ liệu liên quan */
export async function deleteBranch(id: number) {
  // Tùy dự án: ở đây demo check departments/employees/warehouses
  const [dept, emp, wh] = await Promise.all([
    model.Department?.count({ where: { branch_id: id } }) ?? 0,
    model.Employee?.count({ where: { branch_id: id } }) ?? 0,
    model.Warehouse?.count({ where: { branch_id: id } }) ?? 0,
  ]);

  if (dept > 0 || emp > 0 || wh > 0) {
    throw new Error("Cannot delete branch with related data");
  }
  const affected = await Branch.destroy({ where: { id } });
  if (!affected) throw new Error("Branch not found");
  return { message: "Branch deleted" };
}
