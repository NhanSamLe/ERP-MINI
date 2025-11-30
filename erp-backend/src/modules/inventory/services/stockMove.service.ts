import {
  StockMoveAdjustmentDTO,
  StockMoveCreateDTO,
  StockMoveTransferDTO,
  StockMoveUpdateDTO,
} from "../dto/stockMoveCreate.dto";
import { StockMove } from "../models/stockMove.model";
import { StockMoveLine } from "../models/stockMoveLine.model";
import { Warehouse } from "../models/warehouse.model";
import { stockBalanceService } from "./stockBalance.service";
import { productService } from "../../product/services/product.service";
import { purchaseOrderService } from "../../purchase/services/purchaseOrder.service";
import { PurchaseOrderLine } from "../../purchase/models/purchaseOrderLine.model";

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

  async createReceipt(body: StockMoveCreateDTO) {
    if (!body.reference_id) {
      throw {
        status: 400,
        message: "Reference ID is required to create a receipt.",
      };
    }

    const poLines = await purchaseOrderService.getPOLines(body.reference_id);
    const poMap = new Map<number, PurchaseOrderLine>();
    poLines.forEach((l) => {
      if (l.product_id != null) {
        poMap.set(l.product_id, l);
      }
    });

    for (const line of body.lines) {
      const poLine = await purchaseOrderService.validateProductInPO(
        poMap,
        line.product_id
      );

      const received = await purchaseOrderService.getAlreadyReceivedQty(
        body.reference_id,
        line.product_id
      );

      await purchaseOrderService.validateRemainingQuantity(
        line.product_id,
        line.quantity,
        poLine.quantity ?? 0,
        received
      );
    }

    const data: any = {
      move_no: body.move_no,
      move_date: new Date(body.move_date),
      type: body.type,
      warehouse_to_id: body.warehouse_id,
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
    const createdMove = await StockMove.findByPk(move.id, {
      include: [{ model: StockMoveLine, as: "lines" }],
    });

    return createdMove;
  },

  async createAdjustment(body: StockMoveAdjustmentDTO) {
    const warehouseId = body.warehouse_id;

    for (const line of body.lines) {
      const { product_id, quantity } = line;
      const stockBalance = await stockBalanceService.findByProductAndWarehouse(
        product_id,
        warehouseId
      );
      if (quantity <= 0) {
        if (!stockBalance) {
          const productResult = await productService.getById(product_id);
          throw {
            status: 400,
            message: `Sản phẩm ID ${productResult?.name} chưa tồn tại trong kho, không thể điều chỉnh giảm.`,
          };
        }
        const absQty = Math.abs(quantity);
        if (stockBalance.quantity < absQty) {
          throw {
            status: 400,
            message: `Không đủ tồn kho để giảm. Hiện tại: ${stockBalance.quantity}, yêu cầu giảm: ${absQty}`,
          };
        }
      }
    }
    const data: any = {
      move_no: body.move_no,
      move_date: new Date(body.move_date),
      type: body.type,
      warehouse_from_id: body.warehouse_id,
      reference_type: body.reference_type,
      note: body.note,
    };
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
    const createdMove = await StockMove.findByPk(move.id, {
      include: [{ model: StockMoveLine, as: "lines" }],
    });

    return createdMove;
  },

  async createTransfer(body: StockMoveTransferDTO) {
    const data: any = {
      move_no: body.move_no,
      move_date: new Date(body.move_date),
      type: body.type,
      warehouse_from_id: body.warehouse_from_id,
      warehouse_to_id: body.warehouse_to_id,
      reference_type: body.reference_type,
      note: body.note,
    };
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
    const createdMove = await StockMove.findByPk(move.id, {
      include: [{ model: StockMoveLine, as: "lines" }],
    });

    return createdMove;
  },

  async updateReceipt(id: number, body: StockMoveUpdateDTO) {
    if (!body.reference_id) {
      throw {
        status: 400,
        message: "Reference ID is required to create a receipt.",
      };
    }

    const poLines = await purchaseOrderService.getPOLines(body.reference_id);
    const poMap = new Map<number, PurchaseOrderLine>();
    poLines.forEach((l) => {
      if (l.product_id != null) {
        poMap.set(l.product_id, l);
      }
    });

    for (const line of body.lines) {
      const poLine = await purchaseOrderService.validateProductInPO(
        poMap,
        line.product_id
      );

      const received = await purchaseOrderService.getAlreadyReceivedQty(
        body.reference_id,
        line.product_id
      );

      await purchaseOrderService.validateRemainingQuantity(
        line.product_id,
        line.quantity,
        poLine.quantity ?? 0,
        received
      );
    }
    const record = await StockMove.findByPk(id);
    if (!record) return null;

    const updateData: any = {
      move_no: body.move_no,
      move_date: new Date(body.move_date),
      type: body.type,
      warehouse_to_id: body.warehouse_id,
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
    const updated = await StockMove.findByPk(id, {
      include: [{ model: StockMoveLine, as: "lines" }],
    });

    return updated;
  },

  async updateAdjustment(id: number, body: StockMoveAdjustmentDTO) {
    const warehouseId = body.warehouse_id;

    for (const line of body.lines) {
      const { product_id, quantity } = line;
      const stockBalance = await stockBalanceService.findByProductAndWarehouse(
        product_id,
        warehouseId
      );
      if (quantity <= 0) {
        if (!stockBalance) {
          const productResult = await productService.getById(product_id);
          throw {
            status: 400,
            message: `Sản phẩm ID ${productResult?.name} chưa tồn tại trong kho, không thể điều chỉnh giảm.`,
          };
        }
        const absQty = Math.abs(quantity);
        if (stockBalance.quantity < absQty) {
          throw {
            status: 400,
            message: `Không đủ tồn kho để giảm. Hiện tại: ${stockBalance.quantity}, yêu cầu giảm: ${absQty}`,
          };
        }
      }
    }
    const record = await StockMove.findByPk(id);
    if (!record) return null;

    const updateData: any = {
      move_no: body.move_no,
      move_date: new Date(body.move_date),
      type: body.type,
      warehouse_to_id: body.warehouse_id,
      reference_type: body.reference_type,
      note: body.note,
    };
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
    const updated = await StockMove.findByPk(id, {
      include: [{ model: StockMoveLine, as: "lines" }],
    });

    return updated;
  },

  async updateTransfer(id: number, body: StockMoveTransferDTO) {
    const record = await StockMove.findByPk(id);
    if (!record) return null;

    const updateData: any = {
      move_no: body.move_no,
      move_date: new Date(body.move_date),
      type: body.type,
      warehouse_from_id: body.warehouse_from_id,
      warehouse_to_id: body.warehouse_to_id,
      reference_type: body.reference_type,
      note: body.note,
    };

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
    const updated = await StockMove.findByPk(id, {
      include: [{ model: StockMoveLine, as: "lines" }],
    });

    return updated;
  },

  async delete(id: number) {
    const record = (await StockMove.findByPk(id, {
      include: [{ model: StockMoveLine, as: "lines" }],
    })) as any;

    if (!record) {
      throw { status: 404, message: "Stock move not found" };
    }

    if (record.status !== "draft") {
      throw {
        status: 400,
        message: `Không thể xóa phiếu vì đã được duyệt`,
      };
    }
    await Promise.all((record.lines ?? []).map((line: any) => line.destroy()));
    await record.destroy();
    return true;
  },

  async findByType(type: string) {
    return await StockMove.findAll({ where: { type } });
  },

  async findByStatus(status: string) {
    return await StockMove.findAll({ where: { status } });
  },
};
