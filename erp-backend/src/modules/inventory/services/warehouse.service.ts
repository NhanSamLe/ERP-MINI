import { Role } from "../../../core/types/enum";
import { Warehouse } from "../models/warehouse.model";
import { hasLinkedData } from "../../../core/utils/getRelation";
import { getCompanyBranchIds } from "../../finance/services/companyScope.service";
import { Op } from "sequelize";

export const warehouseService = {
  async getAll(user: any) {
    const companyBranchIds = await getCompanyBranchIds(user);
    if (user.role === "ADMIN") {
      return await Warehouse.findAll({
        where: { branch_id: { [Op.in]: companyBranchIds } }
      });
    }

    return await Warehouse.findAll({
      where: { branch_id: user.branch_id },
    });
  },

  async getById(id: number, user?: any) {
    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) return null;

    if (user) {
      const companyBranchIds = await getCompanyBranchIds(user);
      if (user.role === "ADMIN" && !companyBranchIds.includes(Number(warehouse.branch_id))) {
        return null;
      }
    }
    return warehouse;
  },

  async create(data: any, user: any) {
    if (user.role !== "ADMIN") {
      throw {
        status: 403,
        message: "Only admin can create warehouse",
      };
    }

    const companyBranchIds = await getCompanyBranchIds(user);
    if (!companyBranchIds.includes(Number(data.branch_id))) {
      throw {
        status: 400,
        message: "Cannot create warehouse for another company's branch",
      };
    }

    return await Warehouse.create(data);
  },

  async update(id: number, data: any, user: any) {
    if (user.role !== "ADMIN") {
      throw {
        status: 403,
        message: "Only admin can update warehouse",
      };
    }

    const record = await Warehouse.findByPk(id);
    if (!record) return null;

    const companyBranchIds = await getCompanyBranchIds(user);
    if (!companyBranchIds.includes(Number(record.branch_id))) {
      throw {
        status: 403,
        message: "Access denied: cross-company",
      };
    }

    if (data.branch_id) {
      if (!companyBranchIds.includes(Number(data.branch_id))) {
        throw {
          status: 400,
          message: "Cannot change warehouse branch to another company's branch",
        };
      }
    }

    return await record.update(data);
  },

  async delete(id: number, user: any) {
    if (user.role !== "ADMIN") {
      throw { status: 403, message: "Only admin can delete warehouse" };
    }

    const record = await Warehouse.findByPk(id);
    if (!record) return null;

    const companyBranchIds = await getCompanyBranchIds(user);
    if (!companyBranchIds.includes(Number(record.branch_id))) {
      throw {
        status: 403,
        message: "Access denied: cross-company",
      };
    }

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
