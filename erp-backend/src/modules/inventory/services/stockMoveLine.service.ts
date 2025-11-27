import { StockMoveLine } from "../models/stockMoveLine.model";

export const stockMoveLineService = {
  async getAll() {
    return await StockMoveLine.findAll();
  },

  async getById(id: number) {
    return await StockMoveLine.findByPk(id);
  },

  async getByMoveId(moveId: number) {
    return await StockMoveLine.findAll({
      where: { move_id: moveId },
    });
  },

  async create(data: any) {
    return await StockMoveLine.create(data);
  },

  async bulkCreate(lines: any[]) {
    return await StockMoveLine.bulkCreate(lines);
  },

  async update(id: number, data: any) {
    const record = await StockMoveLine.findByPk(id);
    if (!record) return null;
    return await record.update(data);
  },

  async delete(id: number) {
    const record = await StockMoveLine.findByPk(id);
    if (!record) return null;

    await record.destroy();
    return true;
  },

  async deleteByMoveId(moveId: number) {
    return await StockMoveLine.destroy({
      where: { move_id: moveId },
    });
  },
};
