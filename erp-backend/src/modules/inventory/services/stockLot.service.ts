import { Op } from "sequelize";
import { StockLot } from "../models/stockLot.model";
import { StockBalance } from "../models/stockBalance.model";
import { StockMoveLine } from "../models/stockMoveLine.model";
import { Product } from "../../product/models/product.model";
import { Partner } from "../../partner/models/partner.model";
import { CreateLotDTO, UpdateLotDTO } from "../dto/stockLot.dto";

export type { CreateLotDTO, UpdateLotDTO };

const LOT_INCLUDE = [
  { model: Product, as: "product", attributes: ["id", "name", "sku"] },
  { model: Partner, as: "supplier", attributes: ["id", "name"] },
];

export const stockLotService = {
  async getAll(filters?: { productId?: number; supplierId?: number }) {
    const where: any = {};
    if (filters?.productId) where.product_id = filters.productId;
    if (filters?.supplierId) where.supplier_id = filters.supplierId;

    return StockLot.findAll({
      where,
      include: LOT_INCLUDE,
      order: [["id", "DESC"]],
    });
  },

  async getById(id: number) {
    return StockLot.findByPk(id, { include: LOT_INCLUDE });
  },

  async getByProduct(productId: number) {
    return StockLot.findAll({
      where: { product_id: productId },
      include: LOT_INCLUDE,
      order: [["expiry_date", "ASC"]],
    });
  },

  async create(data: CreateLotDTO) {
    // Kiểm tra unique (product_id, lot_no)
    const existing = await StockLot.findOne({
      where: { product_id: data.product_id, lot_no: data.lot_no },
    });
    if (existing) {
      throw new Error(
        `Lot number '${data.lot_no}' already exists for this product`,
      );
    }

    const lot = await StockLot.create(data as any);
    return this.getById(Number(lot.id));
  },

  async update(id: number, data: UpdateLotDTO) {
    const lot = await StockLot.findByPk(id);
    if (!lot) throw new Error("Lot not found");
    await lot.update(data as any);
    return this.getById(id);
  },

  async delete(id: number) {
    const lot = await StockLot.findByPk(id);
    if (!lot) throw new Error("Lot not found");

    // Kiểm tra có stock_balance trỏ vào không
    const balanceCount = await StockBalance.count({ where: { lot_id: id } });
    if (balanceCount > 0)
      throw new Error("Cannot delete lot with existing stock balance");

    // Kiểm tra có stock_move_lines trỏ vào không
    const moveLineCount = await StockMoveLine.count({ where: { lot_id: id } });
    if (moveLineCount > 0)
      throw new Error("Cannot delete lot referenced in stock moves");

    await lot.destroy();
    return { message: "Lot deleted successfully" };
  },

  async getExpiringLots(days: number) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    const nowStr = now.toISOString().split("T")[0] as string;
    const futureStr = future.toISOString().split("T")[0] as string;

    return StockLot.findAll({
      where: {
        expiry_date: {
          [Op.between]: [nowStr, futureStr],
        },
      },
      include: LOT_INCLUDE,
      order: [["expiry_date", "ASC"]],
    });
  },
};
