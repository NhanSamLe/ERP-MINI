import { Op } from "sequelize";
import { CostCenter } from "../models/costCenter.model";

export interface CostCenterFilter {
  search?: string;
  branch_id?: number;
}

export async function getAllCostCenters(filter: CostCenterFilter = {}) {
  const where: any = {};

  if (filter.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filter.search}%` } },
      { code: { [Op.like]: `%${filter.search}%` } },
    ];
  }

  if (filter.branch_id) {
    where.branch_id = filter.branch_id;
  }

  const rows = await CostCenter.findAll({
    where,
    order: [["id", "ASC"]],
  });

  return rows;
}

export async function getCostCenterById(id: number) {
  const row = await CostCenter.findByPk(id);
  if (!row) throw new Error("Cost center not found");
  return row;
}

export async function createCostCenter(payload: {
  branch_id: number;
  code: string;
  name: string;
  status?: "active" | "inactive";
}) {
  if (!payload.branch_id) throw new Error("Branch is required");
  if (!payload.code) throw new Error("Code is required");
  if (!payload.name) throw new Error("Name is required");

  const existed = await CostCenter.findOne({
    where: {
      branch_id: payload.branch_id,
      code: payload.code,
    },
  });
  if (existed) {
    throw new Error("Mã trung tâm chi phí này đã tồn tại trong chi nhánh này");
  }

  const row = await CostCenter.create({ ...payload, status: payload.status ?? "active" });
  return row;
}

export async function updateCostCenter(
  id: number,
  payload: Partial<{ branch_id: number; code: string; name: string; status: "active" | "inactive" }>
) {
  const row = await CostCenter.findByPk(id);
  if (!row) throw new Error("Cost center not found");

  const newBranchId = payload.branch_id ?? row.branch_id;
  const newCode = payload.code ?? row.code;

  if (newBranchId !== row.branch_id || newCode !== row.code) {
    const existed = await CostCenter.findOne({
      where: {
        branch_id: newBranchId,
        code: newCode,
        id: { [Op.ne]: id },
      },
    });

    if (existed) {
      throw new Error("Mã trung tâm chi phí này đã tồn tại trong chi nhánh này");
    }
  }

  await row.update(payload);
  return row;
}

export async function deleteCostCenter(id: number) {
  const row = await CostCenter.findByPk(id);
  if (!row) throw new Error("Cost center not found");

  await row.destroy();
}
