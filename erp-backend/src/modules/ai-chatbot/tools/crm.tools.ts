import { ITool, ToolContext, ToolResult } from "../types/llm.types";
import { callErpApi } from "./tool.helper";

export const crmTools: ITool[] = [
  {
    name: "get_crm_summary",
    description:
      "Tổng quan CRM: số leads, cơ hội, tỷ lệ chuyển đổi. Dùng khi hỏi về pipeline bán hàng, tình hình CRM.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["this_month", "last_month", "this_quarter"],
          description: "Kỳ báo cáo",
        },
      },
      required: ["period"],
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      const [leadsResult, oppsResult] = await Promise.all([
        callErpApi("/crm/leads", { period: args.period }, context),
        callErpApi("/crm/opportunities", { period: args.period }, context),
      ]);

      if (!leadsResult.success) return leadsResult;
      if (!oppsResult.success) return oppsResult;

      const leads: any[] = Array.isArray(leadsResult.data)
        ? leadsResult.data
        : (leadsResult.data?.data ?? []);
      const opps: any[] = Array.isArray(oppsResult.data)
        ? oppsResult.data
        : (oppsResult.data?.data ?? []);

      const wonOpps = opps.filter((o: any) => o.stage === "won");
      const totalValue = opps.reduce(
        (s: number, o: any) => s + Number(o.expected_revenue ?? 0),
        0,
      );
      const winRate =
        opps.length > 0
          ? ((wonOpps.length / opps.length) * 100).toFixed(1)
          : "0";

      return {
        success: true,
        data: {
          total_leads: leads.length,
          total_opportunities: opps.length,
          won_opportunities: wonOpps.length,
          total_opportunity_value: totalValue,
          win_rate_percent: winRate,
          period: args.period,
        },
      };
    },
  },

  {
    name: "get_upcoming_activities",
    description:
      "Lấy các hoạt động CRM sắp tới (cuộc gọi, meeting, task). Dùng khi hỏi về lịch làm việc, hoạt động sắp tới.",
    parameters: {
      type: "object",
      properties: {
        days: {
          type: "integer",
          description: "Số ngày tới để kiểm tra (mặc định 7)",
          default: 7,
        },
      },
    },
    async execute(args: any, context: ToolContext): Promise<ToolResult> {
      return callErpApi(
        "/crm/activities",
        {
          due_within_days: args.days ?? 7,
          status: "pending",
        },
        context,
      );
    },
  },
];
