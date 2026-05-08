import { ITool, ToolContext, ToolResult } from "../types/llm.types";
import { callErpApi } from "./tool.helper";

export const financeTools: ITool[] = [
  {
    name: "get_account_balance",
    description:
      "Xem số dư tài khoản kế toán. Dùng khi hỏi về số dư tài khoản, tổng nợ/có, tình hình tài chính.",
    parameters: {
      type: "object",
      properties: {
        account_code: {
          type: "string",
          description: "Mã tài khoản kế toán (tùy chọn)",
        },
        account_name: {
          type: "string",
          description: "Tên tài khoản kế toán (tùy chọn)",
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/finance/gl-accounts",
        {
          ...(args.account_code && { code: args.account_code }),
          ...(args.account_name && { name: args.account_name }),
        },
        context,
      );
    },
  },

  {
    name: "get_journal_entries",
    description:
      "Xem bút toán kế toán theo khoảng thời gian. Dùng khi hỏi về bút toán, ghi sổ, journal entries.",
    parameters: {
      type: "object",
      properties: {
        from_date: {
          type: "string",
          description: "Ngày bắt đầu YYYY-MM-DD (bắt buộc)",
        },
        to_date: {
          type: "string",
          description: "Ngày kết thúc YYYY-MM-DD (bắt buộc)",
        },
        account_code: {
          type: "string",
          description: "Mã tài khoản cần lọc (tùy chọn)",
        },
      },
      required: ["from_date", "to_date"],
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/finance/gl-journals",
        {
          from: args.from_date,
          to: args.to_date,
          ...(args.account_code && { accountCode: args.account_code }),
        },
        context,
      );
    },
  },
];
