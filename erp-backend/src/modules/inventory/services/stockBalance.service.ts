import { StockBalance } from "../models/stockBalance.model";

export const stockBalanceService = {
  async getAll() {
    return await StockBalance.findAll();
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
};
