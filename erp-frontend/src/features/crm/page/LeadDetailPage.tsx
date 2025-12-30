// ======================================================================
// 🔥 LEAD DETAIL PAGE – REDESIGNED UI
// ======================================================================

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  updateLeadBasic,
  updateLeadEvaluation,
  convertLead,
  markLeadLost,
  reopenLead,
  deleteLead,
  fetchAllLeads,
  fetchLeadById
} from "../store/lead/lead.thunks";

import * as activityService from "../service/activity.service";

import { FormInput } from "../../../components/ui/FormInput";
import { Button } from "../../../components/ui/buttonn";
import { Alert } from "../../../components/ui/Alert";
import { Card, CardHeader, CardContent } from "../../../components/ui/Card";
import { Separator } from "../../../components/ui/separator";
import { CompactTimeline } from "../components/TimelineCard";
import { Lead, UpdateLeadBasicDto, UpdateLeadEvaluationDto } from "../dto/lead.dto";
import { Opportunity } from "../dto/opportunity.dto";
import { Activity, TimelineEvent } from "../dto/activity.dto";

import {
  ArrowLeft,
  Edit2,
  Check,
  X,
  Trash2,
  RefreshCw,
  TrendingUp,
  Calendar,
  User,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface LocalAlert {
  type: "success" | "error" | "warning" | "info";
  message: React.ReactNode;
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const leadId = Number(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { currentLead, allLeads } = useAppSelector((s) => s.lead);

  // Ưu tiên dùng currentLead nếu id khớp (vì nó có full details như opportunities), nếu không thì tìm trong allLeads
  const lead: Lead | undefined = (currentLead?.id === leadId)
    ? currentLead
    : allLeads.find((l) => l.id === leadId);

  const [alert, setAlert] = useState<LocalAlert | null>(null);
  const [basicEdit, setBasicEdit] = useState(false);
  const [evalEdit, setEvalEdit] = useState(false);

  const [basicForm, setBasicForm] = useState<UpdateLeadBasicDto>({
    name: "",
    email: "",
    phone: "",
    source: "",
  });

  const [evalForm, setEvalForm] = useState<UpdateLeadEvaluationDto>({
    leadId,
    has_budget: undefined,
    ready_to_buy: undefined,
    expected_timeline: "",
    notes: "",
  });

  const [activities, setActivities] = useState<Activity[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const loadActivities = async () => {
    try {
      const res = await activityService.getActivitiesFor("lead", leadId);
      setActivities(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
      }
    }
  };
  const activityStats = activities.reduce(
    (acc, a) => {
      if (a.activity_type === "call") acc.call++;
      else if (a.activity_type === "email") acc.email++;
      else if (a.activity_type === "meeting") acc.meeting++;
      else if (a.activity_type === "task") acc.task++;
      return acc;
    },
    { call: 0, email: 0, meeting: 0, task: 0 }
  );
  const loadTimeline = async () => {
    try {
      const res = await activityService.getTimeline("lead", leadId);
      setTimeline(res);
    } catch (err: unknown) {
      if (err instanceof Error) console.error(err.message);
    }
  };

  useEffect(() => {
    // fetchAllLeads để có danh sách chung (nếu cần back lại list)
    dispatch(fetchAllLeads());
    // fetchLeadById để lấy chi tiết (bao gồm opportunities)
    if (leadId) {
      dispatch(fetchLeadById(leadId));
    }
  }, [dispatch, leadId]);

  useEffect(() => {
    if (!lead) return;

    setBasicForm({
      name: lead.name,
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      source: lead.source ?? "",
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Lead not found</p>
      </div>
    );
  }

  const handleSaveBasic = async () => {
    try {
      await dispatch(updateLeadBasic({ leadId, data: basicForm })).unwrap();
      setAlert({ type: "success", message: "Updated successfully" });
      setBasicEdit(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setAlert({ type: "error", message: msg });
    }
  };

  const handleSaveEval = async () => {
    try {
      await dispatch(updateLeadEvaluation({ leadId, data: evalForm })).unwrap();
      setAlert({ type: "success", message: "Evaluation saved" });
      setEvalEdit(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setAlert({ type: "error", message: msg });
    }
  };

  const handleMarkLost = async () => {
    const reason = prompt("Enter reason for marking as lost:");
    if (!reason) return;

    try {
      await dispatch(markLeadLost({ leadId, reason })).unwrap();
      setAlert({ type: "success", message: "Lead marked as Lost" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      setAlert({ type: "error", message: msg });
    }
  };

  const handleReopen = async () => {
    if (!confirm("Reopen this lead?")) return;

    try {
      await dispatch(reopenLead(leadId)).unwrap();
      setAlert({ type: "success", message: "Lead reopened" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      setAlert({ type: "error", message: msg });
    }
  };

  const handleConvert = async () => {
    if (!confirm("Convert this lead to a customer?")) return;

    try {
      await dispatch(convertLead(leadId)).unwrap();
      setAlert({ type: "success", message: "Converted to Customer. Creating Opportunity..." });
      setTimeout(() => navigate(`/crm/opportunities`), 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Convert failed";
      setAlert({ type: "error", message: msg });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this lead permanently?")) return;

    try {
      await dispatch(deleteLead(leadId)).unwrap();
      navigate("/crm/leads");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      setAlert({ type: "error", message: msg });
    }
  };

  const openActivities = activities.filter(
    (a) => a.status === "pending" || a.status === "in_progress"
  );

  const closedActivities = activities.filter(
    (a) => a.status === "completed" || a.status === "cancelled"
  );

  const getActivityUrl = (a: Activity) =>
    `/crm/activities/${a.activity_type}/${a.id}`;

  const opportunities: Opportunity[] = Array.isArray(lead.opportunities)
    ? lead.opportunities
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-orange-600 tracking-tight">{lead.name}</h1>
              <p className="text-sm text-gray-500 mt-1">Lead ID: {leadId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lead.stage === "new" && (
              <Button variant="default" onClick={handleConvert} className="gap-2">
                <TrendingUp className="w-4 h-4" /> Convert
              </Button>
            )}

            {lead.stage === "new" && (
              <Button variant="outline" onClick={handleMarkLost}>
                Mark Lost
              </Button>
            )}

            {lead.stage === "lost" && (
              <Button variant="outline" onClick={handleReopen} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Reopen
              </Button>
            )}

            <Button variant="destructive" onClick={handleDelete} className="gap-2">
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>

        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            {/* BASIC INFO */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Basic Information</h2>
                <div className="ml-auto">
                  {!basicEdit ? (
                    <button
                      onClick={() => setBasicEdit(true)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Edit2 className="w-5 h-5 text-gray-600" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handleSaveBasic} className="p-2 hover:bg-green-100 rounded-lg transition">
                        <Check className="w-5 h-5 text-green-600" />
                      </button>
                      <button onClick={() => setBasicEdit(false)} className="p-2 hover:bg-red-100 rounded-lg transition">
                        <X className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">

                {!basicEdit ? (
                  <div className="grid grid-cols-2 gap-6">
                    <InfoItem label="Email" value={lead.email ?? "-"} />
                    <InfoItem label="Phone" value={lead.phone ?? "-"} />
                    <InfoItem label="Source" value={lead.source ?? "-"} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FormInput label="Name" value={basicForm.name ?? ""}
                      onChange={(v) => setBasicForm({ ...basicForm, name: v })} />
                    <FormInput label="Email" value={basicForm.email ?? ""}
                      onChange={(v) => setBasicForm({ ...basicForm, email: v })} />
                    <FormInput label="Phone" value={basicForm.phone ?? ""}
                      onChange={(v) => setBasicForm({ ...basicForm, phone: v })} />
                    <FormInput label="Source" value={basicForm.source ?? ""}
                      onChange={(v) => setBasicForm({ ...basicForm, source: v })} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* EVALUATION */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Evaluation</h2>
                <div className="ml-auto">
                  {!evalEdit ? (
                    <button onClick={() => setEvalEdit(true)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <Edit2 className="w-5 h-5 text-gray-600" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handleSaveEval} className="p-2 hover:bg-green-100 rounded-lg transition">
                        <Check className="w-5 h-5 text-green-600" />
                      </button>
                      <button onClick={() => setEvalEdit(false)} className="p-2 hover:bg-red-100 rounded-lg transition">
                        <X className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                {!evalEdit ? (
                  <div className="grid grid-cols-3 gap-6">
                    <InfoItem label="Budget" value={
                      lead.has_budget == null ? "-" : lead.has_budget ? "✓ Yes" : "✗ No"
                    } />
                    <InfoItem label="Ready to Buy" value={
                      lead.ready_to_buy == null ? "-" : lead.ready_to_buy ? "✓ Yes" : "✗ No"
                    } />
                    <InfoItem label="Timeline" value={lead.expected_timeline ?? "-"} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <SelectField
                      label="Has Budget"
                      value={evalForm.has_budget}
                      onChange={(v) => setEvalForm({ ...evalForm, has_budget: v })}
                    />
                    <SelectField
                      label="Ready to Buy"
                      value={evalForm.ready_to_buy}
                      onChange={(v) => setEvalForm({ ...evalForm, ready_to_buy: v })}
                    />
                    <FormInput
                      label="Expected Timeline"
                      value={evalForm.expected_timeline ?? ""}
                      onChange={(v) => setEvalForm({ ...evalForm, expected_timeline: v })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ACTIVITIES - KANBAN STYLE */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold px-1">Activities</h2>
              <ActivityStatsRow stats={activityStats} />
              {/* Open Activities Row */}
              <div className="grid grid-cols-2 gap-4">
                <ActivityBoard title="Open Activities" activities={openActivities} onClick={(a) => navigate(getActivityUrl(a))} icon={<Clock className="w-4 h-4" />} />
                <ActivityBoard title="Active Tasks" activities={openActivities.filter(a => a.status === "in_progress")} onClick={(a) => navigate(getActivityUrl(a))} icon={<TrendingUp className="w-4 h-4" />} />
              </div>

              {/* Closed Activities Row */}
              <div className="grid grid-cols-2 gap-4">
                <ActivityBoard title="Completed" activities={closedActivities.filter(a => a.status === "completed")} onClick={(a) => navigate(getActivityUrl(a))} icon={<CheckCircle className="w-4 h-4 text-green-600" />} />
                <ActivityBoard title="Cancelled" activities={closedActivities.filter(a => a.status === "cancelled")} onClick={(a) => navigate(getActivityUrl(a))} icon={<XCircle className="w-4 h-4 text-red-600" />} />
              </div>
            </div>

            {/* TIMELINE */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Timeline</h2>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                <CompactTimeline items={timeline} />
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">

            {/* OWNER */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Assigned User</h2>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                {lead.assignedUser ? (
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{lead.assignedUser.full_name}</p>
                      <p className="text-sm text-gray-600">{lead.assignedUser.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6">Not assigned</p>
                )}
              </CardContent>
            </Card>

            {/* OPPORTUNITIES */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Opportunities</h2>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                {opportunities.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No opportunities yet.</p>
                ) : (
                  <div className="space-y-3">
                    {opportunities.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => navigate(`/crm/opportunities/${o.id}`)}
                        className="w-full flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition group"
                      >
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 group-hover:text-orange-600">{o.name}</p>
                          <p className="text-sm text-gray-600">
                            {o.expected_value?.toLocaleString("vi-VN")} ₫
                          </p>
                        </div>
                        <ChevronRight className="text-gray-400 group-hover:text-orange-400 transition" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* LOST INFO */}
            {lead.stage === "lost" && lead.lost_reason && (
              <Card>
                <CardHeader>
                  <h2 className="text-red-900 font-semibold">Lost Reason</h2>
                </CardHeader>
                <Separator />
                <CardContent className="pt-5 bg-red-50 rounded-b-xl">
                  <p className="text-red-700 font-medium">{lead.lost_reason}</p>
                  {lead.lost_at && (
                    <p className="text-xs text-red-600 mt-3">
                      Lost at: {new Date(lead.lost_at).toLocaleString("vi-VN")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// SUB COMPONENTS
// ======================================================================

function InfoItem({ label, value }: { label: string; value: string | number | React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean | undefined) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold mb-2 block text-gray-700">{label}</label>
      <select
        className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
        value={value === undefined ? "" : value ? "true" : "false"}
        onChange={(e) => {
          if (e.target.value === "") {
            onChange(undefined);
          } else {
            onChange(e.target.value === "true");
          }
        }}
      >
        <option value="">Unknown</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </div>
  );
}

function ActivityBoard({
  title,
  activities,
  onClick,
  icon,
}: {
  title: string;
  activities: Activity[];
  onClick: (a: Activity) => void;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-gray-700">
          {icon}
          <h3 className="font-semibold">{title}</h3>
        </div>
        <span className="ml-auto bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
          {activities.length}
        </span>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-3">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No activities</p>
        ) : (
          activities.map((a) => (
            <ActivityCardMini key={a.id} a={a} onClick={() => onClick(a)} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ActivityCardMini({
  a,
  onClick,
}: {
  a: Activity;
  onClick: () => void;
}) {
  const getActivityIcon = () => {
    switch (a.activity_type?.toLowerCase()) {
      case "call":
        return <span className="text-blue-600"></span>;
      case "email":
        return <span className="text-purple-600"></span>;
      case "meeting":
        return <span className="text-green-600"></span>;
      case "task":
        return <span className="text-orange-600"></span>;
      default:
        return <span className="text-gray-600"></span>;
    }
  };

  const getActivityTypeLabel = () => {
    return a.activity_type?.charAt(0).toUpperCase() + (a.activity_type?.slice(1) || "Activity");
  };

  return (
    <div
      onClick={onClick}
      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition group"
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="text-lg mt-0.5 flex-shrink-0">{getActivityIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase">{getActivityTypeLabel()}</p>
              <span
                className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${a.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : a.status === "cancelled"
                    ? "bg-red-100 text-red-700"
                    : a.status === "in_progress"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
              >
                {a.status}
              </span>
            </div>
            <p className="font-semibold text-gray-900 group-hover:text-orange-600 truncate text-sm mt-1">
              {a.subject ?? "(No subject)"}
            </p>
            {a.notes && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{a.notes}</p>
            )}
          </div>
        </div>
      </div>

      {a.due_at && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 ml-6">
          <Calendar className="w-3 h-3" />
          {new Date(a.due_at).toLocaleDateString("vi-VN")}
        </div>
      )}
    </div>
  );
}


function ActivityStatsRow({ stats }: { stats: { call: number; email: number; meeting: number; task: number } }) {
  return (
    <div className="grid grid-cols-4 gap-4 px-1 py-2">
      <StatsItem label="Calls" value={stats.call} color="text-blue-600" />
      <StatsItem label="Emails" value={stats.email} color="text-purple-600" />
      <StatsItem label="Meetings" value={stats.meeting} color="text-green-600" />
      <StatsItem label="Tasks" value={stats.task} color="text-orange-600" />
    </div>
  );
}

function StatsItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
      <span className={`font-bold ${color}`}>{value}</span>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}
