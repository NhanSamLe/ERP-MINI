import { StockBalance } from "../models/stockBalance.model";
import { JwtPayload } from "../../../core/types/jwt";
import { Warehouse } from "../models/warehouse.model";

export const stockBalanceService = {
  async getAll(user: JwtPayload) {
    return await StockBalance.findAll({
      include: [
        {
          model: Warehouse,
          as: "warehouse",
          where: { branch_id: user.branch_id },
          attributes: [],
        },
      ],
    });
  },

  async getById(id: number) {
    return await StockBalance.findByPk(id);
  },

  async create(data: Partial<StockBalance>) {
    return await StockBalance.create(data as any);
  },

  async update(id: number, data: Partial<StockBalance>) {
    const record = await StockBalance.findByPk(id);
    if (!record) return null;
    return await record.update(data);
  },

  async delete(id: number) {
    const record = await StockBalance.findByPk(id);
    if (!record) return null;
    await record.destroy();
    return true;
  },

  async findByWarehouse(warehouseId: number) {
    return await StockBalance.findAll({ where: { warehouse_id: warehouseId } });
  },

  async findByProduct(productId: number) {
    return await StockBalance.findAll({ where: { product_id: productId } });
  },

  async findByProductAndWarehouse(productId: number, warehouseId: number) {
    return await StockBalance.findOne({
      where: { product_id: productId, warehouse_id: warehouseId },
    });
  },
};
