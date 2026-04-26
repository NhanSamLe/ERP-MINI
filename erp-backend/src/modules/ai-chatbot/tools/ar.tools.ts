import { ITool, ToolContext, ToolResult } from "../types/llm.types";
import { callErpApi } from "./tool.helper";

export const arTools: ITool[] = [
  {
    name: "get_ar_invoices",
    description:
      "Xem hóa đơn bán hàng (AR). Dùng khi hỏi về hóa đơn bán, công nợ phải thu, khách hàng chưa thanh toán.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["draft", "posted", "paid", "cancelled"],
          description: "Trạng thái hóa đơn (tùy chọn)",
        },
        customer_name: {
          type: "string",
          description: "Tên khách hàng (tùy chọn)",
        },
        overdue_only: {
          type: "boolean",
          description: "Chỉ lấy hóa đơn quá hạn (mặc định false)",
          default: false,
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/ar/invoices",
        {
          ...(args.status && { status: args.status }),
          ...(args.customer_name && { customerName: args.customer_name }),
          ...(args.overdue_only && { overdueOnly: true }),
        },
        context,
      );
    },
  },

  {
    name: "get_ar_receipts",
    description:
      "Xem phiếu thu tiền từ khách hàng. Dùng khi hỏi về phiếu thu, tiền đã thu, thanh toán từ khách.",
    parameters: {
      type: "object",
      properties: {
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
        "/ar/receipts",
        {
          ...(args.customer_name && { customerName: args.customer_name }),
          ...(args.from_date && { from: args.from_date }),
          ...(args.to_date && { to: args.to_date }),
        },
        context,
      );
    },
  },
];
