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
import { JwtPayload } from "../../../core/types/jwt";
import { Role } from "../../../core/types/enum";
import { User } from "../../auth/models/user.model";
import { Op } from "sequelize";
import { Product } from "../../product/models/product.model";
import { warehouseService } from "./warehouse.service";

export const stockMoveService = {
  async getAll(user: JwtPayload) {
    const warehouses = await Warehouse.findAll({
      where: { branch_id: user.branch_id },
      attributes: ["id"],
      raw: true,
    });
    const warehouseIds = warehouses.map((w: any) => w.id);

    const where: any = {
      [Op.or]: [
        { warehouse_from_id: { [Op.in]: warehouseIds } },
        { warehouse_to_id: { [Op.in]: warehouseIds } },
      ],
    };

    if (user.role === Role.WHSTAFF) {
      where.created_by = user.id;
    }
    return await StockMove.findAll({
      where,
      include: [
        {
          model: StockMoveLine,
          as: "lines",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "sku", "image_url", "uom"],
            },
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "email", "full_name", "phone", "avatar_url"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "email", "full_name", "phone", "avatar_url"],
        },
      ],
    });
  },

  async getById(id: number) {
    return await StockMove.findByPk(id, {
      include: [
        { model: StockMoveLine, as: "lines" },
        {
          model: User,
          as: "creator",
          attributes: ["id", "email", "full_name", "phone", "avatar_url"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "email", "full_name", "phone", "avatar_url"],
        },
      ],
    });
  },

  async createReceipt(body: StockMoveCreateDTO, user: any) {
    if (!body.reference_id) {
      throw {
        status: 400,
        message: "Reference ID is required to create a receipt.",
      };
    }
    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error(
        "You do not have permission to create Stock Move Receipt"
      );
    }

    const warehouse = await warehouseService.getById(body.warehouse_id);

    if (!warehouse) {
      throw new Error("Warehouse not found.");
    }

    if (warehouse.branch_id !== user.branch_id) {
      throw new Error("You cannot create a receipt for another branch.");
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
      created_by: user.id,
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

    return await this.getById(move.id);
  },

  async createIssue(body: StockMoveCreateDTO, user: any) {
    if (!body.reference_id) {
      throw {
        status: 400,
        message: "Reference ID is required to create a issue.",
      };
    }
    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error("You do not have permission to create Stock Move Issue");
    }

    const warehouse = await warehouseService.getById(body.warehouse_id);

    if (!warehouse) {
      throw new Error("Warehouse not found.");
    }

    if (warehouse.branch_id !== user.branch_id) {
      throw new Error("You cannot create a issue for another branch.");
    }

    const data: any = {
      move_no: body.move_no,
      move_date: new Date(body.move_date),
      type: body.type,
      warehouse_from_id: body.warehouse_id,
      reference_type: body.reference_type,
      note: body.note,
      created_by: user.id,
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

    return await this.getById(move.id);
  },

  async createAdjustment(body: StockMoveAdjustmentDTO, user: any) {
    const warehouseId = body.warehouse_id;
    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error(
        "You do not have permission to create Stock Move Adjustment."
      );
    }

    const warehouse = await warehouseService.getById(body.warehouse_id);
    if (!warehouse) {
      throw new Error("Warehouse not found.");
    }

    if (warehouse.branch_id !== user.branch_id) {
      throw new Error("You cannot create a Adjustment for another branch.");
    }

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
      created_by: user.id,
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
    return await this.getById(move.id);
  },

  async createTransfer(body: StockMoveTransferDTO, user: any) {
    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error(
        "You do not have permission to create Stock Move Transfer"
      );
    }

    const warehouseFrom = await Warehouse.findByPk(body.warehouse_from_id);
    const warehouseTo = await Warehouse.findByPk(body.warehouse_to_id);

    if (!warehouseFrom || !warehouseTo) {
      throw new Error("Warehouse not found.");
    }

    if (
      warehouseFrom.branch_id !== user.branch_id ||
      warehouseTo.branch_id !== user.branch_id
    ) {
      throw new Error("You cannot create a transfer involving other branches.");
    }

    const data: any = {
      move_no: body.move_no,
      move_date: new Date(body.move_date),
      type: body.type,
      warehouse_from_id: body.warehouse_from_id,
      warehouse_to_id: body.warehouse_to_id,
      reference_type: body.reference_type,
      note: body.note,
      created_by: user.id,
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
    return await this.getById(move.id);
  },

  async updateReceipt(id: number, body: StockMoveUpdateDTO, user: any) {
    if (!body.reference_id) {
      throw {
        status: 400,
        message: "Reference ID is required to update a receipt.",
      };
    }

    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error("You do not have permission to edit Stock Move Receipt");
    }

    const warehouse = await warehouseService.getById(body.warehouse_id);
    if (!warehouse) {
      throw new Error("Warehouse not found.");
    }

    if (warehouse.branch_id !== user.branch_id) {
      throw new Error("You cannot create a edit for another branch.");
    }

    if (body.created_by !== user.id)
      throw new Error("You can only modify your own orders");
    const record = await StockMove.findByPk(id);
    if (record?.status !== "draft") {
      throw {
        status: 400,
        message:
          "Cannot edit the stock move because it has already been approved",
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
    return await this.getById(id);
  },

  async updateIssue(id: number, body: StockMoveUpdateDTO, user: any) {
    if (!body.reference_id) {
      throw {
        status: 400,
        message: "Reference ID is required to update a issue.",
      };
    }

    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error("You do not have permission to edit Stock Move Issue");
    }

    const warehouse = await warehouseService.getById(body.warehouse_id);
    if (!warehouse) {
      throw new Error("Warehouse not found.");
    }

    if (warehouse.branch_id !== user.branch_id) {
      throw new Error("You cannot create a edit for another branch.");
    }

    if (body.created_by !== user.id)
      throw new Error("You can only modify your own orders");
    const record = await StockMove.findByPk(id);
    if (record?.status !== "draft") {
      throw {
        status: 400,
        message:
          "Cannot edit the stock move because it has already been approved",
      };
    }

    const updateData: any = {
      move_no: body.move_no,
      move_date: new Date(body.move_date),
      type: body.type,
      warehouse_from_id: body.warehouse_id,
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
    return await this.getById(id);
  },

  async updateAdjustment(id: number, body: StockMoveAdjustmentDTO, user: any) {
    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error(
        "You do not have permission to edit Stock Move Adjustment."
      );
    }

    const warehouse = await warehouseService.getById(body.warehouse_id);
    if (!warehouse) {
      throw new Error("Warehouse not found.");
    }

    if (warehouse.branch_id !== user.branch_id) {
      throw new Error("You cannot create a edit for another branch.");
    }

    if (body.created_by !== user.id)
      throw new Error("You can only modify your own orders");
    const record = await StockMove.findByPk(id);
    if (!record) return null;
    if (record?.status !== "draft") {
      throw {
        status: 400,
        message:
          "Cannot edit the stock move because it has already been approved",
      };
    }
    const warehouseId = body.warehouse_id;

    for (const line of body.lines) {
      const { product_id, quantity } = line;
      const stockBalance = await stockBalanceService.findByProductAndWarehouse(
        product_id,
        warehouseId
      );
      if (quantity <= 0) {
        const productResult = await productService.getById(product_id);
        if (!stockBalance) {
          throw {
            status: 400,
            message: `The product ${productResult?.name} does not exist in stock, so it cannot be decreased.`,
          };
        }
        const absQty = Math.abs(quantity);
        if (stockBalance.quantity < absQty) {
          throw {
            status: 400,
            message: `Insufficient stock to decrease for product ${productResult?.name}. Current quantity: ${stockBalance.quantity}, requested decrease: ${absQty}.`,
          };
        }
      }
    }

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
    return await this.getById(id);
  },

  async updateTransfer(id: number, body: StockMoveTransferDTO, user: any) {
    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error("You do not have permission to edit Stock Move Transfer");
    }

    const warehouseFrom = await Warehouse.findByPk(body.warehouse_from_id);
    const warehouseTo = await Warehouse.findByPk(body.warehouse_to_id);

    if (!warehouseFrom || !warehouseTo) {
      throw new Error("Warehouse not found.");
    }

    if (
      warehouseFrom.branch_id !== user.branch_id ||
      warehouseTo.branch_id !== user.branch_id
    ) {
      throw new Error("You cannot create a edit involving other branches.");
    }

    if (body.created_by !== user.id)
      throw new Error("You can only modify your own orders");
    const record = await StockMove.findByPk(id);
    if (!record) return null;
    if (record?.status !== "draft") {
      throw {
        status: 400,
        message:
          "Cannot edit the stock move because it has already been approved",
      };
    }
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
    return await this.getById(id);
  },

  async delete(id: number, user: any) {
    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error("You do not have permission to delete");
    }

    const record = (await StockMove.findByPk(id, {
      include: [{ model: StockMoveLine, as: "lines" }],
    })) as any;

    const from = await warehouseService.getById(record.warehouse_from_id);
    const to = await warehouseService.getById(record.warehouse_to_id);

    if (record.type === "transfer") {
      if (!from || !to) {
        throw new Error(
          "Invalid transfer: both source and destination warehouses are required."
        );
      }

      if (
        from.branch_id !== user.branch_id ||
        to.branch_id !== user.branch_id
      ) {
        throw new Error(
          "You cannot delete a transfer involving other branches."
        );
      }
    } else if (record.type === "receipt") {
      if (!to)
        throw new Error("Invalid receipt: destination warehouse is missing.");

      if (to.branch_id !== user.branch_id) {
        throw new Error(
          "You cannot delete a receipt involving another branch."
        );
      }
    } else if (record.type === "issue") {
      if (!from) throw new Error("Invalid issue: source warehouse is missing.");

      if (from.branch_id !== user.branch_id) {
        throw new Error("You cannot delete an issue involving another branch.");
      }
    } else if (record.type === "adjustment") {
      if (!from) throw new Error("Invalid adjustment: warehouse is missing.");

      if (from.branch_id !== user.branch_id) {
        throw new Error(
          "You cannot delete an adjustment involving another branch."
        );
      }
    }
    if (!record) {
      throw { status: 404, message: "Stock move not found" };
    }

    if (record.status !== "draft") {
      throw {
        status: 400,
        message: `Cannot delete the stock move because it has already been approved`,
      };
    }
    await Promise.all((record.lines ?? []).map((line: any) => line.destroy()));
    await record.destroy();
    return true;
  },

  async findByType(type: string, user: JwtPayload) {
    const where: any = {
      type,
      [Op.or]: [
        { warehouse_from_id: user.branch_id },
        { warehouse_to_id: user.branch_id },
      ],
    };

    if (user.role === Role.WHSTAFF) {
      where.created_by = user.id;
    }

    return await StockMove.findAll({
      where,
      include: this.buildIncludes(),
    });
  },
  async findByStatus(status: string, user: JwtPayload) {
    const where: any = {
      status,
      [Op.or]: [
        { warehouse_from_id: user.branch_id },
        { warehouse_to_id: user.branch_id },
      ],
    };

    if (user.role === Role.WHSTAFF) {
      where.created_by = user.id;
    }

    return await StockMove.findAll({
      where,
      include: this.buildIncludes(),
    });
  },

  buildIncludes() {
    return [
      { model: StockMoveLine, as: "lines" },
      {
        model: User,
        as: "creator",
        attributes: ["id", "email", "full_name", "phone", "avatar_url"],
      },
      {
        model: User,
        as: "approver",
        attributes: ["id", "email", "full_name", "phone", "avatar_url"],
      },
    ];
  },
};
