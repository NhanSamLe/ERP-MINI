import { ITool, ToolContext, ToolResult } from "../types/llm.types";
import { Op } from "sequelize";

export const inventoryTools: ITool[] = [
  {
    name: "get_stock_balance",
    description:
      "Truy vấn số lượng tồn kho của sản phẩm. Dùng khi người dùng hỏi về tồn kho, số lượng còn lại, hàng trong kho.",
    parameters: {
      type: "object",
      properties: {
        product_name: {
          type: "string",
          description: "Tên hoặc một phần tên sản phẩm cần tra cứu",
        },
        warehouse_name: {
          type: "string",
          description: "Tên kho cần lọc (tùy chọn)",
        },
      },
      required: ["product_name"],
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      try {
        const { StockBalance } =
          await import("../../inventory/models/stockBalance.model");
        const { Product } = await import("../../product/models/product.model");
        const { Warehouse } =
          await import("../../inventory/models/warehouse.model");
        const { Uom } = await import("../../master-data/models/uom.model");

        const warehouseWhere: any = { branch_id: context.branchId };
        if (args.warehouse_name)
          warehouseWhere.name = { [Op.like]: `%${args.warehouse_name}%` };

        const productWhere: any = {};
        if (args.product_name)
          productWhere.name = { [Op.like]: `%${args.product_name}%` };

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
              where: Object.keys(productWhere).length
                ? productWhere
                : undefined,
              attributes: ["id", "name", "sku"],
              include: [
                { model: Uom, as: "uom", attributes: ["code", "name"] },
              ],
            },
          ],
          order: [["product_id", "ASC"]],
        });

        if (data.length === 0) {
          return {
            success: true,
            data: {
              message: `Không tìm thấy tồn kho cho sản phẩm "${args.product_name}"`,
            },
          };
        }

        return { success: true, data };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  },

  {
    name: "get_expiring_lots",
    description:
      "Lấy danh sách lô hàng sắp hết hạn. Dùng khi hỏi về hàng hết hạn, lô sắp hết date, cảnh báo hạn sử dụng.",
    parameters: {
      type: "object",
      properties: {
        days: {
          type: "integer",
          description: "Số ngày tới để kiểm tra (mặc định 14)",
          default: 14,
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      try {
        const { StockLot } =
          await import("../../inventory/models/stockLot.model");
        const { Product } = await import("../../product/models/product.model");

        const days = args.days ?? 14;
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + days);

        const data = await StockLot.findAll({
          where: {
            expiry_date: {
              [Op.between]: [
                now.toISOString().split("T")[0] as string,
                future.toISOString().split("T")[0] as string,
              ],
            },
          },
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "sku"],
            },
          ],
          order: [["expiry_date", "ASC"]],
        });

        return { success: true, data };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  },

  {
    name: "get_stock_movement",
    description:
      "Xem lịch sử dịch chuyển kho (nhập/xuất/chuyển kho). Dùng khi hỏi về phiếu kho, lịch sử nhập xuất.",
    parameters: {
      type: "object",
      properties: {
        product_name: {
          type: "string",
          description: "Tên sản phẩm cần lọc (tùy chọn)",
        },
        warehouse_name: {
          type: "string",
          description: "Tên kho cần lọc (tùy chọn)",
        },
        from_date: {
          type: "string",
          description: "Ngày bắt đầu định dạng YYYY-MM-DD (tùy chọn)",
        },
        to_date: {
          type: "string",
          description: "Ngày kết thúc định dạng YYYY-MM-DD (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      try {
        const { StockMoveLine } =
          await import("../../inventory/models/stockMoveLine.model");
        const { StockMove } =
          await import("../../inventory/models/stockMove.model");
        const { Product } = await import("../../product/models/product.model");
        const { Warehouse } =
          await import("../../inventory/models/warehouse.model");
        const { StockLot } =
          await import("../../inventory/models/stockLot.model");

        const moveWhere: any = { status: "posted" };
        if (args.from_date && args.to_date) {
          moveWhere.move_date = {
            [Op.between]: [new Date(args.from_date), new Date(args.to_date)],
          };
        }

        const productWhere: any = {};
        if (args.product_name)
          productWhere.name = { [Op.like]: `%${args.product_name}%` };

        const warehouseWhere: any = { branch_id: context.branchId };
        if (args.warehouse_name)
          warehouseWhere.name = { [Op.like]: `%${args.warehouse_name}%` };

        const data = await StockMoveLine.findAll({
          include: [
            {
              model: StockMove,
              as: "move",
              where: moveWhere,
              attributes: ["id", "move_no", "move_date", "type"],
              include: [
                {
                  model: Warehouse,
                  as: "warehouseFrom",
                  where: warehouseWhere,
                  attributes: ["id", "name"],
                  required: false,
                },
              ],
            },
            {
              model: Product,
              as: "product",
              where: Object.keys(productWhere).length
                ? productWhere
                : undefined,
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
          limit: 100,
        });

        return { success: true, data };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  },
  {
    name: "get_low_stock",
    description:
      "Lấy danh sách sản phẩm sắp hết hàng (dưới mức tồn kho tối thiểu). Dùng khi hỏi về hàng sắp hết, cần nhập thêm hàng.",
    parameters: {
      type: "object",
      properties: {
        warehouse_name: {
          type: "string",
          description: "Tên kho cần lọc (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      try {
        const { StockBalance } =
          await import("../../inventory/models/stockBalance.model");
        const { Product } = await import("../../product/models/product.model");
        const { Warehouse } =
          await import("../../inventory/models/warehouse.model");
        const { Uom } = await import("../../master-data/models/uom.model");

        const warehouseWhere: any = { branch_id: context.branchId };
        if (args.warehouse_name)
          warehouseWhere.name = { [Op.like]: `%${args.warehouse_name}%` };

        const balances = await StockBalance.findAll({
          include: [
            {
              model: Warehouse,
              as: "warehouse",
              where: warehouseWhere,
              attributes: ["id", "name"],
            },
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "sku", "min_stock_qty"],
              include: [
                { model: Uom, as: "uom", attributes: ["code", "name"] },
              ],
            },
          ],
        });

        const lowStock = balances.filter((b: any) => {
          const minQty = parseFloat(String(b.product?.min_stock_qty ?? 0));
          return minQty > 0 && parseFloat(String(b.quantity)) < minQty;
        });

        return {
          success: true,
          data: {
            total: lowStock.length,
            items: lowStock,
          },
        };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  },
];
