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
import { Uom } from "../../master-data/models/uom.model";
import { UomConversion } from "../../master-data/models/uomConversion.model";
import { warehouseService } from "./warehouse.service";

/**
 * Convert quantity từ line.uom_id sang product.uom_id (đơn vị lưu kho).
 * Priority lookup: product-specific → generic → reverse product-specific → reverse generic → fallback.
 * Nếu line.uom_id = product.uom_id hoặc không có conversion → trả về quantity gốc.
 */
async function convertToStockUom(
  quantity: number,
  lineUomId: number | null | undefined,
  productUomId: number | null | undefined,
  productId: number | null | undefined,
): Promise<number> {
  if (!lineUomId || !productUomId || lineUomId === productUomId) {
    return quantity;
  }

  // Step 1: Forward product-specific
  if (productId) {
    const conversion = await UomConversion.findOne({
      where: {
        product_id: productId,
        from_uom_id: lineUomId,
        to_uom_id: productUomId,
      },
    });
    if (conversion) {
      return quantity * parseFloat(String(conversion.factor));
    }
  }

  // Step 2: Forward generic
  const genericConversion = await UomConversion.findOne({
    where: {
      product_id: null,
      from_uom_id: lineUomId,
      to_uom_id: productUomId,
    },
  });
  if (genericConversion) {
    return quantity * parseFloat(String(genericConversion.factor));
  }

  // Step 3: Reverse product-specific
  if (productId) {
    const reverseProductSpecific = await UomConversion.findOne({
      where: {
        product_id: productId,
        from_uom_id: productUomId,
        to_uom_id: lineUomId,
      },
    });
    if (reverseProductSpecific) {
      return quantity / parseFloat(String(reverseProductSpecific.factor));
    }
  }

  // Step 4: Reverse generic
  const reverseGeneric = await UomConversion.findOne({
    where: {
      product_id: null,
      from_uom_id: productUomId,
      to_uom_id: lineUomId,
    },
  });
  if (reverseGeneric) {
    return quantity / parseFloat(String(reverseGeneric.factor));
  }

  // Step 5: Fallback — no conversion found
  return quantity;
}

import { StockLot } from "../models/stockLot.model";
import { StockLocation } from "../models/stockLocation.model";
import { StockBalance } from "../models/stockBalance.model";
import { PurchaseOrder } from "../../purchase/models/purchaseOrder.model";
import { SaleOrder } from "../../sales/models/saleOrder.model";

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
              attributes: ["id", "name", "sku", "image_url", "uom_id"],
              include: [
                {
                  model: Uom,
                  as: "uom",
                  attributes: ["id", "code", "name"],
                },
              ],
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
        {
          model: StockMoveLine,
          as: "lines",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "sku", "image_url", "uom_id"],
              include: [
                {
                  model: Uom,
                  as: "uom",
                  attributes: ["id", "code", "name"],
                },
              ],
            },
            {
              model: Uom,
              as: "uom",
              attributes: ["id", "code", "name"],
            },
            {
              model: StockLocation,
              as: "locationFrom",
              attributes: ["id", "name", "code", "type"],
            },
            {
              model: StockLocation,
              as: "locationTo",
              attributes: ["id", "name", "code", "type"],
            },
            {
              model: StockLot,
              as: "lot",
              attributes: ["id", "lot_no", "expiry_date", "manufacture_date"],
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
        "You do not have permission to create Stock Move Receipt",
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
        line.product_id,
      );

      const received = await purchaseOrderService.getAlreadyReceivedQty(
        body.reference_id,
        line.product_id,
      );

      // Validate theo stock UOM: dùng qty_in_stock_uom của PO line (đã quy đổi)
      // line.quantity từ stock move cũng phải là stock UOM
      const poQtyInStockUom = parseFloat(
        String(poLine.qty_in_stock_uom ?? poLine.quantity ?? 0),
      );
      await purchaseOrderService.validateRemainingQuantity(
        line.product_id,
        line.quantity,
        poQtyInStockUom,
        received,
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
      body.lines.map(async (line) => {
        // Nếu có new_lot → tạo StockLot trước
        let lotId = line.lot_id ?? null;
        if (line.new_lot?.lot_no) {
          const newLot = await StockLot.create({
            product_id: line.product_id,
            lot_no: line.new_lot.lot_no.trim(),
            expiry_date: line.new_lot.expiry_date ?? null,
            manufacture_date: line.new_lot.manufacture_date ?? null,
            serial_no: line.new_lot.serial_no ?? null,
            supplier_id: line.new_lot.supplier_id ?? null,
            notes: line.new_lot.notes ?? null,
          } as any);
          lotId = Number(newLot.id);
        }
        return StockMoveLine.create({
          move_id: move.id,
          product_id: line.product_id,
          quantity: line.quantity,
          uom_id: line.uom_id ?? null,
          location_from_id: line.location_from_id ?? null,
          location_to_id: line.location_to_id ?? null,
          lot_id: lotId,
        });
      }),
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

    for (const line of body.lines) {
      const balance = await StockBalance.findOne({
        where: {
          warehouse_id: body.warehouse_id,
          product_id: line.product_id,
        },
      });
      const productResult = await productService.getById(line.product_id);

      if (!balance) {
        throw {
          status: 400,
          message: `Product ${productResult?.name} is not available in this warehouse.`,
        };
      }

      const available = Number(balance.quantity);
      const required = Number(line.quantity);

      if (available < required) {
        throw {
          status: 400,
          message: `Not enough quantity for product ${productResult?.name}. Available: ${available}, Required: ${required}`,
        };
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
          uom_id: line.uom_id ?? null,
          location_from_id: line.location_from_id ?? null,
          location_to_id: line.location_to_id ?? null,
        }),
      ),
    );

    return await this.getById(move.id);
  },

  async createAdjustment(body: StockMoveAdjustmentDTO, user: any) {
    const warehouseId = body.warehouse_id;
    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error(
        "You do not have permission to create Stock Move Adjustment.",
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
        warehouseId,
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
          uom_id: line.uom_id ?? null,
          location_from_id: line.location_from_id ?? null,
          location_to_id: line.location_to_id ?? null,
        }),
      ),
    );
    return await this.getById(move.id);
  },

  async createTransfer(body: StockMoveTransferDTO, user: any) {
    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error(
        "You do not have permission to create Stock Move Transfer",
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

    for (const line of body.lines) {
      const balanceFrom = await StockBalance.findOne({
        where: {
          warehouse_id: body.warehouse_from_id,
          product_id: line.product_id,
        },
      });

      const product = await Product.findByPk(line.product_id);

      if (!product) {
        throw {
          status: 400,
          message: `Product ID ${line.product_id} not found.`,
        };
      }

      if (!balanceFrom) {
        throw {
          status: 400,
          message: `Product ${product.name} is not available in warehouse ${warehouseFrom.name}.`,
        };
      }

      const available = Number(balanceFrom.quantity);
      const required = Number(line.quantity);

      if (available < required) {
        throw {
          status: 400,
          message: `Not enough quantity of ${product.name} in warehouse ${warehouseFrom.name}. Available: ${available}, Required: ${required}`,
        };
      }
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
          uom_id: line.uom_id ?? null,
          location_from_id: line.location_from_id ?? null,
          location_to_id: line.location_to_id ?? null,
        }),
      ),
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
        line.product_id,
      );

      const received = await purchaseOrderService.getAlreadyReceivedQty(
        body.reference_id,
        line.product_id,
      );

      // Validate theo stock UOM
      const poQtyInStockUom = parseFloat(
        String(poLine.qty_in_stock_uom ?? poLine.quantity ?? 0),
      );
      await purchaseOrderService.validateRemainingQuantity(
        line.product_id,
        line.quantity,
        poQtyInStockUom,
        received,
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
      (line) => !newLines.some((l) => l.id === line.id),
    );
    await Promise.all(toDelete.map((line) => line.destroy()));

    const toUpdate = existingLines.filter((line) =>
      newLines.some((l) => l.id === line.id),
    );
    await Promise.all(
      toUpdate.map((line) => {
        const newData = newLines.find((l) => l.id === line.id);
        if (!newData) return;
        return line.update({
          product_id: newData.product_id,
          quantity: newData.quantity,
          uom_id: newData.uom_id ?? null,
          location_from_id: newData.location_from_id ?? null,
          location_to_id: newData.location_to_id ?? null,
          lot_id: newData.lot_id ?? null,
        });
      }),
    );

    const toCreate = newLines.filter((l) => !l.id);
    await Promise.all(
      toCreate.map((line) =>
        StockMoveLine.create({
          move_id: record.id,
          product_id: line.product_id,
          quantity: line.quantity,
          uom_id: line.uom_id ?? null,
          location_from_id: line.location_from_id ?? null,
          location_to_id: line.location_to_id ?? null,
        }),
      ),
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
      (line) => !newLines.some((l) => l.id === line.id),
    );
    await Promise.all(toDelete.map((line) => line.destroy()));

    const toUpdate = existingLines.filter((line) =>
      newLines.some((l) => l.id === line.id),
    );
    await Promise.all(
      toUpdate.map((line) => {
        const newData = newLines.find((l) => l.id === line.id);
        if (!newData) return;
        return line.update({
          product_id: newData.product_id,
          quantity: newData.quantity,
          uom_id: newData.uom_id ?? null,
          location_from_id: newData.location_from_id ?? null,
          location_to_id: newData.location_to_id ?? null,
          lot_id: newData.lot_id ?? null,
        });
      }),
    );

    const toCreate = newLines.filter((l) => !l.id);
    await Promise.all(
      toCreate.map((line) =>
        StockMoveLine.create({
          move_id: record.id,
          product_id: line.product_id,
          quantity: line.quantity,
          uom_id: line.uom_id ?? null,
          location_from_id: line.location_from_id ?? null,
          location_to_id: line.location_to_id ?? null,
        }),
      ),
    );
    return await this.getById(id);
  },

  async updateAdjustment(id: number, body: StockMoveAdjustmentDTO, user: any) {
    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error(
        "You do not have permission to edit Stock Move Adjustment.",
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
        warehouseId,
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
      warehouse_from_id: body.warehouse_id,
      reference_type: body.reference_type,
      note: body.note,
    };
    await record.update(updateData);

    const existingLines = await StockMoveLine.findAll({
      where: { move_id: id },
    });
    const newLines = body.lines;

    const toDelete = existingLines.filter(
      (line) => !newLines.some((l) => l.id === line.id),
    );
    await Promise.all(toDelete.map((line) => line.destroy()));

    const toUpdate = existingLines.filter((line) =>
      newLines.some((l) => l.id === line.id),
    );
    await Promise.all(
      toUpdate.map((line) => {
        const newData = newLines.find((l) => l.id === line.id);
        if (!newData) return;
        return line.update({
          product_id: newData.product_id,
          quantity: newData.quantity,
          uom_id: newData.uom_id ?? null,
          location_from_id: newData.location_from_id ?? null,
          location_to_id: newData.location_to_id ?? null,
          lot_id: newData.lot_id ?? null,
        });
      }),
    );

    const toCreate = newLines.filter((l) => !l.id);
    await Promise.all(
      toCreate.map((line) =>
        StockMoveLine.create({
          move_id: record.id,
          product_id: line.product_id,
          quantity: line.quantity,
          uom_id: line.uom_id ?? null,
          location_from_id: line.location_from_id ?? null,
          location_to_id: line.location_to_id ?? null,
        }),
      ),
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
      (line) => !newLines.some((l) => l.id === line.id),
    );
    await Promise.all(toDelete.map((line) => line.destroy()));

    const toUpdate = existingLines.filter((line) =>
      newLines.some((l) => l.id === line.id),
    );
    await Promise.all(
      toUpdate.map((line) => {
        const newData = newLines.find((l) => l.id === line.id);
        if (!newData) return;
        return line.update({
          product_id: newData.product_id,

          quantity: newData.quantity,
          uom_id: newData.uom_id ?? null,
          location_from_id: newData.location_from_id ?? null,
          location_to_id: newData.location_to_id ?? null,
          lot_id: newData.lot_id ?? null,
        });
      }),
    );

    const toCreate = newLines.filter((l) => !l.id);
    await Promise.all(
      toCreate.map((line) =>
        StockMoveLine.create({
          move_id: record.id,
          product_id: line.product_id,
          quantity: line.quantity,
          uom_id: line.uom_id ?? null,
          location_from_id: line.location_from_id ?? null,
          location_to_id: line.location_to_id ?? null,
        }),
      ),
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
          "Invalid transfer: both source and destination warehouses are required.",
        );
      }

      if (
        from.branch_id !== user.branch_id ||
        to.branch_id !== user.branch_id
      ) {
        throw new Error(
          "You cannot delete a transfer involving other branches.",
        );
      }
    } else if (record.type === "receipt") {
      if (!to)
        throw new Error("Invalid receipt: destination warehouse is missing.");

      if (to.branch_id !== user.branch_id) {
        throw new Error(
          "You cannot delete a receipt involving another branch.",
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
          "You cannot delete an adjustment involving another branch.",
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

  async submitForApproval(id: number, user: { id: number; branch_id: number }) {
    // Lấy stock move
    const stockMove = await this.getById(id);
    if (!stockMove) throw new Error("Stock Move not found");

    let warehouseFrom: Warehouse | null = null;
    let warehouseTo: Warehouse | null = null;

    switch (stockMove.type) {
      case "receipt":
        warehouseTo = await Warehouse.findByPk(stockMove.warehouse_to_id!);
        if (!warehouseTo) throw new Error("Destination warehouse not found.");
        if (warehouseTo.branch_id !== user.branch_id)
          throw new Error("You cannot submit stock move for other branches.");
        break;

      case "issue":
      case "adjustment":
        warehouseFrom = await Warehouse.findByPk(stockMove.warehouse_from_id!);
        if (!warehouseFrom) throw new Error("Source warehouse not found.");
        if (warehouseFrom.branch_id !== user.branch_id)
          throw new Error("You cannot submit stock move for other branches.");
        break;

      case "transfer":
        warehouseFrom = await Warehouse.findByPk(stockMove.warehouse_from_id!);
        warehouseTo = await Warehouse.findByPk(stockMove.warehouse_to_id!);
        if (!warehouseFrom || !warehouseTo)
          throw new Error("Source or destination warehouse not found.");
        if (
          warehouseFrom.branch_id !== user.branch_id ||
          warehouseTo.branch_id !== user.branch_id
        )
          throw new Error("You cannot submit stock move for other branches.");
        break;

      default:
        throw new Error("Unknown stock move type");
    }

    // Chỉ cho submit nếu status là draft
    if (stockMove.status !== "draft") {
      throw new Error("Only draft stock moves can be submitted.");
    }

    // Chỉ creator mới submit được
    if (stockMove.created_by !== user.id) {
      throw new Error("Only the creator can submit this stock move.");
    }

    // Cập nhật status
    stockMove.status = "waiting_approval";
    stockMove.submitted_at = new Date();
    await stockMove.save();

    // Return stock move mới nhất
    return this.getById(stockMove.id);
  },

  // ==================================================
  // Warehouse Manager
  // ==================================================

  async updateStockBalance(
    warehouseId: number,
    productId: number,
    quantityChange: number,
    locationId?: number | null,
    lotId?: number | null,
    unitCost?: number | null,
  ) {
    const where: any = { warehouse_id: warehouseId, product_id: productId };
    if (locationId != null) where.location_id = locationId;
    if (lotId != null) where.lot_id = lotId;

    const existing = await StockBalance.findOne({ where });
    const qtyChange = parseFloat(String(quantityChange));
    const incomingCost = unitCost != null ? parseFloat(String(unitCost)) : null;

    if (!existing) {
      // Tạo mới — chỉ có ý nghĩa khi nhập kho (qty > 0)
      const initCost = incomingCost ?? 0;
      return StockBalance.create({
        warehouse_id: warehouseId,
        product_id: productId,
        location_id: locationId ?? null,
        lot_id: lotId ?? null,
        quantity: qtyChange,
        unit_cost: initCost,
        total_value: qtyChange * initCost,
      });
    }

    const oldQty = parseFloat(String(existing.quantity));
    const oldCost = parseFloat(String(existing.unit_cost ?? 0));
    const newQty = oldQty + qtyChange;

    let newCost: number;
    let newValue: number;

    if (qtyChange > 0) {
      // Nhập kho → tính Weighted Average Cost
      if (incomingCost != null && newQty > 0) {
        newCost = (oldQty * oldCost + qtyChange * incomingCost) / newQty;
      } else {
        // Không có unit_cost (transfer, adjustment tăng) → giữ nguyên cost cũ
        newCost = oldCost;
      }
    } else {
      // Xuất kho / giảm → giữ nguyên unit_cost
      newCost = oldCost;
    }

    newValue = newQty * newCost;

    existing.quantity = newQty;
    existing.unit_cost = newCost;
    existing.total_value = newValue;
    return existing.save();
  },

  async approveStockMove(stockMoveId: number, user: any) {
    if (user.role !== Role.WHMANAGER) {
      throw {
        status: 403,
        message: "You do not have permission to approve Stock Move.",
      };
    }
    const move = await this.getById(stockMoveId);
    if (!move) throw new Error("StockMove not found");

    const warehouseFrom = move.warehouse_from_id
      ? await Warehouse.findByPk(move.warehouse_from_id)
      : null;

    const warehouseTo = move.warehouse_to_id
      ? await Warehouse.findByPk(move.warehouse_to_id)
      : null;

    if (move.type === "receipt") {
      if (!warehouseTo) {
        throw { status: 400, message: "Warehouse To not found" };
      }
      if (warehouseTo.branch_id !== user.branch_id) {
        throw {
          status: 403,
          message: "You cannot approve a stock receipt outside your branch.",
        };
      }
    }

    if (["issue", "adjustment"].includes(move.type)) {
      if (!warehouseFrom) {
        throw {
          status: 400,
          message: "Warehouse From not found",
        };
      }
      if (warehouseFrom.branch_id !== user.branch_id) {
        throw {
          status: 403,
          message: "You cannot approve a stock move outside your branch.",
        };
      }
    }
    // 5. Check branch for TRANSFER (both sides must match)
    if (move.type === "transfer") {
      if (!warehouseFrom) {
        throw {
          status: 400,
          message: "Warehouse From not found",
        };
      }
      if (!warehouseTo) {
        throw { status: 400, message: "Warehouse To not found" };
      }

      if (
        warehouseFrom.branch_id !== user.branch_id ||
        warehouseTo.branch_id !== user.branch_id
      ) {
        throw {
          status: 403,
          message:
            "You cannot approve a transfer involving warehouses in other branches.",
        };
      }
    }

    const lines = move.lines ?? [];

    switch (move.type) {
      case "receipt":
        await this.processReceipt(move, lines);
        break;

      case "issue":
        await this.processIssue(move, lines);
        break;

      case "transfer":
        await this.processTransfer(move, lines);
        break;

      case "adjustment":
        await this.processAdjustment(move, lines);
        break;

      default:
        throw new Error("Unknown stock move type");
    }
    await move.update({
      status: "posted",
      approved_by: user.id,
      approved_at: new Date(),
    });

    const updatedMove = await StockMove.findByPk(move.id, {
      include: [
        {
          model: StockMoveLine,
          as: "lines",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "sku", "image_url", "uom_id"],
              include: [
                {
                  model: Uom,
                  as: "uom",
                  attributes: ["id", "code", "name"],
                },
              ],
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
    console.log("UPDATED MOVE WITH INCLUDE", updatedMove?.lines);
    return updatedMove?.get({ plain: true });
  },

  async processReceipt(move: any, lines: any[]) {
    for (const line of lines) {
      const product = await Product.findByPk(line.product_id, {
        attributes: ["uom_id"],
      });
      const actualQty = await convertToStockUom(
        parseFloat(String(line.quantity)),
        line.uom_id,
        product?.uom_id,
        line.product_id,
      );

      // Lấy unit_price từ PO line để tính WAC
      let unitCost: number | null = null;
      if (move.reference_type === "purchase_order" && move.reference_id) {
        const poLine = await PurchaseOrderLine.findOne({
          where: { po_id: move.reference_id, product_id: line.product_id },
        });
        if (poLine?.unit_price != null) {
          unitCost = parseFloat(String(poLine.unit_price));
        }
      }

      await this.updateStockBalance(
        move.warehouse_to_id,
        line.product_id,
        actualQty,
        line.location_to_id ?? null,
        line.lot_id ?? null,
        unitCost,
      );
    }

    // Nếu không phải PO thì thôi
    if (move.reference_type !== "purchase_order" || !move.reference_id) return;

    const po = await PurchaseOrder.findByPk(move.reference_id);
    if (!po) return;

    const poLines = await PurchaseOrderLine.findAll({
      where: { po_id: po.id },
    });

    // Lấy tất cả các product_id của PO
    const productIds = poLines
      .map((line) => line.product_id)
      .filter((id): id is number => id !== undefined);

    // Lấy tất cả StockMoveLine đã post liên quan đến PO
    const allLines = await StockMoveLine.findAll({
      include: [
        {
          model: StockMove,
          as: "move",
          where: {
            reference_type: "purchase_order",
            reference_id: po.id,
            type: "receipt",
            status: "posted",
          },
        },
      ],
      where: {
        product_id: { [Op.in]: productIds },
      },
    });
    let fullyReceived = true;

    for (const poLine of poLines) {
      // So sánh theo stock UOM: dùng qty_in_stock_uom nếu có, fallback về quantity
      const poQty = parseFloat(
        String(poLine.qty_in_stock_uom ?? poLine.quantity ?? 0),
      );

      const previousReceived = allLines
        .filter(
          (line) =>
            line.product_id === poLine.product_id && line.move_id !== move.id,
        )
        .reduce((sum, line) => sum + parseFloat(String(line.quantity ?? 0)), 0);
      const currentReceived = lines
        .filter((line) => line.product_id === poLine.product_id)
        .reduce((sum, line) => sum + parseFloat(String(line.quantity ?? 0)), 0);

      const totalReceived = previousReceived + currentReceived;

      console.log(
        `Product ${poLine.product_id}: PO Qty(stock)=${poQty}, Previous Received=${previousReceived}, Current Received=${currentReceived}, Total=${totalReceived}`,
      );
      if (totalReceived < poQty || totalReceived > poQty) {
        fullyReceived = false;
        break;
      }
    }
    await po.update({
      status: fullyReceived ? "completed" : "partially_received",
    });
  },

  // ==================================================
  // TYPE: issue
  // ==================================================
  async processIssue(move: any, lines: any[]) {
    for (const line of lines) {
      const product = await Product.findByPk(line.product_id, {
        attributes: ["uom_id"],
      });
      const actualQty = await convertToStockUom(
        parseFloat(String(line.quantity)),
        line.uom_id,
        product?.uom_id,
        line.product_id,
      );
      await this.updateStockBalance(
        move.warehouse_from_id,
        line.product_id,
        -actualQty,
        line.location_from_id ?? null,
        line.lot_id ?? null,
      );
    }
    if (move.reference_type === "sale_order") {
      await SaleOrder.update(
        { status: "shipped", delivery_status: "delivered" },
        { where: { id: move.reference_id } },
      );
    }
  },

  // ==================================================
  // TYPE: transfer
  // ==================================================
  async processTransfer(move: any, lines: any[]) {
    for (const line of lines) {
      const product = await Product.findByPk(line.product_id, {
        attributes: ["uom_id"],
      });
      const actualQty = await convertToStockUom(
        parseFloat(String(line.quantity)),
        line.uom_id,
        product?.uom_id,
        line.product_id,
      );
      await this.updateStockBalance(
        move.warehouse_from_id,
        line.product_id,
        -actualQty,
        line.location_from_id ?? null,
        line.lot_id ?? null,
      );
      await this.updateStockBalance(
        move.warehouse_to_id,
        line.product_id,
        +actualQty,
        line.location_to_id ?? null,
        line.lot_id ?? null,
      );
    }
  },

  async processAdjustment(move: any, lines: any[]) {
    for (const line of lines) {
      const product = await Product.findByPk(line.product_id, {
        attributes: ["uom_id"],
      });
      const rawQty = Number(line.quantity);
      const sign = rawQty >= 0 ? 1 : -1;
      const actualQty =
        sign *
        (await convertToStockUom(
          Math.abs(rawQty),
          line.uom_id,
          product?.uom_id,
          line.product_id,
        ));
      await this.updateStockBalance(
        move.warehouse_from_id,
        line.product_id,
        actualQty,
        line.location_from_id ?? null,
        line.lot_id ?? null,
      );
    }
  },

  async rejectStockMove(stockMoveId: number, user: any, rejectReason: string) {
    if (user.role !== Role.WHMANAGER) {
      throw {
        status: 403,
        message: "You do not have permission to approve Stock Move.",
      };
    }
    const move = await this.getById(stockMoveId);
    if (!move) throw new Error("StockMove not found");

    const warehouseFrom = move.warehouse_from_id
      ? await Warehouse.findByPk(move.warehouse_from_id)
      : null;

    const warehouseTo = move.warehouse_to_id
      ? await Warehouse.findByPk(move.warehouse_to_id)
      : null;

    if (move.type === "receipt") {
      if (!warehouseTo) {
        throw { status: 400, message: "Warehouse To not found" };
      }
      if (warehouseTo.branch_id !== user.branch_id) {
        throw {
          status: 403,
          message: "You cannot approve a stock receipt outside your branch.",
        };
      }
    }

    if (["issue", "adjustment"].includes(move.type)) {
      if (!warehouseFrom) {
        throw {
          status: 400,
          message: "Warehouse From not found",
        };
      }
      if (warehouseFrom.branch_id !== user.branch_id) {
        throw {
          status: 403,
          message: "You cannot approve a stock move outside your branch.",
        };
      }
    }
    // 5. Check branch for TRANSFER (both sides must match)
    if (move.type === "transfer") {
      if (!warehouseFrom) {
        throw {
          status: 400,
          message: "Warehouse From not found",
        };
      }
      if (!warehouseTo) {
        throw { status: 400, message: "Warehouse To not found" };
      }

      if (
        warehouseFrom.branch_id !== user.branch_id ||
        warehouseTo.branch_id !== user.branch_id
      ) {
        throw {
          status: 403,
          message:
            "You cannot approve a transfer involving warehouses in other branches.",
        };
      }
    }

    await move.update({
      status: "cancelled",
      approved_by: user.id,
      approved_at: new Date(),
      reject_reason: rejectReason,
    });
    return this.getById(move.id);
  },
};
