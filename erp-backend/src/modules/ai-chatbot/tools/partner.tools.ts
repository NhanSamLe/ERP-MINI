import { ITool, ToolContext, ToolResult } from "../types/llm.types";
import { Op } from "sequelize";

export const partnerTools: ITool[] = [
  {
    name: "get_partners",
    description:
      "Lấy danh sách đối tác, khách hàng, nhà cung cấp. Dùng khi hỏi về khách hàng, nhà cung cấp, đối tác kinh doanh.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Tên đối tác cần tìm (tùy chọn)",
        },
        type: {
          type: "string",
          enum: ["customer", "supplier", "both"],
          description: "Loại đối tác (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      try {
        const { Partner } = await import("../../partner/models/partner.model");

        const where: any = { branch_id: context.branchId };
        if (args.name) where.name = { [Op.like]: `%${args.name}%` };
        if (args.type === "customer") where.is_customer = true;
        if (args.type === "supplier") where.is_supplier = true;

        const data = await Partner.findAll({
          where,
          attributes: [
            "id",
            "name",
            "email",
            "phone",
            "is_customer",
            "is_supplier",
          ],
          order: [["name", "ASC"]],
          limit: 50,
        });

        return { success: true, data: { total: data.length, partners: data } };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  },
];
