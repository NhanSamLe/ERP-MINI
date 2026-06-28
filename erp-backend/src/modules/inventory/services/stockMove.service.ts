import {
  StockMoveAdjustmentDTO,
  StockMoveCreateDTO,
  StockMoveTransferDTO,
  StockMoveUpdateDTO,
} from "../dto/stockMoveCreate.dto";
import { StockMove } from "../models/stockMove.model";
import { StockMoveLine } from "../models/stockMoveLine.model";
import { Warehouse } from "../models/warehouse.model";
import { StockReservation } from "../models/stockReservation.model";
import { stockBalanceService } from "./stockBalance.service";
import { stockReservationService } from "./stockReservation.service";
import { productService } from "../../product/services/product.service";
import { purchaseOrderService } from "../../purchase/services/purchaseOrder.service";
import { PurchaseOrderLine } from "../../purchase/models/purchaseOrderLine.model";
import { JwtPayload } from "../../../core/types/jwt";
import { Role } from "../../../core/types/enum";
import { User } from "../../auth/models/user.model";
import { Op, Transaction } from "sequelize";
import { Product } from "../../product/models/product.model";
import { Uom } from "../../master-data/models/uom.model";
import { UomConversion } from "../../master-data/models/uomConversion.model";
import { warehouseService } from "./warehouse.service";
import { sequelize } from "../../../config/db";
import { checkPeriodLocked } from "../../finance/services/glJournal.service";
import { getCompanyBranchIds } from "../../finance/services/companyScope.service";

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
  transaction?: Transaction,
): Promise<number> {
  if (!lineUomId || !productUomId || lineUomId === productUomId) {
    return quantity;
  }
  const factor = await UomConversion.findOne({
    where: {
      product_id: productId,
      from_uom_id: lineUomId,
      to_uom_id: productUomId,
    },
    transaction: transaction ?? null,
  });
  if (factor) {
    return quantity * parseFloat(String(factor.factor));
  }
  const generic = await UomConversion.findOne({
    where: {
      product_id: null,
      from_uom_id: lineUomId,
      to_uom_id: productUomId,
    },
    transaction: transaction ?? null,
  });
  if (generic) {
    return quantity * parseFloat(String(generic.factor));
  }
  const reverseFactor = await UomConversion.findOne({
    where: {
      product_id: productId,
      from_uom_id: productUomId,
      to_uom_id: lineUomId,
    },
    transaction: transaction ?? null,
  });
  if (reverseFactor) {
    return quantity / parseFloat(String(reverseFactor.factor));
  }
  const reverseGeneric = await UomConversion.findOne({
    where: {
      product_id: null,
      from_uom_id: productUomId,
      to_uom_id: lineUomId,
    },
    transaction: transaction ?? null,
  });
  if (reverseGeneric) {
    return quantity / parseFloat(String(reverseGeneric.factor));
  }

  throw new Error(
    `Missing UOM conversion for product ${productId ?? "unknown"}: ${lineUomId} -> ${productUomId}`,
  );
}

async function convertUnitPriceToStockUom(
  unitPrice: number,
  lineUomId: number | null | undefined,
  productUomId: number | null | undefined,
  productId: number | null | undefined,
  transaction?: Transaction,
): Promise<number> {
  if (!lineUomId || !productUomId || lineUomId === productUomId) return unitPrice;
  const stockQtyPerLineUom = await convertToStockUom(1, lineUomId, productUomId, productId, transaction);
  if (stockQtyPerLineUom <= 0) {
    throw new Error(`Invalid UOM conversion factor for product ${productId ?? "unknown"}`);
  }
  return unitPrice / stockQtyPerLineUom;
}

import { StockLot } from "../models/stockLot.model";
import { StockLocation } from "../models/stockLocation.model";
import { StockBalance } from "../models/stockBalance.model";
import { StockInTransit } from "../models/stockInTransit.model";
import { PurchaseOrder } from "../../purchase/models/purchaseOrder.model";
import { SaleOrder } from "../../sales/models/saleOrder.model";
import { SaleOrderLine } from "../../sales/models/saleOrderLine.model";

export const stockMoveService = {
  async getAll(user: any) {
    const companyBranchIds = await getCompanyBranchIds(user);
    const branchFilter = (user.role === "ADMIN")
      ? { [Op.in]: companyBranchIds }
      : user.branch_id;

    const warehouses = await Warehouse.findAll({
      where: { branch_id: branchFilter },
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

  async getAlreadyShippedQty(
    saleOrderId: number,
    productId: number,
    excludeMoveId?: number,
  ): Promise<number> {
    const whereMove: any = {
      reference_id: saleOrderId,
      reference_type: "sale_order",
      type: "issue",
      status: "posted",
    };
    if (excludeMoveId) {
      whereMove.id = { [Op.ne]: excludeMoveId };
    }
    const postedMoves = await StockMove.findAll({
      where: whereMove,
      attributes: ["id"],
      raw: true,
    });

    if (postedMoves.length === 0) return 0;

    const moveIds = postedMoves.map((m) => m.id);

    const lines = await StockMoveLine.findAll({
      where: {
        move_id: moveIds,
        product_id: productId,
      },
      attributes: ["quantity", "uom_id"],
      raw: true,
    });

    // Quy đổi mỗi dòng đã xuất về đơn vị lưu kho (stock UOM) trước khi cộng,
    // để số đã-xuất luôn cùng đơn vị với số đặt hàng và tồn kho khi so sánh.
    const product = await Product.findByPk(productId, { attributes: ["id", "uom_id"], raw: true });
    const stockUomId = product?.uom_id ?? null;
    let total = 0;
    for (const l of lines) {
      total += await convertToStockUom(Number(l.quantity), l.uom_id, stockUomId, productId);
    }
    return total;
  },

  async validateProductInSO(
    soLines: SaleOrderLine[],
    productId: number,
  ) {
    const soLine = soLines.find((l) => Number(l.product_id) === Number(productId));
    if (!soLine) {
      const productResult = await productService.getById(productId);
      throw {
        status: 400,
        message: `Sản phẩm ${productResult?.name} không có trong Đơn bán hàng.`,
      };
    }
    return soLine;
  },

  async validateSoRemainingQuantity(
    productId: number,
    inputQty: number,
    soQty: number,
    shippedQty: number,
  ) {
    const remaining = soQty - shippedQty;

    if (inputQty > remaining) {
      const productResult = await productService.getById(productId);
      throw {
        status: 400,
        message: `Sản phẩm ${productResult?.name} vượt quá số lượng còn lại trong Đơn bán hàng. Còn lại: ${remaining}, đã nhập: ${inputQty}`,
      };
    }
  },

  async getAlreadyReceivedQtyForReturn(
    returnId: number,
    productId: number,
  ): Promise<number> {
    const postedMoves = await StockMove.findAll({
      where: {
        reference_id: returnId,
        reference_type: "purchase_return",
        type: "receipt",
        status: "posted",
      },
      attributes: ["id"],
      raw: true,
    });

    if (postedMoves.length === 0) return 0;

    const moveIds = postedMoves.map((m) => m.id);

    const lines = await StockMoveLine.findAll({
      where: {
        move_id: moveIds,
        product_id: productId,
      },
      attributes: ["quantity"],
      raw: true,
    });

    return lines.reduce((sum, l) => sum + Number(l.quantity), 0);
  },

  async createReceipt(body: StockMoveCreateDTO, user: any) {
    if (!body.reference_id) {
      throw new Error("Reference ID is required to create a receipt.");
    }
    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error("You do not have permission to create Stock Move Receipt");
    }

    const warehouse = await warehouseService.getById(body.warehouse_id);

    if (!warehouse) {
      throw new Error("Warehouse not found.");
    }

    if (warehouse.branch_id !== user.branch_id) {
      throw new Error("You cannot create a receipt for another branch.");
    }

    const t = await sequelize.transaction();
    try {
      if (body.reference_type === "purchase_return") {
        const { PurchaseReturn } = await import("../../purchase/models/purchaseReturn.model");
        const { PurchaseReturnLine } = await import("../../purchase/models/purchaseReturnLine.model");

        const pr = await PurchaseReturn.findByPk(body.reference_id, { transaction: t });
        if (!pr) {
          throw new Error("Không tìm thấy Phiếu trả hàng.");
        }
        if (pr.return_type !== "replacement") {
          throw new Error("Chỉ hỗ trợ nhập kho đối với phiếu trả hàng loại Đổi trả hàng (replacement).");
        }
        if (!["confirmed", "completed"].includes(pr.status)) {
          throw new Error("Phiếu trả hàng phải ở trạng thái Đã xác nhận hoặc Đã hoàn thành mới được nhập kho.");
        }

        const prLines = await PurchaseReturnLine.findAll({
          where: { return_id: body.reference_id },
          transaction: t
        });
        const prMap = new Map<number, any>();
        prLines.forEach((l) => {
          if (l.product_id != null) {
            prMap.set(l.product_id, l);
          }
        });

        for (const line of body.lines) {
          const prLine = prMap.get(line.product_id);
          if (!prLine) {
            const productResult = await productService.getById(line.product_id);
            throw {
              status: 400,
              message: `Sản phẩm ${productResult?.name} không nằm trong Phiếu trả hàng.`,
            };
          }

          const received = await this.getAlreadyReceivedQtyForReturn(
            body.reference_id,
            line.product_id,
          );

          const prQtyInStockUom = parseFloat(
            String(prLine.quantity_confirmed_stock_uom ?? prLine.qty_in_stock_uom ?? 0)
          );

          const remaining = prQtyInStockUom - received;
          if (line.quantity > remaining) {
            const productResult = await productService.getById(line.product_id);
            throw {
              status: 400,
              message: `Sản phẩm ${productResult?.name} vượt quá số lượng còn lại trong Phiếu trả hàng. Còn lại: ${remaining}, nhập: ${line.quantity}`,
            };
          }
        }
      } else {
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
      }

      const data: any = {
        move_no: body.move_no,
        move_date: new Date(body.move_date),
        type: body.type,
        warehouse_to_id: body.warehouse_id,
        reference_type: body.reference_type,
        note: body.note,
        created_by: user.id,
        branch_id: user.branch_id,
      };

      if (body.reference_id !== undefined) {
        data.reference_id = body.reference_id;
      }

      const move = await StockMove.create(data, { transaction: t });
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
            } as any, { transaction: t });
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
          }, { transaction: t });
        }),
      );

      await t.commit();
      return await this.getById(move.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
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

    const t = await sequelize.transaction();
    try {
      const soLines = await SaleOrderLine.findAll({
        where: { order_id: body.reference_id },
        transaction: t,
      });

      for (const line of body.lines) {
        const soLine = await this.validateProductInSO(
          soLines,
          line.product_id,
        );

        const shipped = await this.getAlreadyShippedQty(
          body.reference_id,
          line.product_id,
        );

        const productResult = await productService.getById(line.product_id);
        const stockUomId = (productResult as any)?.uom_id ?? null;

        // Quy đổi tất cả về đơn vị lưu kho (stock UOM) trước khi so sánh:
        // số đặt hàng (theo SO line UOM), số nhập (theo move line UOM), số đã xuất
        // (đã quy đổi trong getAlreadyShippedQty) và tồn kho đều cùng đơn vị.
        const orderedQty = await convertToStockUom(
          parseFloat(String(soLine.quantity ?? 0)),
          (soLine as any).uom_id,
          stockUomId,
          line.product_id,
          t,
        );
        const requiredInStockUom = await convertToStockUom(
          Number(line.quantity),
          line.uom_id,
          stockUomId,
          line.product_id,
          t,
        );
        await this.validateSoRemainingQuantity(
          line.product_id,
          requiredInStockUom,
          orderedQty,
          shipped,
        );

        const balance = await StockBalance.findOne({
          where: {
            warehouse_id: body.warehouse_id,
            product_id: line.product_id,
          },
          transaction: t,
        });

        if (!balance) {
          throw {
            status: 400,
            message: `Product ${productResult?.name} is not available in this warehouse.`,
          };
        }

        // Lấy số lượng đã reserve cho chính SO này (nếu có) để cộng ngược lại vào lượng khả dụng
        const myReservation = await StockReservation.findOne({
          where: {
            product_id: line.product_id,
            warehouse_id: body.warehouse_id,
            reference_type: "sale_order",
            reference_id: body.reference_id,
            status: "active",
          },
          transaction: t,
        });
        const myReservedQty = myReservation ? Number(myReservation.qty) : 0;

        const available = Number(balance.quantity) - Number(balance.reserved_qty ?? 0) + myReservedQty;
        const required = Number(line.quantity);

        if (available < requiredInStockUom) {
          throw {
            status: 400,
            message: `Không đủ tồn kho khả dụng cho sản phẩm ${productResult?.name}. Khả dụng: ${available}, Yêu cầu: ${required} (Đã giữ chỗ cho đơn khác: ${Number(balance.reserved_qty ?? 0) - myReservedQty})`,
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
        branch_id: user.branch_id,
      };
      if (body.reference_id !== undefined) {
        data.reference_id = body.reference_id;
      }
      const move = await StockMove.create(data, { transaction: t });
      await Promise.all(
        body.lines.map((line) =>
          StockMoveLine.create({
            move_id: move.id,
            product_id: line.product_id,
            quantity: line.quantity,
            uom_id: line.uom_id ?? null,
            location_from_id: line.location_from_id ?? null,
            location_to_id: line.location_to_id ?? null,
            lot_id: line.lot_id ?? null,
          }, { transaction: t }),
        ),
      );

      await t.commit();
      return await this.getById(move.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async createPurchaseReturnIssue(purchaseReturnId: number, user: any) {
    const allowedRoles = [Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error("You do not have permission to create Stock Move Issue");
    }

    const { PurchaseReturn } = await import("../../purchase/models/purchaseReturn.model");
    const { PurchaseReturnLine } = await import("../../purchase/models/purchaseReturnLine.model");

    const ret = await PurchaseReturn.findByPk(purchaseReturnId, {
      include: [{ model: PurchaseReturnLine, as: "lines" }],
    });
    if (!ret) throw { status: 404, message: "Purchase Return not found" };
    if (ret.status !== "shipped")
      throw { status: 400, message: "Only shipped returns can have a stock issue created" };
    if (ret.stock_move_id)
      throw { status: 400, message: "Stock move already exists for this return" };
    if (!ret.warehouse_id)
      throw { status: 400, message: "Return has no warehouse assigned" };

    const warehouse = await Warehouse.findByPk(ret.warehouse_id);
    if (!warehouse) throw new Error("Warehouse not found.");
    if (warehouse.branch_id !== user.branch_id) {
      throw new Error("You cannot create an issue for another branch.");
    }

    const t = await sequelize.transaction();
    try {
      const moveNo = `SM-RET-${Date.now()}`;
      const move = await StockMove.create({
        move_no: moveNo,
        move_date: new Date(),
        type: "issue",
        warehouse_from_id: ret.warehouse_id,
        reference_type: "purchase_return",
        reference_id: ret.id,
        status: "draft",
        created_by: user.id,
        branch_id: ret.branch_id,
      }, { transaction: t });

      const defaultLoc = await StockLocation.findOne({
        where: { warehouse_id: ret.warehouse_id, type: "internal" },
        transaction: t,
      });
      const defaultLocId = defaultLoc?.id ?? null;

      const lines = (ret as any).lines as any[];
      for (const line of lines) {
        let lotId: number | null = null;
        if (ret.purchase_order_id) {
          const originalReceiptLine = await StockMoveLine.findOne({
            include: [
              {
                model: StockMove,
                as: "move",
                where: {
                  reference_type: "purchase_order",
                  reference_id: ret.purchase_order_id,
                  type: "receipt",
                  status: "posted",
                },
              },
            ],
            where: {
              product_id: line.product_id,
            },
            order: [["id", "DESC"]],
            transaction: t,
          });
          if (originalReceiptLine?.lot_id) {
            lotId = originalReceiptLine.lot_id;
          }
        }

        await StockMoveLine.create({
          move_id: move.id,
          product_id: line.product_id,
          quantity: Number(line.qty_in_stock_uom),
          uom_id: null,
          location_from_id: defaultLocId,
          location_to_id: null,
          lot_id: lotId,
        }, { transaction: t });
      }

      await ret.update({ stock_move_id: move.id }, { transaction: t });

      await t.commit();
      return await this.getById(move.id);
    } catch (err) {
      await t.rollback();
      throw err;
    }
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

    const t = await sequelize.transaction();
    try {
      for (const line of body.lines) {
        const { product_id, quantity } = line;

        const product = await Product.findByPk(product_id, { transaction: t });
        if (!product) {
          throw new Error(`Product ID ${product_id} not found.`);
        }

        if (quantity <= 0) {
          const stockBalance = await StockBalance.findOne({
            where: { product_id, warehouse_id: warehouseId },
            lock: t.LOCK.UPDATE,
            transaction: t,
          });

          if (!stockBalance) {
            throw new Error(`Sản phẩm ${product.name} chưa tồn tại trong kho, không thể điều chỉnh giảm.`);
          }

          const absQty = Math.abs(quantity);
          const requiredInStockUom = await convertToStockUom(
            parseFloat(String(absQty)),
            line.uom_id,
            product.uom_id,
            product.id,
            t,
          );

          if (stockBalance.quantity < requiredInStockUom) {
            throw new Error(`Không đủ tồn kho để giảm. Hiện tại: ${stockBalance.quantity}, yêu cầu giảm (Stock UOM): ${requiredInStockUom}`);
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
        branch_id: user.branch_id,
      };
      
      const move = await StockMove.create(data, { transaction: t });
      await Promise.all(
        body.lines.map((line) =>
          StockMoveLine.create({
            move_id: move.id,
            product_id: line.product_id,
            quantity: line.quantity,
            uom_id: line.uom_id ?? null,
            location_from_id: line.location_from_id ?? null,
            location_to_id: line.location_to_id ?? null,
          }, { transaction: t }),
        ),
      );
      
      await t.commit();
      return await this.getById(move.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
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

    const t = await sequelize.transaction();
    try {
      for (const line of body.lines) {
        const balanceFrom = await StockBalance.findOne({
          where: {
            warehouse_id: body.warehouse_from_id,
            product_id: line.product_id,
          },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });

        const product = await Product.findByPk(line.product_id, { transaction: t });

        if (!product) {
          throw new Error(`Product ID ${line.product_id} not found.`);
        }

        if (!balanceFrom) {
          throw new Error(`Product ${product.name} is not available in warehouse ${warehouseFrom.name}.`);
        }

        const available = Number(balanceFrom.quantity);
        const requiredInStockUom = await convertToStockUom(
          parseFloat(String(line.quantity)),
          line.uom_id,
          product.uom_id,
          product.id,
          t,
        );

        if (available < requiredInStockUom) {
          throw new Error(`Not enough quantity of ${product.name} in warehouse ${warehouseFrom.name}. Available: ${available}, Required (Stock UOM): ${requiredInStockUom}`);
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
        branch_id: user.branch_id,
      };
      
      const move = await StockMove.create(data, { transaction: t });
      await Promise.all(
        body.lines.map((line) =>
          StockMoveLine.create({
            move_id: move.id,
            product_id: line.product_id,
            quantity: line.quantity,
            uom_id: line.uom_id ?? null,
            location_from_id: line.location_from_id ?? null,
            location_to_id: line.location_to_id ?? null,
            lot_id: line.lot_id ?? null,
          }, { transaction: t }),
        ),
      );
      
      await t.commit();
      return await this.getById(move.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
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

    if (body.reference_type === "sales_return") {
      const { SalesReturnLine } = await import("../../sales/models/salesReturnLine.model");
      const srLines = await SalesReturnLine.findAll({
        where: { return_id: body.reference_id },
      });
      for (const line of body.lines) {
        const srLine = srLines.find((l) => Number(l.product_id) === Number(line.product_id));
        if (!srLine) {
          const productResult = await productService.getById(line.product_id);
          throw {
            status: 400,
            message: `Sản phẩm ${productResult?.name} không có trong phiếu trả hàng bán.`,
          };
        }
        const maxQty = parseFloat(String(srLine.quantity_returned ?? 0));
        if (parseFloat(String(line.quantity)) > maxQty) {
          const productResult = await productService.getById(line.product_id);
          throw {
            status: 400,
            message: `Sản phẩm ${productResult?.name} vượt quá số lượng nhận lại. Tối đa: ${maxQty}, Yêu cầu: ${line.quantity}`,
          };
        }
      }
    } else {
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

    const t = await sequelize.transaction();
    try {
      if (body.reference_type === "purchase_return") {
        const { PurchaseReturnLine } = await import("../../purchase/models/purchaseReturnLine.model");
        const prLines = await PurchaseReturnLine.findAll({
          where: { return_id: body.reference_id },
          transaction: t,
        });

        for (const line of body.lines) {
          const prLine = prLines.find((l) => Number(l.product_id) === Number(line.product_id));
          if (!prLine) {
            const productResult = await productService.getById(line.product_id);
            throw {
              status: 400,
              message: `Sản phẩm ${productResult?.name} không có trong phiếu xuất trả hàng.`,
            };
          }

          const maxQty = parseFloat(String(prLine.qty_in_stock_uom ?? 0));
          if (parseFloat(String(line.quantity)) > maxQty) {
            const productResult = await productService.getById(line.product_id);
            throw {
              status: 400,
              message: `Sản phẩm ${productResult?.name} vượt quá số lượng cần xuất trả. Tối đa: ${maxQty}, Yêu cầu: ${line.quantity}`,
            };
          }

          const balance = await StockBalance.findOne({
            where: {
              warehouse_id: body.warehouse_id,
              product_id: line.product_id,
            },
            transaction: t,
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
      } else {
        const soLines = await SaleOrderLine.findAll({
          where: { order_id: body.reference_id },
          transaction: t,
        });

        for (const line of body.lines) {
          const soLine = await this.validateProductInSO(
            soLines,
            line.product_id,
          );

          const shipped = await this.getAlreadyShippedQty(
            body.reference_id,
            line.product_id,
            id,
          );

          const productResult = await productService.getById(line.product_id);
          const stockUomId = (productResult as any)?.uom_id ?? null;

          // Quy đổi về đơn vị lưu kho (stock UOM) trước khi so sánh — xem createIssue.
          const orderedQty = await convertToStockUom(
            parseFloat(String(soLine.quantity ?? 0)),
            (soLine as any).uom_id,
            stockUomId,
            line.product_id,
            t,
          );
          const requiredInStockUom = await convertToStockUom(
            Number(line.quantity),
            line.uom_id,
            stockUomId,
            line.product_id,
            t,
          );
          await this.validateSoRemainingQuantity(
            line.product_id,
            requiredInStockUom,
            orderedQty,
            shipped,
          );

          const balance = await StockBalance.findOne({
            where: {
              warehouse_id: body.warehouse_id,
              product_id: line.product_id,
            },
            transaction: t,
          });

          if (!balance) {
            throw {
              status: 400,
              message: `Product ${productResult?.name} is not available in this warehouse.`,
            };
          }

          const available = Number(balance.quantity);

          if (available < requiredInStockUom) {
            throw {
              status: 400,
              message: `Not enough quantity for product ${productResult?.name}. Available: ${available}, Required: ${requiredInStockUom}`,
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

      if (body.reference_id !== undefined) {
        updateData.reference_id = body.reference_id;
      }

      await record.update(updateData, { transaction: t });

      const existingLines = await StockMoveLine.findAll({
        where: { move_id: id },
        transaction: t,
      });
      const newLines = body.lines;

      const toDelete = existingLines.filter(
        (line) => !newLines.some((l) => l.id === line.id),
      );
      await Promise.all(toDelete.map((line) => line.destroy({ transaction: t })));

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
          }, { transaction: t });
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
            lot_id: line.lot_id ?? null,
          }, { transaction: t }),
        ),
      );

      await t.commit();
      return await this.getById(id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
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
          lot_id: line.lot_id ?? null,
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
    const warehouses = await Warehouse.findAll({
      where: { branch_id: user.branch_id },
      attributes: ["id"],
      raw: true,
    });
    const warehouseIds = warehouses.map((w: any) => w.id);

    const where: any = {
      type,
      branch_id: user.branch_id,
    };
    if (warehouseIds.length > 0) {
      where[Op.or] = [
        { warehouse_from_id: { [Op.in]: warehouseIds } },
        { warehouse_to_id: { [Op.in]: warehouseIds } },
        { warehouse_from_id: null },
      ];
    }

    if (user.role === Role.WHSTAFF) {
      where.created_by = user.id;
    }

    return await StockMove.findAll({ where, include: this.buildIncludes() });
  },

  async search(keyword: string, user: JwtPayload) {
    const q = keyword.trim();
    if (!q) return this.getAll(user);

    const warehouses = await Warehouse.findAll({
      where: { branch_id: user.branch_id },
      attributes: ["id"],
      raw: true,
    });
    const warehouseIds = warehouses.map((w: any) => w.id);

    const where: any = {
      [Op.and]: [
        {
          [Op.or]: [
            { warehouse_from_id: { [Op.in]: warehouseIds } },
            { warehouse_to_id: { [Op.in]: warehouseIds } },
          ],
        },
        {
          [Op.or]: [
            { move_no: { [Op.like]: `%${q}%` } },
            { type: { [Op.like]: `%${q}%` } },
            { status: { [Op.like]: `%${q}%` } },
            { reference_type: { [Op.like]: `%${q}%` } },
          ],
        },
      ],
    };

    if (user.role === Role.WHSTAFF) {
      where.created_by = user.id;
    }

    return StockMove.findAll({ where, include: this.buildIncludes() });
  },

  async findByStatus(status: string, user: JwtPayload) {
    const warehouses = await Warehouse.findAll({
      where: { branch_id: user.branch_id },
      attributes: ["id"],
      raw: true,
    });
    const warehouseIds = warehouses.map((w: any) => w.id);

    const where: any = {
      status,
      branch_id: user.branch_id,
    };
    if (warehouseIds.length > 0) {
      where[Op.or] = [
        { warehouse_from_id: { [Op.in]: warehouseIds } },
        { warehouse_to_id: { [Op.in]: warehouseIds } },
        { warehouse_from_id: null },
      ];
    }

    if (user.role === Role.WHSTAFF) {
      where.created_by = user.id;
    }

    return await StockMove.findAll({ where, include: this.buildIncludes() });
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

    // Chỉ creator mới submit được (ngoại trừ phiếu tự động liên kết chứng từ)
    if (stockMove.created_by !== user.id && !stockMove.reference_type) {
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
    transaction?: any
  ) {
    const where: any = { warehouse_id: warehouseId, product_id: productId };
    if (locationId != null) where.location_id = locationId;
    if (lotId != null) where.lot_id = lotId;

    const existing = await StockBalance.findOne({ 
      where,
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
      transaction 
    });
    const qtyChange = parseFloat(String(quantityChange));
    const incomingCost = unitCost != null ? parseFloat(String(unitCost)) : null;

    if (!existing) {
      if (qtyChange < 0) {
        throw new Error(`Insufficient stock for product ID ${productId} in warehouse ID ${warehouseId}. Current: 0, Requested deduction: ${Math.abs(qtyChange)}`);
      }
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
      }, { transaction });
    }

    const oldQty = parseFloat(String(existing.quantity));
    const oldCost = parseFloat(String(existing.unit_cost ?? 0));
    const newQty = oldQty + qtyChange;

    if (newQty < 0) {
      throw new Error(`Insufficient stock for product ID ${productId} in warehouse ID ${warehouseId}. Current: ${oldQty}, Requested deduction: ${Math.abs(qtyChange)}`);
    }

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

    // Chặn NaN / Infinity
    if (!isFinite(newCost)) newCost = 0;

    newValue = newQty * newCost;

    existing.quantity = newQty;
    existing.unit_cost = newCost;
    existing.total_value = newValue;
    return existing.save({ transaction });
  },

  async approveStockMove(stockMoveId: number, user: any) {
    if (user.role !== Role.WHMANAGER) {
      throw new Error("You do not have permission to approve Stock Move.");
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
        throw new Error("Warehouse To not found");
      }
      if (warehouseTo.branch_id !== user.branch_id) {
        throw new Error("You cannot approve a stock receipt outside your branch.");
      }
    }

    if (["issue", "adjustment"].includes(move.type)) {
      if (!warehouseFrom) {
        throw new Error("Warehouse From not found");
      }
      if (warehouseFrom.branch_id !== user.branch_id) {
        throw new Error("You cannot approve a stock move outside your branch.");
      }
    }
    // 5. Check branch for TRANSFER (both sides must match)
    if (move.type === "transfer") {
      if (!warehouseFrom) {
        throw new Error("Warehouse From not found");
      }
      if (!warehouseTo) {
        throw new Error("Warehouse To not found");
      }

      if (
        warehouseFrom.branch_id !== user.branch_id ||
        warehouseTo.branch_id !== user.branch_id
      ) {
        throw new Error(
          "You cannot approve a transfer involving warehouses in other branches.",
        );
      }
    }

    const lines = move.lines ?? [];

    const t = await sequelize.transaction();
    try {
      await checkPeriodLocked(move.move_date || new Date(), t);

      switch (move.type) {
        case "receipt":
          await this.processReceipt(move, lines, t);
          await move.update(
            { status: "posted", approved_by: user.id, approved_at: new Date() },
            { transaction: t },
          );
          break;

        case "issue":
          await this.processIssue(move, lines, t);
          await move.update(
            { status: "posted", approved_by: user.id, approved_at: new Date() },
            { transaction: t },
          );
          break;

        case "transfer":
          // ── Phase 1: xuất kho nguồn → trạng thái in_transit ──────────────
          // Kho đích nhận hàng qua endpoint POST /:id/receive riêng
          await this.processTransferPhase1(move, lines, t);
          await move.update(
            { status: "in_transit", approved_by: user.id, approved_at: new Date() },
            { transaction: t },
          );
          break;

        case "adjustment":
          await this.processAdjustment(move, lines, t);
          await move.update(
            { status: "posted", approved_by: user.id, approved_at: new Date() },
            { transaction: t },
          );
          break;

        default:
          throw new Error("Unknown stock move type");
      }

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }

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
    return updatedMove?.get({ plain: true });
  },

  async processReceipt(move: any, lines: any[], t: any) {
    for (const line of lines) {
      const product = await Product.findByPk(line.product_id, {
        attributes: ["uom_id"],
        transaction: t
      });
      const actualQty = await convertToStockUom(
        parseFloat(String(line.quantity)),
        line.uom_id,
        product?.uom_id,
        line.product_id,
        t,
      );

      // Lấy unit_price từ PO line để tính WAC
      let unitCost: number | null = null;
      if (move.reference_type === "purchase_order" && move.reference_id) {
        const poLine = await PurchaseOrderLine.findOne({
          where: { po_id: move.reference_id, product_id: line.product_id },
          transaction: t
        });
        if (poLine) {
          const qtyInStockUom = Number(poLine.qty_in_stock_uom || 0);
          const qtyInPurchaseUom = Number(poLine.quantity || 0);
          const lineTotal = Number(poLine.line_total || 0);
          if (qtyInStockUom > 0 && lineTotal > 0) {
            unitCost = lineTotal / qtyInStockUom;
          } else if (qtyInStockUom > 0 && qtyInPurchaseUom > 0 && poLine.unit_price != null) {
            unitCost = (Number(poLine.unit_price) * qtyInPurchaseUom) / qtyInStockUom;
          } else if (poLine.unit_price != null) {
            unitCost = await convertUnitPriceToStockUom(
              Number(poLine.unit_price),
              poLine.uom_id,
              product?.uom_id,
              line.product_id,
              t,
            );
          }
        }
      } else if (move.reference_type === "purchase_return" && move.reference_id) {
        const { PurchaseReturnLine } = await import("../../purchase/models/purchaseReturnLine.model");
        const prLine = await PurchaseReturnLine.findOne({
          where: { return_id: move.reference_id, product_id: line.product_id },
          transaction: t
        });
        if (prLine?.unit_price != null) {
          unitCost = parseFloat(String(prLine.unit_price));
        }
      } else if (move.reference_type === "sales_return" && move.reference_id) {
        const { SalesReturnLine } = await import("../../sales/models/salesReturnLine.model");
        const srLine = await SalesReturnLine.findOne({
          where: { return_id: move.reference_id, product_id: line.product_id },
          transaction: t
        });
        if (srLine?.unit_price != null) {
          unitCost = parseFloat(String(srLine.unit_price));
        }
      }

      await this.updateStockBalance(
        move.warehouse_to_id,
        line.product_id,
        actualQty,
        line.location_to_id ?? null,
        line.lot_id ?? null,
        unitCost,
        t
      );
    }

    // Nếu là Phiếu trả hàng (PR)
    if (move.reference_type === "purchase_return" && move.reference_id) {
      const { PurchaseReturn } = await import("../../purchase/models/purchaseReturn.model");
      const { PurchaseReturnLine } = await import("../../purchase/models/purchaseReturnLine.model");

      const pr = await PurchaseReturn.findByPk(move.reference_id, { transaction: t });
      if (!pr) return;

      const prLines = await PurchaseReturnLine.findAll({
        where: { return_id: pr.id },
        transaction: t
      });

      const productIds = prLines.map((line) => line.product_id);

      const allLines = await StockMoveLine.findAll({
        include: [
          {
            model: StockMove,
            as: "move",
            where: {
              reference_type: "purchase_return",
              reference_id: pr.id,
              type: "receipt",
              status: "posted",
            },
          },
        ],
        where: {
          product_id: { [Op.in]: productIds },
        },
        transaction: t
      });

      let fullyReceived = true;
      for (const prLine of prLines) {
        const prQty = parseFloat(
          String(prLine.quantity_confirmed_stock_uom ?? prLine.qty_in_stock_uom ?? 0),
        );

        const previousReceived = allLines
          .filter(
            (line) =>
              line.product_id === prLine.product_id && line.move_id !== move.id,
          )
          .reduce((sum, line) => sum + parseFloat(String(line.quantity ?? 0)), 0);
        const currentReceived = lines
          .filter((line) => line.product_id === prLine.product_id)
          .reduce((sum, line) => sum + parseFloat(String(line.quantity ?? 0)), 0);

        const totalReceived = previousReceived + currentReceived;

        if (totalReceived < prQty) {
          fullyReceived = false;
          break;
        }
      }

      if (fullyReceived) {
        await pr.update({ status: "completed" }, { transaction: t });
        // Cập nhật PRA liên kết nếu có
        if (pr.pra_id) {
          const { PurchaseReturnAuthorization } = await import("../../purchase/models/purchaseReturnAuthorization.model");
          const pra = await PurchaseReturnAuthorization.findByPk(pr.pra_id, { transaction: t });
          if (pra && (pra.status === "processing" || pra.status === "approved")) {
            await pra.update({ status: "completed" }, { transaction: t });
          }
        }
      }
      return;
    }

    // Nếu không phải PO thì thôi
    if (move.reference_type !== "purchase_order" || !move.reference_id) return;

    const po = await PurchaseOrder.findByPk(move.reference_id, { transaction: t });
    if (!po) return;

    const poLines = await PurchaseOrderLine.findAll({
      where: { po_id: po.id },
      transaction: t
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
      transaction: t
    });
    let fullyReceived = true;

    for (const poLine of poLines) {
      // So sánh theo stock UOM: dùng qty_in_stock_uom nếu có, fallback về quantity
      const poQty = parseFloat(
        String(poLine.qty_in_stock_uom ?? poLine.quantity ?? 0),
      );

      const product = await Product.findByPk(poLine.product_id, {
        attributes: ["uom_id"],
        transaction: t,
      });
      let previousReceived = 0;
      for (const line of allLines.filter(
        (item) => item.product_id === poLine.product_id && item.move_id !== move.id,
      )) {
        previousReceived += await convertToStockUom(
          Number(line.quantity || 0),
          line.uom_id,
          product?.uom_id,
          line.product_id,
          t,
        );
      }
      let currentReceived = 0;
      for (const line of lines.filter((item) => item.product_id === poLine.product_id)) {
        currentReceived += await convertToStockUom(
          Number(line.quantity || 0),
          line.uom_id,
          product?.uom_id,
          line.product_id,
          t,
        );
      }

      const totalReceived = previousReceived + currentReceived;

      if (totalReceived < poQty) {
        fullyReceived = false;
        break;
      }
      // Nhận thừa (totalReceived > poQty) vẫn tính là fully received
    }
    await po.update({
      status: fullyReceived ? "completed" : "partially_received",
    }, { transaction: t });
  },

  // ==================================================
  // TYPE: issue
  // ==================================================
  async processIssue(move: any, lines: any[], t: any) {
    for (const line of lines) {
      const product = await Product.findByPk(line.product_id, {
        attributes: ["uom_id"],
        transaction: t
      });
      const actualQty = await convertToStockUom(
        parseFloat(String(line.quantity)),
        line.uom_id,
        product?.uom_id,
        line.product_id,
        t,
      );
      await this.updateStockBalance(
        move.warehouse_from_id,
        line.product_id,
        -actualQty,
        line.location_from_id ?? null,
        line.lot_id ?? null,
        undefined,
        t
      );

      // Fulfill reservation nếu xuất kho từ SO
      if (move.reference_type === "sale_order" && move.reference_id) {
        await stockReservationService.fulfill(
          line.product_id,
          move.warehouse_from_id,
          actualQty,
          "sale_order",
          move.reference_id,
          t
        );
      }
    }
    if (move.reference_type === "sale_order" && move.reference_id) {
      const so = await SaleOrder.findByPk(move.reference_id, { transaction: t });
      if (so) {
        const soLines = await SaleOrderLine.findAll({
          where: { order_id: so.id },
          transaction: t,
        });

        const otherMoves = await StockMove.findAll({
          where: {
            reference_id: so.id,
            reference_type: "sale_order",
            type: "issue",
            status: "posted",
            id: { [Op.ne]: move.id },
          },
          attributes: ["id"],
          transaction: t,
        });

        const otherMoveIds = otherMoves.map((m) => m.id);
        const otherLines = otherMoveIds.length > 0 ? await StockMoveLine.findAll({
          where: {
            move_id: otherMoveIds,
          },
          transaction: t,
        }) : [];

        let allFullyDelivered = true;
        let anyDelivered = false;

        for (const soLine of soLines) {
          const orderedQty = parseFloat(String(soLine.quantity ?? 0));
          const prevShipped = otherLines
            .filter((l) => Number(l.product_id) === Number(soLine.product_id))
            .reduce((sum, l) => sum + parseFloat(String(l.quantity ?? 0)), 0);
          const currShipped = lines
            .filter((l) => Number(l.product_id) === Number(soLine.product_id))
            .reduce((sum, l) => sum + parseFloat(String(l.quantity ?? 0)), 0);

          const totalShipped = prevShipped + currShipped;
          if (totalShipped < orderedQty) {
            allFullyDelivered = false;
          }
          if (totalShipped > 0) {
            anyDelivered = true;
          }
        }

        const deliveryStatus = allFullyDelivered
          ? "delivered"
          : anyDelivered
          ? "partial"
          : "pending";

        const nextStatus = allFullyDelivered ? "shipped" : "confirmed";

        await so.update({
          status: nextStatus,
          delivery_status: deliveryStatus,
        }, { transaction: t });
      }
    }
    if (move.reference_type === "purchase_return" && move.reference_id) {
      const { PurchaseReturn } = await import("../../purchase/models/purchaseReturn.model");
      await PurchaseReturn.update(
        { status: "shipped" },
        { where: { id: move.reference_id }, transaction: t }
      );
    }
  },

  // ==================================================
  // TYPE: transfer — Phase 1: Kho nguồn xuất hàng
  // ==================================================
  async processTransferPhase1(move: any, lines: any[], t: any) {
    for (const line of lines) {
      const product = await Product.findByPk(line.product_id, {
        attributes: ["uom_id"],
        transaction: t
      });
      const actualQty = await convertToStockUom(
        parseFloat(String(line.quantity)),
        line.uom_id,
        product?.uom_id,
        line.product_id,
        t,
      );

      // Trừ tồn kho nguồn
      await this.updateStockBalance(
        move.warehouse_from_id,
        line.product_id,
        -actualQty,
        line.location_from_id ?? null,
        line.lot_id ?? null,
        undefined,
        t
      );

      // Lấy unit_cost hiện tại của kho nguồn để lưu vào in_transit
      const sourceBalance = await StockBalance.findOne({
        where: { warehouse_id: move.warehouse_from_id, product_id: line.product_id },
        transaction: t,
      });
      const unitCost = sourceBalance ? parseFloat(String(sourceBalance.unit_cost ?? 0)) : 0;

      // Ghi nhận hàng đang vận chuyển
      await StockInTransit.create({
        stock_move_id: move.id,
        product_id: line.product_id,
        warehouse_from_id: move.warehouse_from_id,
        warehouse_to_id: move.warehouse_to_id,
        qty: actualQty,
        unit_cost: unitCost,
        lot_id: line.lot_id ?? null,
        location_from_id: line.location_from_id ?? null,
        location_to_id: line.location_to_id ?? null,
        dispatched_at: new Date(),
      }, { transaction: t });
    }
  },

  // ==================================================
  // TYPE: transfer — Phase 2: Kho đích nhận hàng
  // ==================================================
  async processTransferPhase2(move: any, inTransitItems: StockInTransit[], t: any) {
    for (const item of inTransitItems) {
      // Cộng tồn kho đích, giữ nguyên unit_cost từ kho nguồn
      await this.updateStockBalance(
        item.warehouse_to_id,
        item.product_id,
        +Number(item.qty),
        item.location_to_id ?? null,
        item.lot_id ?? null,
        item.unit_cost ?? undefined,
        t
      );

      // Đánh dấu đã nhận
      await item.update({ received_at: new Date() }, { transaction: t });
    }
  },

  /**
   * receiveTransfer — Phase 2: Kho đích xác nhận nhận hàng.
   * Chỉ WHMANAGER hoặc WHSTAFF của kho đích mới được gọi.
   *
   * Flow:
   *   in_transit → posted
   *   stock_in_transit.received_at = now
   *   stock_balance (kho đích) += qty
   */
  async receiveTransfer(stockMoveId: number, user: any) {
    const allowedRoles = [Role.WHMANAGER, Role.WHSTAFF];
    if (!allowedRoles.includes(user.role)) {
      throw new Error("You do not have permission to receive transfer.");
    }

    const move = await this.getById(stockMoveId);
    if (!move) throw { status: 404, message: "Stock Move not found" };

    if (move.type !== "transfer") {
      throw {
        status: 400,
        message: "Chỉ phiếu điều chuyển (transfer) mới có thể xác nhận nhận hàng.",
      };
    }

    if (move.status !== "in_transit") {
      throw {
        status: 400,
        message: `Phiếu điều chuyển đang ở trạng thái '${move.status}', không thể nhận. Chỉ nhận được khi status = in_transit.`,
      };
    }

    // Validate: user phải thuộc branch của kho đích
    const warehouseTo = await Warehouse.findByPk(move.warehouse_to_id!);
    if (!warehouseTo) throw { status: 400, message: "Kho đích không tìm thấy." };
    if (warehouseTo.branch_id !== user.branch_id) {
      throw {
        status: 403,
        message: "Bạn chỉ có thể nhận hàng cho kho thuộc chi nhánh của mình.",
      };
    }

    // Lấy tất cả items đang in-transit của phiếu này
    const inTransitItems = await StockInTransit.findAll({
      where: { stock_move_id: stockMoveId },
    });

    if (inTransitItems.length === 0) {
      throw {
        status: 400,
        message: "Không tìm thấy hàng đang vận chuyển cho phiếu này.",
      };
    }

    const t = await sequelize.transaction();
    try {
      // Phase 2: cộng tồn kho đích
      await this.processTransferPhase2(move, inTransitItems, t);

      // Chuyển status → posted
      await StockMove.update(
        { status: "posted" },
        { where: { id: stockMoveId }, transaction: t },
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }

    return this.getById(stockMoveId);
  },

  async processAdjustment(move: any, lines: any[], t: any) {
    for (const line of lines) {
      const product = await Product.findByPk(line.product_id, {
        attributes: ["uom_id"],
        transaction: t
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
          t,
        ));
      await this.updateStockBalance(
        move.warehouse_from_id,
        line.product_id,
        actualQty,
        line.location_from_id ?? null,
        line.lot_id ?? null,
        undefined,
        t
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
