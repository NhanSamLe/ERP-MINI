import { Op } from "sequelize";
import { PayrollAccountMapping, PayrollMappingItemType } from "../models/payrollAccountMapping.model";
import { Department } from "../models/department.model";
import { GlAccount } from "../../finance/models/glAccount.model";

export interface PayrollMappingFilter {
  branch_id?: number;
  department_id?: number;
  item_type?: PayrollMappingItemType;
}

export async function getAllMappings(filter: PayrollMappingFilter = {}) {
  const where: any = {};

  if (filter.branch_id) {
    where.branch_id = filter.branch_id;
  }
  if (filter.department_id) {
    where.department_id = filter.department_id;
  }
  if (filter.item_type) {
    where.item_type = filter.item_type;
  }

  const rows = await PayrollAccountMapping.findAll({
    where,
    include: [
      { model: Department, as: "department" },
      { model: GlAccount, as: "account" },
    ],
    order: [["id", "ASC"]],
  });

  return rows;
}

export async function createMapping(payload: {
  branch_id: number;
  department_id?: number | null;
  item_type: PayrollMappingItemType;
  account_id: number;
}) {
  if (!payload.branch_id) throw new Error("Branch is required");
  if (!payload.item_type) throw new Error("Item type is required");
  if (!payload.account_id) throw new Error("GL Account is required");

  // Check unique constraint for (branch_id, department_id, item_type)
  const existed = await PayrollAccountMapping.findOne({
    where: {
      branch_id: payload.branch_id,
      department_id: payload.department_id || null,
      item_type: payload.item_type,
    },
  });

  if (existed) {
    throw new Error("Cấu hình tài khoản cho bộ phận và khoản mục này đã tồn tại");
  }

  const row = await PayrollAccountMapping.create(payload);
  return await PayrollAccountMapping.findByPk(row.id, {
    include: [
      { model: Department, as: "department" },
      { model: GlAccount, as: "account" },
    ],
  });
}

export async function updateMapping(
  id: number,
  payload: Partial<{ department_id: number | null; item_type: PayrollMappingItemType; account_id: number }>
) {
  const row = await PayrollAccountMapping.findByPk(id);
  if (!row) throw new Error("Mapping not found");

  const newDeptId = payload.department_id !== undefined ? payload.department_id : row.department_id;
  const newType = payload.item_type ?? row.item_type;

  if (newDeptId !== row.department_id || newType !== row.item_type) {
    const existed = await PayrollAccountMapping.findOne({
      where: {
        branch_id: row.branch_id,
        department_id: newDeptId || null,
        item_type: newType,
        id: { [Op.ne]: id },
      },
    });

    if (existed) {
      throw new Error("Cấu hình tài khoản cho bộ phận và khoản mục này đã tồn tại");
    }
  }

  await row.update(payload);
  return await PayrollAccountMapping.findByPk(id, {
    include: [
      { model: Department, as: "department" },
      { model: GlAccount, as: "account" },
    ],
  });
}

export async function deleteMapping(id: number) {
  const row = await PayrollAccountMapping.findByPk(id);
  if (!row) throw new Error("Mapping not found");

  await row.destroy();
}
