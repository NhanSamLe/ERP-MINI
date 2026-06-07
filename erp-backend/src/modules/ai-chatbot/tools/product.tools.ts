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
      "Lấy danh sách sản phẩm để tìm product_id. Dùng khi hỏi về sản phẩm, tìm sản phẩm theo tên hoặc category. " +
      "LƯU Ý: Tool này CHỈ trả về thông tin cơ bản của sản phẩm (id, tên, SKU, đơn vị). " +
      "KHÔNG dùng giá từ tool này để tạo PO — cost_price chỉ là giá vốn kế toán, không phải giá mua NCC. " +
      "Sau khi có product_id, BẮT BUỘC gọi get_product_price_suggestions để lấy giá mua thực tế.",
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
            { model: Uom, as: "uom", attributes: ["id", "code", "name"] },
          ],
          // Không trả về sale_price để AI không nhầm dùng giá bán để mua hàng
          attributes: ["id", "name", "sku", "min_stock_qty", "tax_rate_id"],
          order: [["name", "ASC"]],
          limit: 50,
        });

        return {
          success: true,
          data: {
            total: data.length,
            products: data,
            note: "Để lấy giá mua thực tế, hãy gọi get_product_price_suggestions(product_id, supplier_id, quantity)",
          },
        };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  },
];
