import { Request, Response } from "express";
import { Op } from "sequelize";
import { StockBalance } from "../../inventory/models/stockBalance.model";
import { StockMove } from "../../inventory/models/stockMove.model";
import { StockMoveLine } from "../../inventory/models/stockMoveLine.model";
import { StockLot } from "../../inventory/models/stockLot.model";
import { StockLocation } from "../../inventory/models/stockLocation.model";
import { Warehouse } from "../../inventory/models/warehouse.model";
import { Product } from "../../product/models/product.model";
import { ProductCategory } from "../../product/models/productCategory.model";
import { Uom } from "../../master-data/models/uom.model";

export const inventoryReportController = {
  /**
   * GET /reports/inventory/stock-summary
   * Tổng hợp tồn kho theo product/warehouse/location/lot
   */
  async stockSummary(req: Request, res: Response) {
    try {
      const { warehouseId, productId, categoryId, productName, warehouseName } =
        req.query;
      const user = (req as any).user;

      const warehouseWhere: any = { branch_id: user.branch_id };
      if (warehouseId) warehouseWhere.id = Number(warehouseId);
      if (warehouseName)
        warehouseWhere.name = { [Op.like]: `%${warehouseName}%` };

      const productWhere: any = {};
      if (productId) productWhere.id = Number(productId);
      if (categoryId) productWhere.category_id = Number(categoryId);
      if (productName) productWhere.name = { [Op.like]: `%${productName}%` };

      const data = await StockBalance.findAll({
        include: [
          {
            model: Warehouse,
            as: "warehouse",
            where: warehouseWhere,
            attributes: ["id", "name", "code"],
          },
          {
            model: Product,
            as: "product",
            where: Object.keys(productWhere).length ? productWhere : undefined,
            attributes: ["id", "name", "sku", "min_stock_qty"],
            include: [
              { model: Uom, as: "uom", attributes: ["id", "code", "name"] },
              {
                model: ProductCategory,
                as: "category",
                attributes: ["id", "name"],
              },
            ],
          },
          {
            model: StockLocation,
            as: "location",
            attributes: ["id", "name", "code", "type"],
            required: false,
          },
          {
            model: StockLot,
            as: "lot",
            attributes: ["id", "lot_no", "expiry_date"],
            required: false,
          },
        ],
        order: [["product_id", "ASC"]],
      });

      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /**
   * GET /reports/inventory/stock-valuation
   * Tổng giá trị tồn kho, breakdown theo category
   */
  async stockValuation(req: Request, res: Response) {
    try {
      const { warehouseId } = req.query;
      const user = (req as any).user;

      const warehouseWhere: any = { branch_id: user.branch_id };
      if (warehouseId) warehouseWhere.id = Number(warehouseId);

      const rows = await StockBalance.findAll({
        include: [
          {
            model: Warehouse,
            as: "warehouse",
            where: warehouseWhere,
            attributes: [],
          },
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "sku"],
            include: [
              {
                model: ProductCategory,
                as: "category",
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      });

      // Aggregate by category
      const byCategory: Record<
        string,
        { category: string; total_value: number; total_qty: number }
      > = {};
      let grandTotal = 0;

      for (const row of rows) {
        const p = (row as any).product;
        const catName = p?.category?.name ?? "Uncategorized";
        const val = parseFloat(String(row.total_value ?? 0));
        const qty = parseFloat(String(row.quantity ?? 0));

        if (!byCategory[catName]) {
          byCategory[catName] = {
            category: catName,
            total_value: 0,
            total_qty: 0,
          };
        }
        byCategory[catName].total_value += val;
        byCategory[catName].total_qty += qty;
        grandTotal += val;
      }

      res.json({
        grand_total_value: grandTotal,
        by_category: Object.values(byCategory).sort(
          (a, b) => b.total_value - a.total_value,
        ),
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /**
   * GET /reports/inventory/stock-movement
   * Lịch sử nhập/xuất theo khoảng thời gian
   */
  async stockMovement(req: Request, res: Response) {
    try {
      const { productId, warehouseId, from, to } = req.query;
      const user = (req as any).user;

      const moveWhere: any = { status: "posted" };
      if (from && to) {
        moveWhere.move_date = {
          [Op.between]: [new Date(String(from)), new Date(String(to))],
        };
      }

      const lineWhere: any = {};
      if (productId) lineWhere.product_id = Number(productId);

      const data = await StockMoveLine.findAll({
        where: Object.keys(lineWhere).length ? lineWhere : undefined,
        include: [
          {
            model: StockMove,
            as: "move",
            where: moveWhere,
            attributes: [
              "id",
              "move_no",
              "move_date",
              "type",
              "warehouse_from_id",
              "warehouse_to_id",
            ],
            include: [
              {
                model: Warehouse,
                as: "warehouseFrom",
                where: warehouseId
                  ? { id: Number(warehouseId) }
                  : { branch_id: user.branch_id },
                attributes: ["id", "name"],
                required: false,
              },
            ],
          },
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "sku"],
          },
          {
            model: StockLot,
            as: "lot",
            attributes: ["id", "lot_no"],
            required: false,
          },
        ],
        order: [[{ model: StockMove, as: "move" }, "move_date", "DESC"]],
        limit: 500,
      });

      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /**
   * GET /reports/inventory/low-stock
   * Products có quantity < min_stock_qty
   */
  async lowStock(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      const balances = await StockBalance.findAll({
        include: [
          {
            model: Warehouse,
            as: "warehouse",
            where: { branch_id: user.branch_id },
            attributes: ["id", "name"],
          },
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "sku", "min_stock_qty"],
            include: [
              { model: Uom, as: "uom", attributes: ["id", "code", "name"] },
            ],
          },
        ],
      });

      const lowStock = balances.filter((b) => {
        const p = (b as any).product;
        const minQty = parseFloat(String(p?.min_stock_qty ?? 0));
        const qty = parseFloat(String(b.quantity));
        return minQty > 0 && qty < minQty;
      });

      res.json(lowStock);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async expiringLots(req: Request, res: Response) {
    try {
      const { days } = req.query;
      const fromMonthStr = typeof req.query.fromMonth === "string" ? req.query.fromMonth : undefined;
      const toMonthStr = typeof req.query.toMonth === "string" ? req.query.toMonth : undefined;
      const whereClause: any = {};

      if (fromMonthStr || toMonthStr) {
        whereClause.expiry_date = {};
        if (fromMonthStr) {
          const parts = fromMonthStr.split("-");
          const start = new Date(parseInt(parts[0] || "0"), parseInt(parts[1] || "1") - 1, 1, 0, 0, 0);
          whereClause.expiry_date[Op.gte] = start;
        }
        if (toMonthStr) {
          const parts = toMonthStr.split("-");
          const end = new Date(parseInt(parts[0] || "0"), parseInt(parts[1] || "1"), 1, 0, 0, 0);
          whereClause.expiry_date[Op.lt] = end;
        }
      } else {
        const d = days ? Number(days) : 30;
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + d);
        whereClause.expiry_date = {
          [Op.between]: [
            now.toISOString().split("T")[0] as string,
            future.toISOString().split("T")[0] as string,
          ],
        };
      }

      const data = await StockLot.findAll({
        where: whereClause,
        include: [
          { model: Product, as: "product", attributes: ["id", "name", "sku"] },
        ],
        order: [["expiry_date", "ASC"]],
      });

      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  /**
   * GET /reports/inventory/dashboard-stats
   * Tổng hợp nhanh cho dashboard cards
   */
  async dashboardStats(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const fromMonthStr = typeof req.query.fromMonth === "string" ? req.query.fromMonth : undefined;
      const toMonthStr = typeof req.query.toMonth === "string" ? req.query.toMonth : undefined;

      console.log("[Inventory Dashboard Stats] Filters received:", { fromMonthStr, toMonthStr });

      const warehouseIds = await Warehouse.findAll({
        where: { branch_id: user.branch_id },
        attributes: ["id"],
        raw: true,
      }).then((ws) => ws.map((w: any) => w.id));

      // Tổng giá trị tồn kho
      const balances = await StockBalance.findAll({
        where: { warehouse_id: { [Op.in]: warehouseIds } },
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["min_stock_qty"],
          },
        ],
      });

      const totalValue = balances.reduce(
        (s, b) => s + parseFloat(String(b.total_value ?? 0)),
        0,
      );

      const lowStockCount = balances.filter((b) => {
        const minQty = parseFloat(
          String((b as any).product?.min_stock_qty ?? 0),
        );
        return minQty > 0 && parseFloat(String(b.quantity)) < minQty;
      }).length;

      // Lots sắp hết hạn
      const lotWhere: any = {};
      if (fromMonthStr || toMonthStr) {
        lotWhere.expiry_date = {};
        if (fromMonthStr) {
          const parts = fromMonthStr.split("-");
          const start = new Date(parseInt(parts[0] || "0"), parseInt(parts[1] || "1") - 1, 1, 0, 0, 0);
          lotWhere.expiry_date[Op.gte] = start;
        }
        if (toMonthStr) {
          const parts = toMonthStr.split("-");
          const end = new Date(parseInt(parts[0] || "0"), parseInt(parts[1] || "1"), 1, 0, 0, 0);
          lotWhere.expiry_date[Op.lt] = end;
        }
      } else {
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + 30);
        lotWhere.expiry_date = {
          [Op.between]: [
            now.toISOString().split("T")[0] as string,
            future.toISOString().split("T")[0] as string,
          ],
        };
      }

      const expiringCount = await StockLot.count({
        where: lotWhere,
      });

      // Phiếu kho chờ duyệt
      const moveWhere: any = {
        status: "waiting_approval",
        [Op.or]: [
          { warehouse_from_id: { [Op.in]: warehouseIds } },
          { warehouse_to_id: { [Op.in]: warehouseIds } },
        ],
      };

      if (fromMonthStr || toMonthStr) {
        moveWhere.move_date = {};
        if (fromMonthStr) {
          const parts = fromMonthStr.split("-");
          const start = new Date(parseInt(parts[0] || "0"), parseInt(parts[1] || "1") - 1, 1, 0, 0, 0);
          moveWhere.move_date[Op.gte] = start;
        }
        if (toMonthStr) {
          const parts = toMonthStr.split("-");
          const end = new Date(parseInt(parts[0] || "0"), parseInt(parts[1] || "1"), 1, 0, 0, 0);
          moveWhere.move_date[Op.lt] = end;
        }
      }

      const pendingMoves = await StockMove.count({
        where: moveWhere,
      });

      // 5. Xu hướng nhập/xuất kho theo tháng
      const trendsMonths: Record<string, { month: string; receipts: number; issues: number }> = {};
      if (fromMonthStr && toMonthStr) {
        const startParts = fromMonthStr.split("-");
        const endParts = toMonthStr.split("-");
        let startY = parseInt(startParts[0] || "0");
        let startM = parseInt(startParts[1] || "1") - 1;
        const endY = parseInt(endParts[0] || "0");
        const endM = parseInt(endParts[1] || "1") - 1;

        const start = new Date(startY, startM, 1);
        const end = new Date(endY, endM, 1);

        while (start <= end) {
          const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
          trendsMonths[key] = { month: key, receipts: 0, issues: 0 };
          start.setMonth(start.getMonth() + 1);
        }
      } else {
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          trendsMonths[key] = { month: key, receipts: 0, issues: 0 };
        }
      }

      const moveWhereClause: any = {
        status: "posted",
        [Op.or]: [
          { warehouse_from_id: { [Op.in]: warehouseIds } },
          { warehouse_to_id: { [Op.in]: warehouseIds } },
        ],
      };
      if (fromMonthStr) {
        const parts = fromMonthStr.split("-");
        moveWhereClause.move_date = { ...moveWhereClause.move_date, [Op.gte]: new Date(parseInt(parts[0] || "0"), parseInt(parts[1] || "1") - 1, 1) };
      }
      if (toMonthStr) {
        const parts = toMonthStr.split("-");
        moveWhereClause.move_date = { ...moveWhereClause.move_date, [Op.lt]: new Date(parseInt(parts[0] || "0"), parseInt(parts[1] || "1"), 1) };
      }

      const moves = await StockMove.findAll({
        where: moveWhereClause,
        attributes: ["type", "move_date"],
        raw: true,
      });

      moves.forEach((m) => {
        const d = new Date(m.move_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (trendsMonths[key]) {
          if (m.type === "receipt") {
            trendsMonths[key].receipts += 1;
          } else if (m.type === "issue") {
            trendsMonths[key].issues += 1;
          }
        }
      });

      const trends = Object.values(trendsMonths);

      res.json({
        total_stock_value: totalValue,
        low_stock_count: lowStockCount,
        expiring_lots_count: expiringCount,
        pending_moves_count: pendingMoves,
        trends,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
};
