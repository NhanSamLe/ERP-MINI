import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckSquare,
  Clock,
  Mail,
  Plus,
  Search,
  UserRound,
  Video,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/utils/time.helper";
import { getAllActivities } from "../service/activity.service";
import { Activity } from "../dto/activity.dto";
import { ActivityType } from "@/types/enum";

type DateFilter = "all" | "today" | "this_week" | "overdue";

interface ActivityTypeConfig {
  type: ActivityType;
  title: string;
  description: string;
  createLabel: string;
  createPath: string;
}

const ACTIVITY_CONFIGS: ActivityTypeConfig[] = [
  {
    type: "call",
    title: "Cuộc gọi",
    description: "Theo dõi các cuộc gọi đến và đi với khách hàng tiềm năng, cơ hội và khách hàng.",
    createLabel: "Ghi nhận cuộc gọi",
    createPath: "/crm/activities/call/create",
  },
  {
    type: "email",
    title: "Email",
    description: "Quản lý email gửi/nhận trong luồng chăm sóc bán hàng.",
    createLabel: "Soạn email",
    createPath: "/crm/activities/email/create",
  },
  {
    type: "meeting",
    title: "Cuộc họp",
    description: "Lịch họp, demo, tư vấn và các buổi trao đổi với khách hàng.",
    createLabel: "Lên lịch họp",
    createPath: "/crm/activities/meeting/create",
  },
  {
    type: "task",
    title: "Công việc",
    description: "Các việc cần làm tiếp theo để thúc đẩy khách hàng tiềm năng và cơ hội trong quy trình bán hàng.",
    createLabel: "Tạo công việc",
    createPath: "/crm/activities/task/create",
  },
];

const DATE_FILTERS: Array<{ value: DateFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "today", label: "Hôm nay" },
  { value: "this_week", label: "Tuần này" },
  { value: "overdue", label: "Quá hạn" },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Đang chờ",
  in_progress: "Đang xử lý",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  "Not Started": "Chưa bắt đầu",
  "In Progress": "Đang làm",
  Completed: "Hoàn tất",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

const inputClass =
  "h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500";

function getTypeConfig(type: ActivityType) {
  return ACTIVITY_CONFIGS.find((item) => item.type === type) || ACTIVITY_CONFIGS[0];
}

function getActivityIcon(type: ActivityType, activity?: Activity) {
  if (type === "call") {
    return activity?.call?.is_inbound ? (
      <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-blue-600" />
    );
  }
  if (type === "email") return <Mail className="h-4 w-4 text-sky-600" />;
  if (type === "meeting") return <Video className="h-4 w-4 text-violet-600" />;
  return <CheckSquare className="h-4 w-4 text-orange-600" />;
}

function getRelatedName(activity: Activity) {
  return activity.lead?.name || activity.opportunity?.name || activity.customer?.name || "-";
}

function getActivityTime(activity: Activity) {
  if (activity.activity_type === "meeting") return activity.meeting?.start_at || activity.due_at || activity.created_at;
  return activity.due_at || activity.created_at;
}

function getActivityStatus(activity: Activity) {
  if (activity.activity_type === "task") return activity.task?.status || "Not Started";
  return activity.status || (activity.done ? "completed" : "pending");
}

function getDetailLine(activity: Activity) {
  if (activity.activity_type === "call") {
    const direction = activity.call?.is_inbound ? "Gọi đến" : "Gọi đi";
    const fromTo = [activity.call?.call_from, activity.call?.call_to].filter(Boolean).join(" -> ");
    return fromTo ? `${direction}: ${fromTo}` : direction;
  }

  if (activity.activity_type === "email") {
    const direction = activity.email?.direction === "in" ? "Email nhận" : "Email gửi";
    const fromTo = [activity.email?.email_from, activity.email?.email_to].filter(Boolean).join(" -> ");
    return fromTo ? `${direction}: ${fromTo}` : direction;
  }

  if (activity.activity_type === "meeting") {
    return activity.meeting?.location || activity.meeting?.meeting_link || "Chưa có địa điểm/link họp";
  }

  return activity.notes || "Chưa có ghi chú";
}

function getDetailPath(activity: Activity) {
  return `/crm/activities/${activity.activity_type}/${activity.id}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isThisWeek(date: Date, now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}

function priorityClass(priority?: string | null) {
  if (priority === "high") return "bg-red-50 text-red-700 border-red-200";
  if (priority === "medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function statusClass(status: string) {
  if (status === "completed" || status === "Completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "in_progress" || status === "In Progress") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "cancelled") return "bg-gray-100 text-gray-600 border-gray-200";
  return "bg-orange-50 text-orange-700 border-orange-200";
}

export function ActivityListView({ type }: { type: ActivityType }) {
  const navigate = useNavigate();
  const config = getTypeConfig(type);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllActivities();
        if (mounted) setActivities(data.filter((activity) => activity.activity_type === type));
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || "Không thể tải danh sách hoạt động";
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [type]);

  const visibleActivities = useMemo(() => {
    const now = new Date();
    const query = search.trim().toLowerCase();

    return activities
      .filter((activity) => {
        if (!query) return true;
        const fields = [
          activity.subject,
          activity.notes,
          getRelatedName(activity),
          activity.owner?.full_name,
          getDetailLine(activity),
        ];
        return fields.filter(Boolean).some((field) => String(field).toLowerCase().includes(query));
      })
      .filter((activity) => {
        if (dateFilter === "all") return true;
        const rawDate = getActivityTime(activity);
        if (!rawDate) return false;
        const date = new Date(rawDate);
        if (dateFilter === "today") return isSameDay(date, now);
        if (dateFilter === "this_week") return isThisWeek(date, now);
        return date < now && getActivityStatus(activity) !== "completed" && getActivityStatus(activity) !== "Completed";
      })
      .filter((activity) => statusFilter === "all" || getActivityStatus(activity) === statusFilter)
      .sort((a, b) => {
        const aTime = getActivityTime(a) ? new Date(getActivityTime(a) as string).getTime() : 0;
        const bTime = getActivityTime(b) ? new Date(getActivityTime(b) as string).getTime() : 0;
        return bTime - aTime;
      });
  }, [activities, dateFilter, search, statusFilter]);

  const statusOptions = useMemo(() => {
    const values = Array.from(new Set(activities.map((activity) => getActivityStatus(activity)).filter(Boolean)));
    return values;
  }, [activities]);

  const completedCount = activities.filter((activity) => {
    const status = getActivityStatus(activity);
    return status === "completed" || status === "Completed";
  }).length;

  return (
    <div className="page-container">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="erp-card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                {getActivityIcon(type)}
              </span>
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-gray-900">{config.title}</h1>
                <p className="text-sm text-gray-500">{config.description}</p>
              </div>
            </div>

            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(config.createPath)}>
              {config.createLabel}
            </Button>
          </div>

          <div className="grid gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Tổng hoạt động</p>
              <p className="text-lg font-semibold text-gray-900">{activities.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Đã hoàn tất</p>
              <p className="text-lg font-semibold text-gray-900">{completedCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Đang hiển thị</p>
              <p className="text-lg font-semibold text-gray-900">{visibleActivities.length}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className={`${inputClass} w-full pl-9`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tiêu đề, đối tượng liên quan, người phụ trách..."
              />
            </div>

            <select className={inputClass} value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)}>
              {DATE_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>

            <select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status] || status}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="px-5 pb-4">
              <Alert type="error" message={error} />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-y border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Hoạt động</th>
                  <th className="px-4 py-3">Liên quan</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Người phụ trách</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ưu tiên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                      Đang tải hoạt động...
                    </td>
                  </tr>
                )}

                {!loading && visibleActivities.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                      Chưa có hoạt động phù hợp.
                    </td>
                  </tr>
                )}

                {!loading &&
                  visibleActivities.map((activity) => {
                    const status = getActivityStatus(activity);
                    return (
                      <tr
                        key={activity.id}
                        className="cursor-pointer bg-white transition-colors hover:bg-orange-50/40"
                        onClick={() => navigate(getDetailPath(activity))}
                      >
                        <td className="px-5 py-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-50">
                              {getActivityIcon(type, activity)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-gray-900">{activity.subject || "(Không có tiêu đề)"}</p>
                              <p className="truncate text-xs text-gray-500">{getDetailLine(activity)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-gray-700">
                            <UserRound className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{getRelatedName(activity)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-gray-700">
                            {type === "meeting" ? (
                              <CalendarDays className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                            <span>{formatDateTime(getActivityTime(activity) || null)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{activity.owner?.full_name || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(status)}`}>
                            {STATUS_LABELS[status] || status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {activity.priority ? (
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${priorityClass(activity.priority)}`}>
                              {PRIORITY_LABELS[activity.priority] || activity.priority}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
