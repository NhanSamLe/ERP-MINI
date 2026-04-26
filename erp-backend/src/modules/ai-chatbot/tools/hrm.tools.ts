import { ITool, ToolContext, ToolResult } from "../types/llm.types";
import { callErpApi } from "./tool.helper";

export const hrmTools: ITool[] = [
  {
    name: "get_attendance_summary",
    description:
      "Tổng hợp chấm công nhân viên. Dùng khi hỏi về ngày công, vắng mặt, đi trễ của nhân viên.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["this_month", "last_month"],
          description: "Kỳ báo cáo",
        },
        employee_name: {
          type: "string",
          description: "Tên nhân viên cần lọc (tùy chọn)",
        },
      },
      required: ["period"],
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/attendance",
        {
          period: args.period,
          ...(args.employee_name && { employeeName: args.employee_name }),
        },
        context,
      );
    },
  },

  {
    name: "get_payroll_summary",
    description:
      "Tổng hợp bảng lương theo kỳ. Dùng khi hỏi về lương, chi phí nhân sự, bảng lương tháng.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["this_month", "last_month"],
          description: "Kỳ lương cần xem",
        },
      },
      required: ["period"],
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/hrm/payroll-runs",
        {
          period: args.period,
        },
        context,
      );
    },
  },
];
