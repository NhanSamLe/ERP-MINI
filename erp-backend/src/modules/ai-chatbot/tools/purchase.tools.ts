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

  {
    name: "get_purchase_returns",
    description:
      "Truy vấn danh sách đơn trả hàng mua (Purchase Returns). Dùng khi hỏi về phiếu trả hàng cho nhà cung cấp.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["draft", "shipping", "confirmed", "completed", "cancelled"],
          description: "Trạng thái phiếu trả hàng (tùy chọn)",
        },
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/purchase/returns",
        {
          ...(args.status && { status: args.status }),
          ...(args.supplier_name && { supplierName: args.supplier_name }),
        },
        context,
      );
    },
  },

  {
    name: "get_debit_notes",
    description:
      "Truy vấn danh sách Thẻ nợ / Ghi chú nợ (Debit Notes). Dùng khi hỏi về chứng từ giảm công nợ phải trả cho nhà cung cấp.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["draft", "posted", "cancelled"],
          description: "Trạng thái thẻ nợ (tùy chọn)",
        },
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/purchase/debit-notes",
        {
          ...(args.status && { status: args.status }),
          ...(args.supplier_name && { supplierName: args.supplier_name }),
        },
        context,
      );
    },
  },

  {
    name: "get_vendor_refunds",
    description:
      "Truy vấn danh sách Phiếu hoàn tiền nhà cung cấp (Vendor Refunds). Dùng khi hỏi về tiền nhận lại từ nhà cung cấp sau khi trả hàng.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["draft", "posted"],
          description: "Trạng thái phiếu hoàn tiền (tùy chọn)",
        },
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/purchase/vendor-refunds",
        {
          ...(args.status && { status: args.status }),
          ...(args.supplier_name && { supplierName: args.supplier_name }),
        },
        context,
      );
    },
  },

  {
    name: "get_purchase_return_authorizations",
    description:
      "Truy vấn danh sách Yêu cầu trả hàng mua (Purchase Return Authorizations - PRA). Dùng khi hỏi về yêu cầu/thỏa thuận trả hàng.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["draft", "waiting_approval", "approved", "rejected"],
          description: "Trạng thái yêu cầu trả hàng (tùy chọn)",
        },
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/purchase/return-authorizations",
        {
          ...(args.status && { status: args.status }),
          ...(args.supplier_name && { supplierName: args.supplier_name }),
        },
        context,
      );
    },
  },

  {
    name: "get_ap_payments",
    description:
      "Truy vấn danh sách Phiếu chi / Phiếu thanh toán cho nhà cung cấp (AP Payments). Dùng khi hỏi về lịch sử chi tiền, thanh toán công nợ nhà cung cấp.",
    parameters: {
      type: "object",
      properties: {
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/ap/payments",
        {
          ...(args.supplier_name && { supplierName: args.supplier_name }),
        },
        context,
      );
    },
  },

  {
    name: "get_ap_invoices",
    description:
      "Xem danh sách hóa đơn mua hàng / hóa đơn phải trả (AP Invoices). Dùng khi hỏi về hóa đơn mua, hóa đơn từ OCR, hóa đơn nhà cung cấp, hoặc số lượng hóa đơn tạo từ OCR.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["draft", "posted", "paid", "cancelled"],
          description: "Trạng thái hóa đơn (tùy chọn)",
        },
        approval_status: {
          type: "string",
          enum: ["draft", "waiting_approval", "approved", "rejected"],
          description: "Trạng thái phê duyệt (tùy chọn)",
        },
        source: {
          type: "string",
          enum: ["manual", "ai_ocr"],
          description: "Nguồn tạo hóa đơn: manual hoặc ai_ocr (tùy chọn)",
        },
        supplier_name: {
          type: "string",
          description: "Tên nhà cung cấp (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/ap/invoices",
        {
          ...(args.status && { status: args.status }),
          ...(args.approval_status && { approval_status: args.approval_status }),
          ...(args.source && { source: args.source }),
          ...(args.supplier_name && { supplierName: args.supplier_name }),
        },
        context,
      );
    },
  },
];
