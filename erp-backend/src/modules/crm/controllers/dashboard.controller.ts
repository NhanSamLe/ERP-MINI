import { Op, fn, col, literal, Sequelize } from "sequelize";
import { Request, Response } from "express";
import { Lead } from "../models/lead.model";
import { Activity } from "../models/activity.model";
import { Opportunity } from "../models/opportunity.model";
import { User, LeadSource, Branch } from "../../../models";

// helper parse date range
function parseDateRange(query: any) {
  let startDate = new Date();
  let endDate = new Date();

  if (query.date_from && query.date_to) {
    startDate = new Date(query.date_from);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(query.date_to);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  const period = query.period || "last_30_days";
  endDate = new Date();

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "last_7_days":
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "last_30_days":
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "ytd":
      startDate = new Date(startDate.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
  }
  return { startDate, endDate };
}

// helper X days ago
function daysAgo(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

export async function getSalesDashboard(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const userRole = user.role;
    const userBranchId = user.branch_id;

    // 1. Parse date filter
    const { startDate, endDate } = parseDateRange(req.query);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 2. Set scoping filters
    const leadWhere: any = { is_deleted: false };
    const oppWhere: any = { is_deleted: false };
    const actWhere: any = { is_deleted: false };

    if (userRole === "SALES") {
      leadWhere.assigned_to = userId;
      oppWhere.owner_id = userId;
      actWhere.owner_id = userId;
      if (userBranchId) {
        leadWhere.branch_id = userBranchId;
        oppWhere.branch_id = userBranchId;
      }
    } else if (userRole === "SALESMANAGER" || userRole === "BRANCH_MANAGER") {
      if (userBranchId) {
        leadWhere.branch_id = userBranchId;
        oppWhere.branch_id = userBranchId;
        
        const branchUsers = await User.findAll({
          where: { branch_id: userBranchId },
          attributes: ["id"]
        });
        const userIds = branchUsers.map(u => u.id);
        actWhere.owner_id = { [Op.in]: userIds };
      }
    } else if (userRole === "CEO" || userRole === "ADMIN") {
      if (req.query.branch_id) {
        const queryBranchId = Number(req.query.branch_id);
        leadWhere.branch_id = queryBranchId;
        oppWhere.branch_id = queryBranchId;
        
        const branchUsers = await User.findAll({
          where: { branch_id: queryBranchId },
          attributes: ["id"]
        });
        const userIds = branchUsers.map(u => u.id);
        actWhere.owner_id = { [Op.in]: userIds };
      }
    }

    // ===============================================================
    // 3. CUMULATIVE & PERIOD SUMMARY METRICS
    // ===============================================================

    // Total Leads (Cumulative)
    const totalLeads = await Lead.count({ where: leadWhere });

    // Contacted Leads (Cumulative)
    const contactedLeads = await Lead.count({
      where: { ...leadWhere, contacted_at: { [Op.not]: null as any } }
    });

    // New Leads in period
    const newLeadsInPeriod = await Lead.count({
      where: {
        ...leadWhere,
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });

    // Qualified Leads (Cumulative)
    const qualifiedLeads = await Lead.count({
      where: { ...leadWhere, stage: "qualified" }
    });

    // Opportunities (Cumulative)
    const totalOpp = await Opportunity.count({ where: oppWhere });

    // Opps in period
    const wonOppInPeriod = await Opportunity.count({
      where: {
        ...oppWhere,
        stage: "won",
        actual_close_date: { [Op.between]: [startDate, endDate] }
      }
    });

    const lostOppInPeriod = await Opportunity.count({
      where: {
        ...oppWhere,
        stage: "lost",
        actual_close_date: { [Op.between]: [startDate, endDate] }
      }
    });

    const winRateInPeriod =
      (wonOppInPeriod + lostOppInPeriod) > 0
        ? Math.round((wonOppInPeriod / (wonOppInPeriod + lostOppInPeriod)) * 100)
        : 0;

    // Revenue in period
    const revenueRes = await Opportunity.findOne({
      attributes: [[fn("SUM", col("expected_value")), "total"]],
      where: {
        ...oppWhere,
        stage: "won",
        actual_close_date: { [Op.between]: [startDate, endDate] }
      },
      raw: true
    }) as unknown as { total: number | null };

    const totalRevenueInPeriod = Number(revenueRes?.total ?? 0);

    // Activities in period
    const totalActivitiesInPeriod = await Activity.count({
      where: {
        ...actWhere,
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });

    const callsInPeriod = await Activity.count({
      where: {
        ...actWhere,
        activity_type: "call",
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });

    const emailsInPeriod = await Activity.count({
      where: {
        ...actWhere,
        activity_type: "email",
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });

    const meetingsInPeriod = await Activity.count({
      where: {
        ...actWhere,
        activity_type: "meeting",
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });

    const tasksInPeriod = await Activity.count({
      where: {
        ...actWhere,
        activity_type: "task",
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });

    // ===============================================================
    // 4. PIPELINE FUNNEL (CUMULATIVE ACTIVE DEALS)
    // ===============================================================
    const pipelineStages = ["prospecting", "negotiation", "won", "lost"];
    const pipeline = await Promise.all(
      pipelineStages.map(async (s) => ({
        stage: s,
        count: await Opportunity.count({
          where: { ...oppWhere, stage: s }
        })
      }))
    );

    // ===============================================================
    // 5. TREND CHARTS (DYNAMIC DATE RANGE)
    // ===============================================================
    const charts = await getChartTrends(startDate, endDate, diffDays, leadWhere, oppWhere, actWhere);

    // ===============================================================
    // 6. LEADERBOARD (XẾP HẠNG SALES - FOR MGR / CEO)
    // ===============================================================
    let leaderboard: any[] = [];
    if (userRole !== "SALES") {
      const leaderboardData = await Opportunity.findAll({
        attributes: [
          "owner_id",
          [fn("SUM", col("expected_value")), "total_revenue"],
          [fn("COUNT", col("id")), "won_deals_count"]
        ],
        where: {
          ...oppWhere,
          stage: "won",
          actual_close_date: { [Op.between]: [startDate, endDate] }
        },
        group: ["owner_id"],
        include: [{
          model: User,
          as: "owner",
          attributes: ["id", "full_name", "username"]
        }],
        order: [[literal("total_revenue"), "DESC"]],
        limit: 10
      });

      leaderboard = leaderboardData.map((item: any) => ({
        salespersonId: item.owner_id,
        salespersonName: item.owner?.full_name || item.owner?.username || `Salesperson #${item.owner_id}`,
        revenue: Number(item.getDataValue("total_revenue") || 0),
        wonDeals: Number(item.getDataValue("won_deals_count") || 0)
      }));
    }

    // ===============================================================
    // 7. LEAD SOURCE RATIO (PHÂN BỔ NGUỒN LEAD)
    // ===============================================================
    const leadSourceData = await Lead.findAll({
      attributes: [
        "source_id",
        [fn("COUNT", col("Lead.id")), "count"]
      ],
      where: {
        ...leadWhere,
        created_at: { [Op.between]: [startDate, endDate] }
      },
      group: ["source_id"],
      include: [{
        model: LeadSource,
        as: "leadSource",
        attributes: ["id", "name"]
      }]
    });

    const leadSources = leadSourceData.map((item: any) => ({
      sourceId: item.source_id,
      sourceName: item.leadSource?.name || "Khác / Trực tiếp",
      count: Number(item.getDataValue("count") || 0)
    }));

    // ===============================================================
    // 8. BRANCH SALES CONTRIBUTION (TỶ LỆ ĐÓNG GÓP DOANH THU - FOR CEO / ADMIN)
    // ===============================================================
    let branchComparison: any[] = [];
    if (userRole === "CEO" || userRole === "ADMIN") {
      const branches = await Branch.findAll({ attributes: ["id", "name"] });
      const branchMap = new Map(branches.map((b: any) => [Number(b.id), b.name]));

      const branchesData = await Opportunity.findAll({
        attributes: [
          "branch_id",
          [fn("SUM", col("expected_value")), "total_revenue"]
        ],
        where: {
          stage: "won",
          is_deleted: false,
          actual_close_date: { [Op.between]: [startDate, endDate] }
        },
        group: ["branch_id"]
      });

      branchComparison = branchesData.map((b: any) => {
        const bId = Number(b.branch_id);
        return {
          branchId: bId,
          branchName: branchMap.get(bId) || `Chi nhánh #${bId}`,
          revenue: Number(b.getDataValue("total_revenue") || 0)
        };
      });
    }

    // ===============================================================
    // 9. RECENT ITEMS
    // ===============================================================
    const recentActivities = await Activity.findAll({
      where: actWhere,
      limit: 10,
      order: [["created_at", "DESC"]]
    });

    const recentLeads = await Lead.findAll({
      where: leadWhere,
      limit: 10,
      order: [["created_at", "DESC"]]
    });

    const recentOpps = await Opportunity.findAll({
      where: oppWhere,
      limit: 10,
      order: [["created_at", "DESC"]]
    });

    // ===============================================================
    // RETURN FULL DASHBOARD DATA
    // ===============================================================
    return res.json({
      success: true,
      data: {
        role: userRole,
        startDate,
        endDate,
        summary: {
          totalLeads,
          contactedLeads,
          newLeadsInPeriod,
          qualifiedLeads,
          totalOpp,
          wonOppInPeriod,
          lostOppInPeriod,
          winRateInPeriod,
          totalRevenueInPeriod,
          activitiesInPeriod: {
            totalActivitiesInPeriod,
            callsInPeriod,
            emailsInPeriod,
            meetingsInPeriod,
            tasksInPeriod
          }
        },
        pipeline,
        charts,
        leaderboard,
        leadSources,
        branchComparison,
        recent: {
          leads: recentLeads,
          opportunities: recentOpps,
          activities: recentActivities
        }
      }
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    console.error("CRM Dashboard Error:", err);
    return res.status(500).json({ success: false, message: msg });
  }
}

// Helper function to query trends over dynamic date ranges
async function getChartTrends(
  startDate: Date,
  endDate: Date,
  diffDays: number,
  leadWhere: any,
  oppWhere: any,
  actWhere: any
) {
  const activity7d: { date: string; count: number }[] = [];
  const leads7d: { date: string; count: number }[] = [];
  const revenue30d: { date: string; total: number }[] = [];

  if (diffDays <= 31) {
    // Loop day by day
    const current = new Date(startDate);
    while (current <= endDate) {
      const start = new Date(current);
      start.setHours(0, 0, 0, 0);
      const end = new Date(current);
      end.setHours(23, 59, 59, 999);

      const dateStr = start.toISOString().substring(0, 10);

      const actCount = await Activity.count({
        where: { ...actWhere, created_at: { [Op.between]: [start, end] } }
      });

      const leadCount = await Lead.count({
        where: { ...leadWhere, created_at: { [Op.between]: [start, end] } }
      });

      const revSum = await Opportunity.findOne({
        attributes: [[fn("SUM", col("expected_value")), "total"]],
        where: {
          ...oppWhere,
          stage: "won",
          actual_close_date: { [Op.between]: [start, end] }
        },
        raw: true
      }) as any;

      activity7d.push({ date: dateStr, count: actCount });
      leads7d.push({ date: dateStr, count: leadCount });
      revenue30d.push({ date: dateStr, total: Number(revSum?.total ?? 0) });

      current.setDate(current.getDate() + 1);
    }
  } else {
    // Loop month by month
    const current = new Date(startDate);
    current.setDate(1); // Set to first day of month
    while (current <= endDate) {
      const year = current.getFullYear();
      const month = current.getMonth();
      const start = new Date(year, month, 1, 0, 0, 0, 0);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}`;

      const actCount = await Activity.count({
        where: { ...actWhere, created_at: { [Op.between]: [start, end] } }
      });

      const leadCount = await Lead.count({
        where: { ...leadWhere, created_at: { [Op.between]: [start, end] } }
      });

      const revSum = await Opportunity.findOne({
        attributes: [[fn("SUM", col("expected_value")), "total"]],
        where: {
          ...oppWhere,
          stage: "won",
          actual_close_date: { [Op.between]: [start, end] }
        },
        raw: true
      }) as any;

      activity7d.push({ date: dateStr, count: actCount });
      leads7d.push({ date: dateStr, count: leadCount });
      revenue30d.push({ date: dateStr, total: Number(revSum?.total ?? 0) });

      current.setMonth(current.getMonth() + 1);
    }
  }

  return {
    activity7d,
    leads7d,
    revenue30d
  };
}