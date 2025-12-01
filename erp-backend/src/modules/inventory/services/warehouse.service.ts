import { Warehouse } from "../models/warehouse.model";

export const warehouseService = {
  async getAll(user: any) {
    return await Warehouse.findAll({
      where: {
        branch_id: user.branch_id,
      },
    });
  },

  async getById(id: number) {
    return await Warehouse.findByPk(id);
  },

  async create(data: any) {
    return await Warehouse.create(data);
  },

  async update(id: number, data: any) {
    const record = await Warehouse.findByPk(id);
    if (!record) return null;

    return await record.update(data);
  },

  async delete(id: number) {
    const record = await Warehouse.findByPk(id);
    if (!record) return null;

    await record.destroy();
    return true;
  },

  async getByBranchId(branchId: number) {
    return await Warehouse.findAll({
      where: { branch_id: branchId },
    });
  },

  async findByCode(code: string) {
    return await Warehouse.findOne({ where: { code } });
  },
};
