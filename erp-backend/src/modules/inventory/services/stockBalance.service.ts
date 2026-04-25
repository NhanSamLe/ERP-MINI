import { StockBalance } from "../models/stockBalance.model";
import { StockMove } from "../models/stockMove.model";
import { StockMoveLine } from "../models/stockMoveLine.model";
import { PurchaseOrderLine } from "../../purchase/models/purchaseOrderLine.model";
import { JwtPayload } from "../../../core/types/jwt";
import { Warehouse } from "../models/warehouse.model";
import { Op } from "sequelize";

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

  /**
   * Backfill unit_cost từ PO lines cho các balance có unit_cost = 0 hoặc null.
   * Lấy unit_price từ receipt stock move gần nhất của từng product.
   */
  async recalculateCosts() {
    // Lấy tất cả balance có unit_cost = 0 hoặc null
    const balances = await StockBalance.findAll({
      where: {
        [Op.or]: [{ unit_cost: null }, { unit_cost: 0 }],
      },
    });

    let updated = 0;

    for (const balance of balances) {
      // Tìm receipt move line gần nhất cho product này tại warehouse này
      const line = await StockMoveLine.findOne({
        where: { product_id: balance.product_id },
        include: [
          {
            model: StockMove,
            as: "move",
            where: {
              type: "receipt",
              status: "posted",
              warehouse_to_id: balance.warehouse_id,
            },
            attributes: ["id", "reference_id", "reference_type"],
          },
        ],
        order: [["id", "DESC"]],
      });

      if (!line) continue;

      const move = (line as any).move;
      if (!move?.reference_id) continue;

      // Lấy unit_price từ PO line
      const poLine = await PurchaseOrderLine.findOne({
        where: {
          po_id: move.reference_id,
          product_id: balance.product_id,
        },
      });

      if (!poLine?.unit_price) {
        // Fallback: dùng cost_price từ product
        const { Product } = await import("../../product/models/product.model");
        const product = await Product.findByPk(balance.product_id, {
          attributes: ["cost_price"],
        });
        if (!product?.cost_price) continue;

        const unitCost = parseFloat(String(product.cost_price));
        const qty = parseFloat(String(balance.quantity));
        await balance.update({
          unit_cost: unitCost,
          total_value: qty * unitCost,
        });
        updated++;
        continue;
      }

      const unitCost = parseFloat(String(poLine.unit_price));
      const qty = parseFloat(String(balance.quantity));

      await balance.update({
        unit_cost: unitCost,
        total_value: qty * unitCost,
      });

      updated++;
    }

    return { updated, total: balances.length };
  },
};
