import { ITool, ToolContext, ToolResult } from "../types/llm.types";
import { Op } from "sequelize";

export const productTools: ITool[] = [
  {
    name: "get_product_categories",
    description:
      "Lấy danh sách danh mục sản phẩm. Dùng khi hỏi về category, loại sản phẩm, nhóm hàng, có bao nhiêu loại.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Tên category cần tìm (tùy chọn)",
        },
      },
    },
    async execute(args: any, _context: ToolContext): Promise<ToolResult> {
      try {
        const { ProductCategory } =
          await import("../../product/models/productCategory.model");

        const where: any = {};
        if (args.name) where.name = { [Op.like]: `%${args.name}%` };

        const data = await ProductCategory.findAll({
          where: Object.keys(where).length ? where : undefined,
          order: [["name", "ASC"]],
        });

        return {
          success: true,
          data: {
            total: data.length,
            categories: data.map((c: any) => ({
              id: c.id,
              name: c.name,
              parent_id: c.parent_id ?? null,
            })),
          },
        };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  },

  {
    name: "get_products",
    description:
      "Lấy danh sách sản phẩm. Dùng khi hỏi về sản phẩm, danh sách hàng hóa, tìm sản phẩm theo tên hoặc category.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Tên sản phẩm cần tìm (tùy chọn)",
        },
        category_name: {
          type: "string",
          description: "Tên category cần lọc (tùy chọn)",
        },
      },
    },
    async execute(args: any, _context: ToolContext): Promise<ToolResult> {
      try {
        const { Product } = await import("../../product/models/product.model");
        const { ProductCategory } =
          await import("../../product/models/productCategory.model");
        const { Uom } = await import("../../master-data/models/uom.model");

        const productWhere: any = {};
        if (args.name) productWhere.name = { [Op.like]: `%${args.name}%` };

        const categoryWhere: any = {};
        if (args.category_name)
          categoryWhere.name = { [Op.like]: `%${args.category_name}%` };

        const data = await Product.findAll({
          where: Object.keys(productWhere).length ? productWhere : undefined,
          include: [
            {
              model: ProductCategory,
              as: "category",
              where: Object.keys(categoryWhere).length
                ? categoryWhere
                : undefined,
              attributes: ["id", "name"],
            },
            { model: Uom, as: "uom", attributes: ["code", "name"] },
          ],
          attributes: [
            "id",
            "name",
            "sku",
            "sale_price",
            "cost_price",
            "min_stock_qty",
          ],
          order: [["name", "ASC"]],
          limit: 50,
        });

        return { success: true, data: { total: data.length, products: data } };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  },
];
