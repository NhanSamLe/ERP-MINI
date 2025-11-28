import { Op, fn, col, literal, Sequelize } from "sequelize";
import { Request, Response } from "express";
import { Lead } from "../models/lead.model";
import { Activity } from "../models/activity.model";
import { Opportunity } from "../models/opportunity.model";
import { TimelineEvent } from "../models/timelineEvent.model";
import { MeetingActivity } from "../models/meetingActivity.model";
import { TaskActivity } from "../models/taskActivity.model";
interface SumValue {
  total: number | string | null;
}
// helper for created_at BETWEEN
function betweenCreatedAt(start: Date, end: Date) {
  return Sequelize.where(Sequelize.col("created_at"), {
    [Op.between]: [start, end]
  });
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
    const userId = (req as any).user.id;

    const todayStart = daysAgo(0);
    const todayEnd = new Date();

    // ===============================================================
    // 1. SUMMARY (NHỮNG CON SỐ HỒI NẪY BẠN MUỐN GIỮ)
    // ===============================================================

    // Leads
    const totalLeads = await Lead.count({
      where: { assigned_to: userId, is_deleted: false }
    });

    const contactedLeads = await Lead.count({
      where: {
        assigned_to: userId,
        contacted_at: { [Op.not]: null as any },
        is_deleted: false
      }
    });

    const newLeadsToday = await Lead.count({
      where: {
        assigned_to: userId,
        is_deleted: false,
        [Op.and]: [betweenCreatedAt(todayStart, todayEnd)]
      }
    });

    const qualifiedLeads = await Lead.count({
      where: { assigned_to: userId, stage: "qualified", is_deleted: false }
    });

    // Opportunities
    const totalOpp = await Opportunity.count({
      where: { owner_id: userId, is_deleted: false }
    });

    const wonOpp = await Opportunity.count({
      where: { owner_id: userId, stage: "won", is_deleted: false }
    });

    const lostOpp = await Opportunity.count({
      where: { owner_id: userId, stage: "lost", is_deleted: false }
    });

    const winRate =
      totalOpp > 0 ? Math.round((wonOpp / totalOpp) * 100) : 0;

    const revenueRes = await Opportunity.findOne({
      attributes: [[fn("SUM", col("expected_value")), "total"]],
      where: { owner_id: userId, stage: "won", is_deleted: false },
      raw: true
    }) as unknown as { total: number | null };

    const totalRevenue = Number(revenueRes.total ?? 0);

    // Activities today (call/email/meeting/task)
    const totalActivitiesToday = await Activity.count({
      where: {
        owner_id: userId,
        is_deleted: false,
        [Op.and]: [betweenCreatedAt(todayStart, todayEnd)]
      }
    });

    const callsToday = await Activity.count({
      where: {
        owner_id: userId,
        activity_type: "call",
        is_deleted: false,
        [Op.and]: [betweenCreatedAt(todayStart, todayEnd)]
      }
    });

    const emailsToday = await Activity.count({
      where: {
        owner_id: userId,
        activity_type: "email",
        is_deleted: false,
        [Op.and]: [betweenCreatedAt(todayStart, todayEnd)]
      }
    });

    const meetingsToday = await Activity.count({
      where: {
        owner_id: userId,
        activity_type: "meeting",
        is_deleted: false,
        [Op.and]: [betweenCreatedAt(todayStart, todayEnd)]
      }
    });

    const tasksToday = await Activity.count({
      where: {
        owner_id: userId,
        activity_type: "task",
        is_deleted: false,
        [Op.and]: [betweenCreatedAt(todayStart, todayEnd)]
      }
    });

    // ===============================================================
    // 2. PIPELINE FUNNEL
    // ===============================================================

    const pipelineStages = ["prospecting", "negotiation", "won", "lost"];

    const pipeline = await Promise.all(
      pipelineStages.map(async (s) => ({
        stage: s,
        count: await Opportunity.count({
          where: { owner_id: userId, stage: s, is_deleted: false }
        })
      }))
    );

    // ===============================================================
    // 3. CHART: ACTIVITIES LAST 7 DAYS
    // ===============================================================

    const activity7d: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = daysAgo(i);
      const end = daysAgo(i - 1);

      const count = await Activity.count({
        where: {
          owner_id: userId,
          is_deleted: false,
          [Op.and]: [betweenCreatedAt(start, end)]
        }
      });

      activity7d.push({
        date: start.toISOString().substring(0, 10),
        count
      });
    }

    // ===============================================================
    // 4. CHART: LEADS LAST 7 DAYS
    // ===============================================================

    const leads7d: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = daysAgo(i);
      const end = daysAgo(i - 1);

      const count = await Lead.count({
        where: {
          assigned_to: userId,
          is_deleted: false,
          [Op.and]: [betweenCreatedAt(start, end)]
        }
      });

      leads7d.push({
        date: start.toISOString().substring(0, 10),
        count
      });
    }

    // ===============================================================
    // 5. CHART: REVENUE 30 DAYS
    // ===============================================================

    const revenue30d: { date: string; total: number }[] = [];
    for (let i = 30; i >= 1; i--) {
      const d = daysAgo(i);

      const next = new Date(d);
      next.setDate(d.getDate() + 1);

      const result = await Opportunity.findOne({
        attributes: [[fn("SUM", col("expected_value")), "total"]],
        where: {
          owner_id: userId,
          stage: "won",
          is_deleted: false,
          [Op.and]: [betweenCreatedAt(d, next)]
        },
        raw: true
      }) as unknown as { total: number | null };

      revenue30d.push({
        date: d.toISOString().substring(0, 10),
        total: Number(result.total ?? 0)
      });
    }

    // ===============================================================
    // 6. RECENT ITEMS
    // ===============================================================

    const recentActivities = await Activity.findAll({
      where: { owner_id: userId, is_deleted: false },
      limit: 10,
      order: [["created_at", "DESC"]]
    });

    const recentLeads = await Lead.findAll({
      where: { assigned_to: userId, is_deleted: false },
      limit: 10,
      order: [["created_at", "DESC"]]
    });

    const recentOpps = await Opportunity.findAll({
      where: { owner_id: userId, is_deleted: false },
      limit: 10,
      order: [["created_at", "DESC"]]
    });

    // ===============================================================
    // RETURN FULL DASHBOARD DATA
    // ===============================================================

    return res.json({
      success: true,
      data: {
        summary: {
          totalLeads,
          contactedLeads,
          newLeadsToday,
          qualifiedLeads,
          totalOpp,
          wonOpp,
          lostOpp,
          winRate,
          totalRevenue,
          activitiesToday: {
            totalActivitiesToday,
            callsToday,
            emailsToday,
            meetingsToday,
            tasksToday
          }
        },

        pipeline,

        charts: {
          activity7d,
          leads7d,
          revenue30d
        },

        recent: {
          leads: recentLeads,
          opportunities: recentOpps,
          activities: recentActivities
        }
      }
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    return res.status(500).json({ success: false, message: msg });
  }
}