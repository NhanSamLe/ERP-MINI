import {
  StockMoveCreateDTO,
  StockMoveUpdateDTO,
} from "../dto/stockMoveCreate.dto";
import { StockMove } from "../models/stockMove.model";
import { StockMoveLine } from "../models/stockMoveLine.model";

export const stockMoveService = {
  async getAll() {
    return await StockMove.findAll({
      include: [
        {
          model: StockMoveLine,
          as: "lines",
        },
      ],
    });
  },

  async getById(id: number) {
    return await StockMove.findByPk(id);
  },

  async create(body: StockMoveCreateDTO) {
    const data: any = {
      move_no: body.move_no,
      move_date: new Date(body.move_date),
      type: body.type,
      warehouse_id: body.warehouse_id,
      reference_type: body.reference_type,
      note: body.note,
    };

    if (body.reference_id !== undefined) {
      data.reference_id = body.reference_id;
    }

    const move = await StockMove.create(data);
    await Promise.all(
      body.lines.map((line) =>
        StockMoveLine.create({
          move_id: move.id,
          product_id: line.product_id,
          quantity: line.quantity,
          uom: line.uom,
        })
      )
    );
    return move;
  },

  async update(id: number, body: StockMoveUpdateDTO) {
    const record = await StockMove.findByPk(id);
    if (!record) return null;

    const updateData: any = {
      move_no: body.move_no,
      move_date: new Date(body.move_date),
      type: body.type,
      warehouse_id: body.warehouse_id,
      reference_type: body.reference_type,
      note: body.note,
    };

    if (body.reference_id !== undefined) {
      updateData.reference_id = body.reference_id;
    }

    await record.update(updateData);

    const existingLines = await StockMoveLine.findAll({
      where: { move_id: id },
    });
    const newLines = body.lines;

    const toDelete = existingLines.filter(
      (line) => !newLines.some((l) => l.id === line.id)
    );
    await Promise.all(toDelete.map((line) => line.destroy()));

    const toUpdate = existingLines.filter((line) =>
      newLines.some((l) => l.id === line.id)
    );
    await Promise.all(
      toUpdate.map((line) => {
        const newData = newLines.find((l) => l.id === line.id);
        if (!newData) return;
        return line.update({
          product_id: newData.product_id,
          quantity: newData.quantity,
          uom: newData.uom,
        });
      })
    );

    const toCreate = newLines.filter((l) => !l.id);
    await Promise.all(
      toCreate.map((line) =>
        StockMoveLine.create({
          move_id: record.id,
          product_id: line.product_id,
          quantity: line.quantity,
          uom: line.uom,
        })
      )
    );
    return record;
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
