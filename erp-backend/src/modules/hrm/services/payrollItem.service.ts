import { Op } from "sequelize";
import * as model from "../../../models/index";
import { PayrollItemType } from "../models/payrollItem.model";
import { hasLinkedData } from "../../../core/utils/getRelation";

export interface PayrollItemFilter {
  branch_id?: number;
  type?: PayrollItemType | "all";
  search?: string;
}

export interface PayrollItemPayload {
  branch_id: number;
  item_code: string;
  name: string;
  type: PayrollItemType;
  is_taxable?: boolean;
  is_active?: boolean;
}

// LIST
export async function getAllPayrollItems(filter: PayrollItemFilter = {}) {
  const where: any = {};

  if (filter.branch_id) where.branch_id = filter.branch_id;
  if (filter.type && filter.type !== "all") where.type = filter.type;
  if (filter.search) {
    where[Op.or] = [
      { item_code: { [Op.like]: `%${filter.search}%` } },
      { name: { [Op.like]: `%${filter.search}%` } },
    ];
  }

  const rows = await model.PayrollItem.findAll({
    where,
    order: [["item_code", "ASC"]],
    include: [
      {
        model: model.Branch,
        as: "branch",
        attributes: ["id", "code", "name"],
      },
    ],
  });

  return rows;
}

// DETAIL
export async function getPayrollItemById(id: number) {
  const row = await model.PayrollItem.findByPk(id, {
    include: [
      {
        model: model.Branch,
        as: "branch",
        attributes: ["id", "code", "name"],
      },
    ],
  });
  if (!row) throw new Error("Payroll item not found");
  return row;
}

// CREATE
export async function createPayrollItem(payload: PayrollItemPayload) {
  const { branch_id, item_code, name, type } = payload;

  if (!branch_id || !item_code || !name || !type) {
    throw new Error("branch_id, item_code, name, type are required");
  }

  const exists = await model.PayrollItem.findOne({
    where: { branch_id, item_code },
  });
  if (exists) {
    throw new Error("Item code already exists in this branch");
  }

  const row = await model.PayrollItem.create({
    branch_id,
    item_code,
    name,
    type,
    is_taxable:
      typeof payload.is_taxable === "boolean" ? payload.is_taxable : true,
    is_active:
      typeof payload.is_active === "boolean" ? payload.is_active : true,
  });

  return row;
}

// UPDATE
export async function updatePayrollItem(
  id: number,
  payload: Partial<PayrollItemPayload>
) {
  const row = await model.PayrollItem.findByPk(id);
  if (!row) throw new Error("Payroll item not found");

  // đổi mã → check unique trong chi nhánh
  if (payload.item_code && payload.item_code !== row.item_code) {
    const exists = await model.PayrollItem.findOne({
      where: {
        branch_id: row.branch_id,
        item_code: payload.item_code,
        id: { [Op.ne]: id },
      },
    });
    if (exists) {
      throw new Error("Item code already exists in this branch");
    }
    row.item_code = payload.item_code;
  }

  if (payload.name) row.name = payload.name;
  if (payload.type) row.type = payload.type;
  if (typeof payload.is_taxable === "boolean")
    row.is_taxable = payload.is_taxable;
  if (typeof payload.is_active === "boolean")
    row.is_active = payload.is_active;

  await row.save();
  return row;
}

// DELETE – chỉ xóa khi chưa phát sinh
export async function deletePayrollItem(id: number) {
  const row = await model.PayrollItem.findByPk(id);
  if (!row) throw new Error("Payroll item not found");

  const linked = await hasLinkedData(model.PayrollItem, id);
  if (linked) {
    throw new Error(
      "Khoản lương đã được sử dụng trong nghiệp vụ, không thể xóa. Hãy đánh dấu ngưng sử dụng (is_active = 0)."
    );
  }

  await row.destroy();
}
