import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  updateLeadBasic,
  updateLeadEvaluation,
  convertLead,
  markLeadLost,
  reopenLead,
  deleteLead,
  fetchAllLeads,
  fetchLeadById,
} from "../store/lead/lead.thunks";
import * as activityService from "../service/activity.service";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import { ActionConfirmModal } from "@/components/common";
import { CompactTimeline } from "../components/TimelineCard";
import InfoItem from "../components/InfoItem";
import ActivityBoard from "../components/ActivityBoard";
import StatCards from "../components/StatCards";
import { Lead, UpdateLeadBasicDto, UpdateLeadEvaluationDto } from "../dto/lead.dto";
import { Opportunity } from "../dto/opportunity.dto";
import { Activity, TimelineEvent } from "../dto/activity.dto";
import {
  ArrowLeft, Edit2, Check, X, Trash2, RefreshCw,
  TrendingUp, User, ChevronRight,
} from "lucide-react";

export default function LeadDetailPage() {
  const { id } = useParams();
  const leadId = Number(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const leadState = useAppSelector((s) => s.lead);
  const currentLead = leadState?.currentLead;
  const allLeads = leadState?.allLeads ?? [];

  const lead: Lead | undefined =
    currentLead?.id === leadId ? currentLead : allLeads.find((l) => l?.id === leadId);

  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);
  const [basicEdit, setBasicEdit] = useState(false);
  const [evalEdit, setEvalEdit] = useState(false);

  const [basicForm, setBasicForm] = useState<UpdateLeadBasicDto>({
    name: "", email: "", phone: "", source: "", company_name: "", job_title: "", industry: "", company_size: "", annual_revenue: null,
  });

  const [evalForm, setEvalForm] = useState<UpdateLeadEvaluationDto>({
    leadId, has_budget: undefined, ready_to_buy: undefined, expected_timeline: "", notes: "",
  });

  const [activities, setActivities] = useState<Activity[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  // ── Modals ──
  const [showDelete, setShowDelete] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [showReopen, setShowReopen] = useState(false);
  const [showLost, setShowLost] = useState(false);
  const [lostReason, setLostReason] = useState("");

  const loadActivities = async () => {
    try {
      const res = await activityService.getActivitiesFor("lead", leadId);
      setActivities(res);
    } catch { /* ignore */ }
  };

  const loadTimeline = async () => {
    try {
      const res = await activityService.getTimeline("lead", leadId);
      setTimeline(res);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    dispatch(fetchAllLeads());
    if (leadId) dispatch(fetchLeadById(leadId));
  }, [dispatch, leadId]);

  useEffect(() => {
    if (!lead) return;
    setBasicForm({
      name: lead.name,
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      source: lead.source ?? "",
      company_name: lead.company_name ?? "",
      job_title: lead.job_title ?? "",
      industry: lead.industry ?? "",
      company_size: lead.company_size ?? "",
      annual_revenue: lead.annual_revenue ?? null,
    });
    setEvalForm({
      leadId,
      has_budget: lead.has_budget,
      ready_to_buy: lead.ready_to_buy,
      expected_timeline: lead.expected_timeline ?? "",
      notes: "",
    });
    loadActivities();
    loadTimeline();
  }, [lead]);

  if (!lead) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-600 text-sm">Đang tải...</p>
      </div>
    );
  }

  const handleSaveBasic = async () => {
    try {
      await dispatch(updateLeadBasic({ leadId, data: basicForm })).unwrap();
      setAlert({ type: "success", message: "Đã cập nhật thông tin" });
      setBasicEdit(false);
    } catch {
      setAlert({ type: "error", message: "Cập nhật thất bại" });
    }
  };

  const handleSaveEval = async () => {
    try {
      await dispatch(updateLeadEvaluation({ leadId, data: evalForm })).unwrap();
      setAlert({ type: "success", message: "Đã lưu đánh giá" });
      setEvalEdit(false);
    } catch {
      setAlert({ type: "error", message: "Lưu đánh giá thất bại" });
    }
  };

  const handleConvert = async () => {
    try {
      const result = await dispatch(convertLead(leadId)).unwrap();
      const customerId = result?.customer?.id;
      setAlert({ type: "success", message: "Đã chuyển đổi thành Customer" });
      setShowConvert(false);
      setTimeout(() => {
        if (customerId) {
          navigate(`/crm/opportunities/create?related_type=customer&related_id=${customerId}`);
        } else {
          navigate("/crm/opportunities/create");
        }
      }, 600);
    } catch (error: any) {
      setAlert({ type: "error", message: typeof error === "string" ? error : "Chuyển đổi thất bại" });
    }
  };

  const handleMarkLost = async () => {
    if (!lostReason.trim()) return;
    try {
      await dispatch(markLeadLost({ leadId, reason: lostReason })).unwrap();
      setAlert({ type: "success", message: "Đã đánh dấu thua" });
      setShowLost(false);
      setLostReason("");
    } catch {
      setAlert({ type: "error", message: "Thao tác thất bại" });
    }
  };

  const handleReopen = async () => {
    try {
      await dispatch(reopenLead(leadId)).unwrap();
      setAlert({ type: "success", message: "Đã mở lại Lead" });
      setShowReopen(false);
    } catch {
      setAlert({ type: "error", message: "Thao tác thất bại" });
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteLead(leadId)).unwrap();
      navigate("/crm/leads");
    } catch {
      setAlert({ type: "error", message: "Xóa thất bại" });
    }
  };

  // Activity groups
  const openActivities = activities.filter((a) => a.status === "pending" || a.status === "in_progress");
  const closedActivities = activities.filter((a) => a.status === "completed" || a.status === "cancelled");
  const getActivityUrl = (a: Activity) => `/crm/activities/${a.activity_type}/${a.id}`;

  const opportunities: Opportunity[] = Array.isArray(lead?.opportunities) ? lead.opportunities : [];
  const scoreReasons = Array.isArray(lead.score_reasons) ? lead.score_reasons : [];
  const fmtDateTime = (value?: string | Date | null) =>
    value ? new Date(value).toLocaleString("vi-VN") : "—";
  const fmtMoney = (value?: number | null) =>
    value == null ? "—" : Number(value).toLocaleString("vi-VN");
  const scoreGradeLabel: Record<string, string> = { cold: "Cold", warm: "Warm", hot: "Hot" };
  const scoreGradeClass: Record<string, string> = {
    cold: "bg-slate-100 text-slate-700",
    warm: "bg-amber-100 text-amber-700",
    hot: "bg-red-100 text-red-700",
  };
  const leadRecommendation = (() => {
    const score = lead.lead_score ?? 0;
    const matchedFields = new Set(scoreReasons.map((reason) => reason.field));
    if (score >= 75) {
      if (!lead.contacted_at) return "Khuyến nghị: đây là Lead mức Hot, cần liên hệ trong vòng 2 giờ.";
      if (matchedFields.has("activity.meeting.completed_count")) return "Khuyến nghị: meeting đã hoàn thành, có thể tạo Cơ hội hoặc Báo giá nếu nhu cầu đã rõ.";
      return "Khuyến nghị: ưu tiên theo dõi trong ngày và thống nhất bước tiếp theo với khách hàng.";
    }
    if (score >= 40) {
      if (!lead.has_budget) return "Khuyến nghị: cần xác minh ngân sách để đánh giá mức độ ưu tiên chính xác hơn.";
      if (!lead.ready_to_buy) return "Khuyến nghị: cần làm rõ thời điểm mua và mức độ sẵn sàng ra quyết định.";
      return "Khuyến nghị: tiếp tục chăm sóc và lên lịch tương tác tiếp theo.";
    }
    if (!lead.phone && !lead.email) return "Khuyến nghị: cần bổ sung thông tin liên hệ trước khi đưa vào danh sách ưu tiên.";
    return "Khuyến nghị: tiếp tục nuôi dưỡng hoặc thu thập thêm thông tin trước khi đánh giá đủ điều kiện.";
  })();

  // Early return if lead not loaded yet
  if (!lead) {
    return (
      <div className="page-container">
        <div className="erp-card">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Đang tải thông tin Lead...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="erp-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">{lead.name}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Lead #{leadId}</p>
            </div>
            {typeof lead.lead_score === "number" && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                Điểm: {lead.lead_score}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {lead.stage === "new" && (
              <>
                <Button variant="primary" size="sm" leftIcon={<TrendingUp className="w-3.5 h-3.5" />}
                  onClick={() => setShowConvert(true)}>
                  Chuyển đổi
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowLost(true)}>
                  Đánh dấu thua
                </Button>
              </>
            )}
            {lead.stage === "lost" && (
              <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={() => setShowReopen(true)}>
                Mở lại
              </Button>
            )}
            <Button variant="danger" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setShowDelete(true)}>
              Xóa
            </Button>
          </div>
        </div>
      </div>

      {/* Alert */}
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Main 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Left 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Thông tin cơ bản</h2>
              <div className="ml-auto">
                {!basicEdit ? (
                  <button onClick={() => setBasicEdit(true)} className="p-1.5 hover:bg-gray-100 rounded-md transition">
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={handleSaveBasic} className="p-1.5 hover:bg-green-50 rounded-md transition">
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button onClick={() => setBasicEdit(false)} className="p-1.5 hover:bg-red-50 rounded-md transition">
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              {!basicEdit ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <InfoItem label="Email" value={lead.email || "—"} />
                  <InfoItem label="SĐT" value={lead.phone || "—"} />
                  <InfoItem label="Nguồn" value={lead.leadSource?.name || lead.source || "—"} />
                  <InfoItem label="Công ty" value={lead.company_name || "—"} />
                  <InfoItem label="Chức vụ" value={lead.job_title || "—"} />
                  <InfoItem label="Ngành" value={lead.industry || "—"} />
                  <InfoItem label="Quy mô" value={lead.company_size || "—"} />
                  <InfoItem label="Doanh thu năm" value={fmtMoney(lead.annual_revenue)} />
                  <InfoItem label="Chi nhánh" value={lead.branch_id ? `#${lead.branch_id}` : "—"} />
                  <InfoItem label="Liên hệ lần đầu" value={fmtDateTime(lead.contacted_at)} />
                  <InfoItem label="Hoạt động gần nhất" value={fmtDateTime(lead.last_activity_date)} />
                  <InfoItem label="Qualified lúc" value={fmtDateTime(lead.qualified_at)} />
                  <InfoItem label="Qualified bởi" value={lead.qualified_by ? `#${lead.qualified_by}` : "—"} />
                  <InfoItem label="Ngày tạo" value={fmtDateTime(lead.created_at)} />
                  <InfoItem label="Cập nhật" value={fmtDateTime(lead.updated_at)} />
                </div>
              ) : (
                <div className="space-y-4">
                  <FormInput label="Tên" value={basicForm.name ?? ""} onChange={(v) => setBasicForm({ ...basicForm, name: v })} />
                  <FormInput label="Email" value={basicForm.email ?? ""} onChange={(v) => setBasicForm({ ...basicForm, email: v })} />
                  <FormInput label="SĐT" value={basicForm.phone ?? ""} onChange={(v) => setBasicForm({ ...basicForm, phone: v })} />
                  <FormInput label="Nguồn" value={basicForm.source ?? ""} onChange={(v) => setBasicForm({ ...basicForm, source: v })} />
                  <FormInput label="Công ty" value={basicForm.company_name ?? ""} onChange={(v) => setBasicForm({ ...basicForm, company_name: v })} />
                  <FormInput label="Chức vụ" value={basicForm.job_title ?? ""} onChange={(v) => setBasicForm({ ...basicForm, job_title: v })} />
                  <FormInput label="Ngành" value={basicForm.industry ?? ""} onChange={(v) => setBasicForm({ ...basicForm, industry: v })} />
                  <FormInput label="Quy mô" value={basicForm.company_size ?? ""} onChange={(v) => setBasicForm({ ...basicForm, company_size: v })} />
                  <FormInput label="Doanh thu năm" type="number" value={basicForm.annual_revenue?.toString() ?? ""} onChange={(v) => setBasicForm({ ...basicForm, annual_revenue: v ? Number(v) : null })} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evaluation */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Đánh giá</h2>
              <div className="ml-auto">
                {!evalEdit ? (
                  <button onClick={() => setEvalEdit(true)} className="p-1.5 hover:bg-gray-100 rounded-md transition">
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={handleSaveEval} className="p-1.5 hover:bg-green-50 rounded-md transition">
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button onClick={() => setEvalEdit(false)} className="p-1.5 hover:bg-red-50 rounded-md transition">
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              {!evalEdit ? (
                <div className="grid grid-cols-3 gap-6">
                  <InfoItem label="Ngân sách" value={
                    lead.has_budget == null ? "—" : lead.has_budget ? "Có" : "Không"
                  } />
                  <InfoItem label="Sẵn sàng mua" value={
                    lead.ready_to_buy == null ? "—" : lead.ready_to_buy ? "Có" : "Không"
                  } />
                  <InfoItem label="Thời gian dự kiến" value={lead.expected_timeline || "—"} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Ngân sách</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      value={evalForm.has_budget === undefined ? "" : evalForm.has_budget ? "true" : "false"}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEvalForm({ ...evalForm, has_budget: v === "" ? undefined : v === "true" });
                      }}
                    >
                      <option value="">Không xác định</option>
                      <option value="true">Có</option>
                      <option value="false">Không</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Sẵn sàng mua</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      value={evalForm.ready_to_buy === undefined ? "" : evalForm.ready_to_buy ? "true" : "false"}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEvalForm({ ...evalForm, ready_to_buy: v === "" ? undefined : v === "true" });
                      }}
                    >
                      <option value="">Không xác định</option>
                      <option value="true">Có</option>
                      <option value="false">Không</option>
                    </select>
                  </div>
                  <FormInput label="Thời gian dự kiến" value={evalForm.expected_timeline ?? ""}
                    onChange={(v) => setEvalForm({ ...evalForm, expected_timeline: v })} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activities */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 px-1">Hoạt động</h2>
            <StatCards activities={activities} />
            <div className="grid grid-cols-2 gap-4">
              <ActivityBoard title="Open Activities" activities={openActivities} onClick={(a) => navigate(getActivityUrl(a))} />
              <ActivityBoard title="Active Tasks" activities={openActivities.filter((a) => a.activity_type === "task")} onClick={(a) => navigate(getActivityUrl(a))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ActivityBoard title="Completed" activities={closedActivities.filter((a) => a.status === "completed")} onClick={(a) => navigate(getActivityUrl(a))} />
              <ActivityBoard title="Cancelled" activities={closedActivities.filter((a) => a.status === "cancelled")} onClick={(a) => navigate(getActivityUrl(a))} />
            </div>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <CompactTimeline items={timeline} />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Score */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Lead Score</h2>
              {lead.score_grade && (
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${scoreGradeClass[lead.score_grade]}`}>
                  {scoreGradeLabel[lead.score_grade]}
                </span>
              )}
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">{lead.lead_score ?? 0}</span>
                <span className="text-sm text-gray-400 mb-1">điểm</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Tính lần cuối: {fmtDateTime(lead.last_scored_at)}
              </p>
              <div className="mt-4 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                {leadRecommendation}
              </div>
              <div className="mt-4 space-y-2">
                {scoreReasons.length === 0 ? (
                  <p className="text-sm text-gray-400">Chưa có rule nào khớp với Lead này.</p>
                ) : (
                  scoreReasons.map((reason) => (
                    <div key={`${reason.rule_id}-${reason.field}`} className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-600 truncate">{reason.rule_name}</span>
                      <span className={reason.score >= 0 ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                        {reason.score >= 0 ? "+" : ""}{reason.score}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Owner */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Người phụ trách</h2>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              {lead.assignedUser ? (
                <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{lead.assignedUser.full_name}</p>
                    <p className="text-xs text-gray-500">{lead.assignedUser.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">Chưa phân công</p>
              )}
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Cơ hội</h2>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-3">
              {opportunities.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Chưa có cơ hội nào</p>
              ) : (
                opportunities.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => navigate(`/crm/opportunities/${o.id}`)}
                    className="w-full flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-sm text-gray-900">{o.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {o.currency?.code && o.currency.code !== "VND"
                          ? `${Number(o.expected_value || 0).toLocaleString("vi-VN")} ${o.currency.symbol || o.currency.code}`
                          : `${Number(o.expected_value || 0).toLocaleString("vi-VN")} VND`}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Lost reason */}
          {lead.stage === "lost" && lead.lost_reason && (
            <Card className="border-l-4 border-l-red-400">
              <CardHeader>
                <h2 className="text-sm font-semibold text-red-700">Lý do thua</h2>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.lost_reason}</p>
                {lead.lost_at && (
                  <p className="text-xs text-gray-400 mt-3">
                    Ngày thua: {new Date(lead.lost_at).toLocaleDateString("vi-VN")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <ActionConfirmModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Xóa Lead"
        description={`Bạn có chắc chắn muốn xóa "${lead.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
        onConfirm={handleDelete}
      />

      <ActionConfirmModal
        isOpen={showConvert}
        onClose={() => setShowConvert(false)}
        title="Chuyển đổi Lead"
        description={`Chuyển đổi "${lead.name}" thành Customer và tạo Opportunity?`}
        confirmText="Chuyển đổi"
        variant="primary"
        onConfirm={handleConvert}
      />

      <ActionConfirmModal
        isOpen={showReopen}
        onClose={() => setShowReopen(false)}
        title="Mở lại Lead"
        description={`Mở lại lead "${lead.name}" để tiếp tục theo dõi?`}
        confirmText="Mở lại"
        variant="primary"
        onConfirm={handleReopen}
      />

      <ActionConfirmModal
        isOpen={showLost}
        onClose={() => { setShowLost(false); setLostReason(""); }}
        title="Đánh dấu thua"
        description={
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Nhập lý do thua cho lead "{lead.name}":</p>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
              rows={3}
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="Nhập lý do..."
            />
          </div>
        }
        confirmText="Xác nhận"
        variant="danger"
        onConfirm={handleMarkLost}
      />
    </div>
  );
}
