import { ITool, ToolContext, ToolResult } from "../types/llm.types";
import { callErpApi } from "./tool.helper";

const PERIOD_VALUES = ["this_month", "last_month", "this_quarter", "this_year"];

export const salesTools: ITool[] = [
  {
    name: "get_sales_revenue",
    description:
      "Truy vấn doanh thu bán hàng theo kỳ. Dùng khi hỏi về doanh thu, tổng tiền bán, doanh số.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: PERIOD_VALUES,
          description:
            "Kỳ báo cáo: this_month, last_month, this_quarter, this_year",
        },
        from_date: {
          type: "string",
          description: "Ngày bắt đầu YYYY-MM-DD (tùy chọn)",
        },
        to_date: {
          type: "string",
          description: "Ngày kết thúc YYYY-MM-DD (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/reports/sales",
        {
          ...(args.period && { period: args.period }),
          ...(args.from_date && { startDate: args.from_date }),
          ...(args.to_date && { endDate: args.to_date }),
        },
        context,
      );
    },
  },

  {
    name: "get_top_customers",
    description:
      "Lấy danh sách khách hàng mua nhiều nhất theo kỳ. Dùng khi hỏi về khách hàng VIP, khách mua nhiều nhất.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: PERIOD_VALUES,
          description: "Kỳ báo cáo",
        },
        limit: {
          type: "integer",
          description: "Số lượng khách hàng trả về (mặc định 10)",
          default: 10,
        },
      },
      required: ["period"],
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      // Lấy sale orders và tổng hợp theo khách hàng
      const result = await callErpApi(
        "/sales/orders",
        {
          ...(args.period && { period: args.period }),
          status: "completed",
        },
        context,
      );
      if (!result.success) return result;

      // Tổng hợp theo partner
      const orders: any[] = Array.isArray(result.data)
        ? result.data
        : (result.data?.data ?? []);
      const customerMap: Record<
        string,
        { name: string; total: number; count: number }
      > = {};
      for (const order of orders) {
        const name = order.partner?.name ?? order.customer_name ?? "Unknown";
        if (!customerMap[name])
          customerMap[name] = { name, total: 0, count: 0 };
        customerMap[name].total += Number(order.total_after_tax ?? 0);
        customerMap[name].count += 1;
      }
      const sorted = Object.values(customerMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, args.limit ?? 10);
      return { success: true, data: sorted };
    },
  },

  {
    name: "get_sale_orders",
    description:
      "Truy vấn danh sách đơn bán hàng. Dùng khi hỏi về đơn hàng, trạng thái đơn, đơn của khách hàng.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["draft", "confirmed", "shipped", "completed", "cancelled"],
          description: "Trạng thái đơn hàng (tùy chọn)",
        },
        customer_name: {
          type: "string",
          description: "Tên khách hàng (tùy chọn)",
        },
        from_date: {
          type: "string",
          description: "Ngày bắt đầu YYYY-MM-DD (tùy chọn)",
        },
        to_date: {
          type: "string",
          description: "Ngày kết thúc YYYY-MM-DD (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/sales/orders",
        {
          ...(args.status && { status: args.status }),
          ...(args.customer_name && { customerName: args.customer_name }),
          ...(args.from_date && { from: args.from_date }),
          ...(args.to_date && { to: args.to_date }),
        },
        context,
      );
    },
  },
];
