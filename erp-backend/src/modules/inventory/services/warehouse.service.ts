import { Role } from "../../../core/types/enum";
import { Warehouse } from "../models/warehouse.model";
import { hasLinkedData } from "../../../core/utils/getRelation";

export const warehouseService = {
  async getAll(user: any) {
    if (user.role === Role.ADMIN) {
      return await Warehouse.findAll();
    }

    return await Warehouse.findAll({
      where: { branch_id: user.branch_id },
    });
  },

  async getById(id: number) {
    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) return null;
    return warehouse;
  },

  async create(data: any, user: any) {
    if (user.role !== Role.ADMIN) {
      throw {
        status: 403,
        message: "Only admin can create warehouse",
      };
    }

    return await Warehouse.create(data);
  },

  async update(id: number, data: any, user: any) {
    if (user.role !== Role.ADMIN) {
      throw {
        status: 403,
        message: "Only admin can update warehouse",
      };
    }

    const record = await Warehouse.findByPk(id);
    if (!record) return null;

    return await record.update(data);
  },

  async delete(id: number, user: any) {
    if (user.role !== Role.ADMIN) {
      throw { status: 403, message: "Only admin can delete warehouse" };
    }

    const record = await Warehouse.findByPk(id);
    if (!record) return null;

    const hasData = await hasLinkedData(Warehouse, id);
    if (hasData) {
      throw {
        status: 400,
        message: "Cannot delete warehouse because it has related data",
      };
    }

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
