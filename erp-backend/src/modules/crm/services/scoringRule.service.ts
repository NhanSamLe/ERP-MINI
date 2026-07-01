import { ScoringRule } from "../models/scoringRule.model";
import { Lead } from "../models/lead.model";
import { Activity } from "../models/activity.model";
import { CallActivity } from "../models/callActivity.model";
import { EmailActivity } from "../models/emailActivity.model";

type ScoreGrade = "cold" | "warm" | "hot";
type SignalType = "text" | "number" | "boolean" | "select" | "multi_select";
type ScoreCategory = "fit" | "intent" | "engagement" | "risk" | "data_quality";

type ScoreReason = {
  rule_id: number;
  rule_name: string;
  field: string;
  field_label?: string;
  category?: ScoreCategory;
  operator: string;
  value: string | null;
  actual: unknown;
  score: number;
};

type ScoringSignal = {
  key: string;
  label: string;
  category: ScoreCategory;
  type: SignalType;
  operators: string[];
  valueRequired: boolean;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
};

const OPERATOR_LABELS: Record<string, string> = {
  equals: "Bằng",
  not_equals: "Không bằng",
  contains: "Chứa",
  greater_than: "Lớn hơn",
  less_than: "Nhỏ hơn",
  greater_than_or_equal: "Lớn hơn hoặc bằng",
  less_than_or_equal: "Nhỏ hơn hoặc bằng",
  is_true: "Là có",
  is_false: "Là không",
  not_empty: "Có dữ liệu",
  empty: "Trống",
  in: "Nằm trong danh sách",
};

const VALUELESS_OPERATORS = new Set(["is_true", "is_false", "not_empty", "empty"]);
const TEXT_OPERATORS = ["equals", "not_equals", "contains", "not_empty", "empty", "in"];
const NUMBER_OPERATORS = ["equals", "not_equals", "greater_than", "less_than", "greater_than_or_equal", "less_than_or_equal"];
const BOOLEAN_OPERATORS = ["is_true", "is_false"];
const SELECT_OPERATORS = ["equals", "not_equals", "in", "not_empty", "empty"];

const SCORING_SIGNALS: ScoringSignal[] = [
  { key: "phone", label: "Số điện thoại", category: "data_quality", type: "text", operators: ["not_empty", "empty"], valueRequired: false },
  { key: "email", label: "Email", category: "data_quality", type: "text", operators: ["not_empty", "empty"], valueRequired: false },
  { key: "source", label: "Nguồn dạng văn bản", category: "fit", type: "text", operators: TEXT_OPERATORS, valueRequired: true },
  { key: "source_id", label: "Nguồn khách hàng tiềm năng", category: "fit", type: "multi_select", operators: SELECT_OPERATORS, valueRequired: true, helpText: "Nhập ID nguồn; nhiều giá trị phân tách bằng dấu phẩy." },
  { key: "industry", label: "Ngành nghề", category: "fit", type: "text", operators: TEXT_OPERATORS, valueRequired: true },
  { key: "company_size", label: "Quy mô công ty", category: "fit", type: "select", operators: SELECT_OPERATORS, valueRequired: true, options: [
    { value: "1-10", label: "1-10" },
    { value: "11-50", label: "11-50" },
    { value: "50-200", label: "50-200" },
    { value: "200-500", label: "200-500" },
    { value: "500+", label: "500+" },
  ] },
  { key: "annual_revenue", label: "Doanh thu năm", category: "fit", type: "number", operators: NUMBER_OPERATORS, valueRequired: true },
  { key: "has_budget", label: "Có ngân sách", category: "intent", type: "boolean", operators: BOOLEAN_OPERATORS, valueRequired: false },
  { key: "ready_to_buy", label: "Sẵn sàng mua", category: "intent", type: "boolean", operators: BOOLEAN_OPERATORS, valueRequired: false },
  { key: "expected_timeline", label: "Thời gian mua dự kiến", category: "intent", type: "select", operators: SELECT_OPERATORS, valueRequired: true, options: [
    { value: "this_week", label: "Tuần này" },
    { value: "this_month", label: "Tháng này" },
    { value: "next_quarter", label: "Quý tới" },
  ] },
  { key: "activity.total_count", label: "Tổng số hoạt động", category: "engagement", type: "number", operators: NUMBER_OPERATORS, valueRequired: true },
  { key: "activity.completed_count", label: "Số hoạt động đã hoàn thành", category: "engagement", type: "number", operators: NUMBER_OPERATORS, valueRequired: true },
  { key: "activity.cancelled_count", label: "Số hoạt động đã hủy", category: "risk", type: "number", operators: NUMBER_OPERATORS, valueRequired: true },
  { key: "activity.call.connected_count", label: "Số cuộc gọi kết nối thành công", category: "engagement", type: "number", operators: NUMBER_OPERATORS, valueRequired: true },
  { key: "activity.call.no_answer_count", label: "Số cuộc gọi không nghe máy", category: "risk", type: "number", operators: NUMBER_OPERATORS, valueRequired: true },
  { key: "activity.email.replied_count", label: "Số email phản hồi/inbound", category: "engagement", type: "number", operators: NUMBER_OPERATORS, valueRequired: true },
  { key: "activity.email.sent_count", label: "Số email đã gửi", category: "engagement", type: "number", operators: NUMBER_OPERATORS, valueRequired: true },
  { key: "activity.meeting.count", label: "Số cuộc hẹn/meeting", category: "engagement", type: "number", operators: NUMBER_OPERATORS, valueRequired: true },
  { key: "activity.meeting.completed_count", label: "Số meeting đã hoàn thành", category: "engagement", type: "number", operators: NUMBER_OPERATORS, valueRequired: true },
  { key: "activity.task.overdue_count", label: "Số công việc quá hạn", category: "risk", type: "number", operators: NUMBER_OPERATORS, valueRequired: true },
  { key: "no_contact_after_hours", label: "Số giờ chưa liên hệ", category: "risk", type: "number", operators: NUMBER_OPERATORS, valueRequired: true },
  { key: "last_activity_days_ago", label: "Số ngày từ hoạt động gần nhất", category: "risk", type: "number", operators: NUMBER_OPERATORS, valueRequired: true },
];

const SIGNAL_BY_KEY = SCORING_SIGNALS.reduce<Record<string, ScoringSignal>>((acc, signal) => {
  acc[signal.key] = signal;
  return acc;
}, {});

const ACTIVITY_INCLUDE = [
  { model: CallActivity, as: "call" },
  { model: EmailActivity, as: "email" },
];

const getAllRules = async () => {
  return await ScoringRule.findAll({ order: [["score", "DESC"], ["id", "ASC"]] });
};

const createRule = async (data: any) => {
  const payload = normalizeRulePayload(data);
  return await ScoringRule.create({ ...payload, is_active: data.is_active ?? true });
};

const updateRule = async (id: number, data: Partial<any>) => {
  const rule = await ScoringRule.findByPk(id);
  if (!rule) throw new Error("Không tìm thấy quy tắc chấm điểm");
  const payload = normalizeRulePayload({ ...rule.toJSON(), ...data });
  return await rule.update({ ...payload, is_active: data.is_active ?? rule.is_active });
};

const deleteRule = async (id: number) => {
  const rule = await ScoringRule.findByPk(id);
  if (!rule) throw new Error("Không tìm thấy quy tắc chấm điểm");
  await rule.destroy();
  return true;
};

function gradeFromScore(score: number): ScoreGrade {
  if (score >= 75) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
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

function getSignal(field: string) {
  return SIGNAL_BY_KEY[field];
}

function normalizeRulePayload(data: any) {
  const field = String(data.field || "").trim();
  const signal = getSignal(field);
  if (!signal) {
    throw new Error(`Tín hiệu chấm điểm không hợp lệ: ${field}`);
  }

  const operator = String(data.operator || "").trim();
  if (!signal.operators.includes(operator)) {
    throw new Error(`Điều kiện "${operator}" không phù hợp với tín hiệu "${signal.label}"`);
  }

  let value = data.value === undefined || data.value === null ? null : String(data.value).trim();
  if (VALUELESS_OPERATORS.has(operator)) {
    value = null;
  } else if (signal.valueRequired && !value) {
    throw new Error(`Tín hiệu "${signal.label}" cần giá trị so sánh`);
  }

  if (value && signal.type === "number" && Number.isNaN(Number(value))) {
    throw new Error(`Giá trị của "${signal.label}" phải là số`);
  }

  if (value && ["select", "multi_select"].includes(signal.type) && signal.options?.length && operator !== "in") {
    const allowed = new Set(signal.options.map((option) => option.value.toLowerCase()));
    if (!allowed.has(value.toLowerCase())) {
      throw new Error(`Giá trị "${value}" không nằm trong danh sách hợp lệ của "${signal.label}"`);
    }
  }

  const score = Number(data.score);
  if (!Number.isFinite(score)) throw new Error("Điểm cộng/trừ phải là số");
  if (Math.abs(score) > 100) throw new Error("Mỗi quy tắc chỉ nên cộng/trừ trong khoảng -100 đến 100 điểm");

  return {
    name: String(data.name || "").trim(),
    field,
    operator,
    value,
    score,
  };
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
    const signal = getSignal(rule.field);
    if (!signal || !signal.operators.includes(rule.operator)) continue;
    const actual = getRuleActualValue(lead, activityMetrics, rule.field);
    if (matchRule(actual, rule.operator, rule.value)) {
      const ruleScore = Number(rule.score || 0);
      score += ruleScore;
      reasons.push({
        rule_id: Number(rule.id),
        rule_name: rule.name,
        field: rule.field,
        field_label: signal.label,
        category: signal.category,
        operator: rule.operator,
        value: rule.value,
        actual: normalize(actual),
        score: ruleScore,
      });
    }
  }

  const finalScore = clampScore(score);
  const grade = gradeFromScore(finalScore);
  await lead.update({
    lead_score: finalScore,
    score_grade: grade,
    score_reasons: reasons,
    last_scored_at: new Date(),
  });

  return { score: finalScore, raw_score: score, grade, reasons, recommendation: buildRecommendation(lead, finalScore, reasons) };
};

export const recalculateLeadsForRule = async () => {
  const leads = await Lead.findAll({ where: { is_deleted: false }, attributes: ["id"] });
  for (const lead of leads) {
    await calculateLeadScore(lead.id);
  }
  return leads.length;
};

export const getScoringSignals = async () => ({
  signals: SCORING_SIGNALS,
  operators: Object.entries(OPERATOR_LABELS).map(([value, label]) => ({ value, label })),
  grades: [
    { grade: "hot", min: 75, max: 100, label: "Hot", recommendation: "Ưu tiên liên hệ ngay và cân nhắc tạo Cơ hội hoặc Báo giá." },
    { grade: "warm", min: 40, max: 74, label: "Warm", recommendation: "Tiếp tục chăm sóc và bổ sung thông tin BANT." },
    { grade: "cold", min: 0, max: 39, label: "Cold", recommendation: "Bổ sung dữ liệu liên hệ hoặc nuôi dưỡng thêm trước khi ưu tiên." },
  ],
});

export const previewScoringRule = async (leadId: number, data: any) => {
  const payload = normalizeRulePayload(data);
  const lead = await Lead.findByPk(leadId) as any;
  if (!lead || lead.is_deleted) throw new Error("Không tìm thấy khách hàng tiềm năng");

  const signal = getSignal(payload.field)!;
  const activityMetrics = await buildActivityMetrics(lead);
  const actual = getRuleActualValue(lead, activityMetrics, payload.field);
  const matched = matchRule(actual, payload.operator, payload.value);

  return {
    matched,
    signal: {
      key: signal.key,
      label: signal.label,
      category: signal.category,
      type: signal.type,
    },
    operator: payload.operator,
    operator_label: OPERATOR_LABELS[payload.operator] || payload.operator,
    expected_value: payload.value,
    actual_value: normalize(actual),
    score_delta: matched ? payload.score : 0,
    message: matched
      ? `Quy tắc phù hợp với khách hàng tiềm năng này và sẽ ${payload.score >= 0 ? "cộng" : "trừ"} ${Math.abs(payload.score)} điểm.`
      : "Quy tắc không phù hợp với khách hàng tiềm năng này nên không làm thay đổi điểm.",
  };
};

function buildRecommendation(lead: Lead, score: number, reasons: ScoreReason[]) {
  const matchedFields = new Set(reasons.map((reason) => reason.field));
  if (score >= 75) {
    if (!lead.contacted_at) return "Khách hàng tiềm năng mức Hot: cần liên hệ trong vòng 2 giờ.";
    if (matchedFields.has("activity.meeting.completed_count")) return "Khách hàng tiềm năng mức Hot: có thể tạo Cơ hội hoặc Báo giá nếu nhu cầu đã rõ.";
    return "Khách hàng tiềm năng mức Hot: ưu tiên theo dõi và chốt bước tiếp theo trong ngày.";
  }
  if (score >= 40) {
    if (!lead.has_budget) return "Khách hàng tiềm năng mức Warm: cần xác minh ngân sách.";
    if (!lead.ready_to_buy) return "Khách hàng tiềm năng mức Warm: cần làm rõ mức độ sẵn sàng mua.";
    return "Khách hàng tiềm năng mức Warm: tiếp tục chăm sóc và thống nhất bước tiếp theo.";
  }
  if (!lead.phone && !lead.email) return "Khách hàng tiềm năng mức Cold: cần bổ sung thông tin liên hệ trước.";
  return "Khách hàng tiềm năng mức Cold: tiếp tục nuôi dưỡng hoặc thu thập thêm thông tin.";
}

export { getAllRules, createRule, updateRule, deleteRule };
