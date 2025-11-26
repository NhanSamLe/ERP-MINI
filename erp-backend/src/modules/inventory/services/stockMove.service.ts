import { StockMove } from "../models/stockMove.model";

export const stockMoveService = {
  async getAll() {
    return await StockMove.findAll();
  },

  async getById(id: number) {
    return await StockMove.findByPk(id);
  },

  async create(data: any) {
    return await StockMove.create(data);
  },

  async update(id: number, data: any) {
    const record = await StockMove.findByPk(id);
    if (!record) return null;
    return await record.update(data);
  },

  async delete(id: number) {
    const record = await StockMove.findByPk(id);
    if (!record) return null;
    await record.destroy();
    return true;
  },

  async findByType(type: string) {
    return await StockMove.findAll({ where: { type } });
  },

  async findByWarehouse(warehouseId: number) {
    return await StockMove.findAll({ where: { warehouse_id: warehouseId } });
  },

  async findByStatus(status: string) {
    return await StockMove.findAll({ where: { status } });
  },
};
