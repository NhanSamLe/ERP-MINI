import { ITool, ToolContext, ToolResult } from "../types/llm.types";
import { callErpApi } from "./tool.helper";

export const purchaseTools: ITool[] = [
  {
    name: "get_purchase_orders",
    description:
      "Truy vấn danh sách đơn mua hàng. Dùng khi hỏi về đơn mua, đơn đặt hàng nhà cung cấp.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: [
            "draft",
            "waiting_approval",
            "confirmed",
            "partially_received",
            "completed",
            "cancelled",
          ],
          description: "Trạng thái đơn mua (tùy chọn)",
        },
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
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
        "/purchase-order",
        {
          ...(args.status && { status: args.status }),
          ...(args.supplier_name && { supplierName: args.supplier_name }),
          ...(args.from_date && { from: args.from_date }),
          ...(args.to_date && { to: args.to_date }),
        },
        context,
      );
    },
  },

  {
    name: "get_payables",
    description:
      "Xem công nợ phải trả nhà cung cấp. Dùng khi hỏi về nợ phải trả, hóa đơn chưa thanh toán, công nợ NCC.",
    parameters: {
      type: "object",
      properties: {
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
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
        "/ap/invoices",
        {
          status: "posted",
          ...(args.supplier_name && { supplierName: args.supplier_name }),
          ...(args.overdue_only && { overdueOnly: true }),
        },
        context,
      );
    },
  },
];
