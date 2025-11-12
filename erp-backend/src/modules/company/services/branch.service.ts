import * as model from "../../../models/index";
import { Op } from "sequelize";
import { Branch } from "../models/branch.model";

export async function getAllBranches() {
  const branches = await model.Branch.findAll();
  return branches;
}
export async function getBranchById(id: number) {
  const row = await Branch.findByPk(id);
  if (!row) throw new Error("Branch not found");
  return row;
}

export async function createBranch(payload: any) {
  const { code } = payload;
  if (!code) throw new Error("Branch code is required");

  const exists = await Branch.findOne({ where: { code } });
  if (exists) throw new Error("Branch code already exists");

  const row = await Branch.create(payload);
  return row;
}

export async function updateBranch(id: number, payload: any) {
  const row = await Branch.findByPk(id);
  if (!row) throw new Error("Branch not found");

  // nếu đổi code thì check trùng
  if (payload.code) {
    const dup = await Branch.findOne({
      where: { code: payload.code, id: { [Op.ne]: id } },
    });
    if (dup) throw new Error("Branch code already exists");
  }

  await row.update(payload);
  return row;
}

export async function deactivateBranch(id: number) {
  const row = await Branch.findByPk(id);
  if (!row) throw new Error("Branch not found");
  await row.update({ status: "inactive" });
  return { message: "Branch deactivated" };
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