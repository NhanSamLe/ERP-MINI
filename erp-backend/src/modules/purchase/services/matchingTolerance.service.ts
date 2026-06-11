import { MatchingTolerance } from "../models/matchingTolerance.model";

export const matchingToleranceService = {
  async getAll(branchId: number) {
    return await MatchingTolerance.findAll({
      where: { branch_id: branchId },
      order: [["priority", "DESC"]],
    });
  },

  async getById(id: number) {
    return await MatchingTolerance.findByPk(id);
  },

  async create(data: any, userId: number) {
    return await MatchingTolerance.create({
      branch_id: data.branch_id,
      supplier_id: data.supplier_id || null,
      category_id: data.category_id || null,
      price_tolerance_pct: Number(data.price_tolerance_pct ?? 0),
      qty_tolerance_pct: Number(data.qty_tolerance_pct ?? 0),
      amount_tolerance_abs: Number(data.amount_tolerance_abs ?? 0),
      priority: Number(data.priority ?? 0),
      is_active: data.is_active !== false,
      created_by: userId,
    });
  },

  async update(id: number, data: any) {
    const record = await MatchingTolerance.findByPk(id);
    if (!record) return null;
    return await record.update({
      supplier_id: data.supplier_id !== undefined ? data.supplier_id : record.supplier_id,
      category_id: data.category_id !== undefined ? data.category_id : record.category_id,
      price_tolerance_pct: data.price_tolerance_pct !== undefined ? Number(data.price_tolerance_pct) : record.price_tolerance_pct,
      qty_tolerance_pct: data.qty_tolerance_pct !== undefined ? Number(data.qty_tolerance_pct) : record.qty_tolerance_pct,
      amount_tolerance_abs: data.amount_tolerance_abs !== undefined ? Number(data.amount_tolerance_abs) : record.amount_tolerance_abs,
      priority: data.priority !== undefined ? Number(data.priority) : record.priority,
      is_active: data.is_active !== undefined ? data.is_active : record.is_active,
    });
  },

  async delete(id: number) {
    const record = await MatchingTolerance.findByPk(id);
    if (!record) return null;
    await record.destroy();
    return true;
  },
};
