import { ScoringRule } from "../models/scoringRule.model";
import { Lead } from "../models/lead.model";
import { Activity } from "../models/activity.model";
import { CallActivity } from "../models/callActivity.model";
import { EmailActivity } from "../models/emailActivity.model";

type ScoreGrade = "cold" | "warm" | "hot";

type ScoreReason = {
  rule_id: number;
  rule_name: string;
  field: string;
  operator: string;
  value: string | null;
  actual: unknown;
  score: number;
};

const ACTIVITY_INCLUDE = [
  { model: CallActivity, as: "call" },
  { model: EmailActivity, as: "email" },
];

const getAllRules = async () => {
  return await ScoringRule.findAll({ order: [["score", "DESC"], ["id", "ASC"]] });
};

const createRule = async (data: any) => {
  return await ScoringRule.create({ ...data, is_active: data.is_active ?? true });
};

const updateRule = async (id: number, data: Partial<any>) => {
  const rule = await ScoringRule.findByPk(id);
  if (!rule) throw new Error("Scoring Rule not found");
  return await rule.update(data);
};

const deleteRule = async (id: number) => {
  const rule = await ScoringRule.findByPk(id);
  if (!rule) throw new Error("Scoring Rule not found");
  await rule.destroy();
  return true;
};

function gradeFromScore(score: number): ScoreGrade {
  if (score >= 80) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

function normalize(value: unknown) {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function isEmpty(value: unknown) {
  return value === undefined || value === null || String(value).trim() === "";
}

function compareNumber(actual: unknown, expected: string | null, fn: (a: number, b: number) => boolean) {
  const a = Number(actual);
  const b = Number(expected);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return fn(a, b);
}

function matchRule(actual: unknown, operator: string, expected: string | null) {
  const normalized = normalize(actual);
  const actualText = normalized === null ? "" : String(normalized).toLowerCase();
  const expectedText = expected === null ? "" : String(expected).toLowerCase();

  switch (operator) {
    case "equals":
      return actualText === expectedText;
    case "not_equals":
      return actualText !== expectedText;
    case "contains":
      return actualText.includes(expectedText);
    case "greater_than":
      return compareNumber(actual, expected, (a, b) => a > b);
    case "less_than":
      return compareNumber(actual, expected, (a, b) => a < b);
    case "greater_than_or_equal":
      return compareNumber(actual, expected, (a, b) => a >= b);
    case "less_than_or_equal":
      return compareNumber(actual, expected, (a, b) => a <= b);
    case "is_true":
      return actual === true || actualText === "true" || actualText === "1";
    case "is_false":
      return actual === false || actualText === "false" || actualText === "0";
    case "not_empty":
      return !isEmpty(actual);
    case "empty":
      return isEmpty(actual);
    case "in":
      return String(expected ?? "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
        .includes(actualText);
    default:
      return false;
  }
}

async function buildActivityMetrics(lead: Lead) {
  const activities = await Activity.findAll({
    where: { related_type: "lead", related_id: lead.id, is_deleted: false },
    include: ACTIVITY_INCLUDE,
  }) as any[];

  const now = new Date();
  const firstContactedAt = lead.contacted_at ? new Date(lead.contacted_at) : null;
  const createdAt = (lead as any).created_at || (lead as any).createdAt
    ? new Date((lead as any).created_at || (lead as any).createdAt)
    : null;

  const latestActivity = activities
    .map((a) => a.completed_at || a.updated_at || a.updatedAt || a.created_at || a.createdAt)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .sort((a, b) => b - a)[0];

  const noContactAfterHours =
    !firstContactedAt && createdAt
      ? Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
      : 0;

  return {
    "activity.total_count": activities.length,
    "activity.completed_count": activities.filter((a) => a.status === "completed").length,
    "activity.cancelled_count": activities.filter((a) => a.status === "cancelled").length,
    "activity.call.connected_count": activities.filter((a) => a.activity_type === "call" && a.call?.result === "connected").length,
    "activity.call.no_answer_count": activities.filter((a) => a.activity_type === "call" && a.call?.result === "no_answer").length,
    "activity.email.replied_count": activities.filter((a) => a.activity_type === "email" && a.email?.direction === "in").length,
    "activity.email.sent_count": activities.filter((a) => a.activity_type === "email" && a.email?.status === "sent").length,
    "activity.meeting.count": activities.filter((a) => a.activity_type === "meeting").length,
    "activity.meeting.completed_count": activities.filter((a) => a.activity_type === "meeting" && a.status === "completed").length,
    "activity.task.overdue_count": activities.filter((a) => a.activity_type === "task" && !a.done && a.due_at && new Date(a.due_at) < now).length,
    no_contact_after_hours: noContactAfterHours,
    last_activity_days_ago: latestActivity ? Math.floor((now.getTime() - latestActivity) / (1000 * 60 * 60 * 24)) : null,
  };
}

function getRuleActualValue(lead: any, activityMetrics: Record<string, unknown>, field: string) {
  if (Object.prototype.hasOwnProperty.call(activityMetrics, field)) return activityMetrics[field];
  return lead[field];
}

export const calculateLeadScore = async (leadId: number) => {
  const lead = await Lead.findByPk(leadId) as any;
  if (!lead || lead.is_deleted) return null;

  const rules = await ScoringRule.findAll({ where: { is_active: true }, order: [["id", "ASC"]] }) as any[];
  const activityMetrics = await buildActivityMetrics(lead);
  const reasons: ScoreReason[] = [];
  let score = 0;

  for (const rule of rules) {
    const actual = getRuleActualValue(lead, activityMetrics, rule.field);
    if (matchRule(actual, rule.operator, rule.value)) {
      const ruleScore = Number(rule.score || 0);
      score += ruleScore;
      reasons.push({
        rule_id: Number(rule.id),
        rule_name: rule.name,
        field: rule.field,
        operator: rule.operator,
        value: rule.value,
        actual: normalize(actual),
        score: ruleScore,
      });
    }
  }

  const grade = gradeFromScore(score);
  await lead.update({
    lead_score: score,
    score_grade: grade,
    score_reasons: reasons,
    last_scored_at: new Date(),
  });

  return { score, grade, reasons };
};

export const recalculateLeadsForRule = async () => {
  const leads = await Lead.findAll({ where: { is_deleted: false }, attributes: ["id"] });
  for (const lead of leads) {
    await calculateLeadScore(lead.id);
  }
  return leads.length;
};

export { getAllRules, createRule, updateRule, deleteRule };
