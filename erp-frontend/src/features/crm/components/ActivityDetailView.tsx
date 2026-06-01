import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle,
  CheckSquare,
  Clock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  PlayCircle,
  Send,
  Trash2,
  UserRound,
  Video,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/utils/time.helper";
import { ActivityType } from "@/types/enum";
import { Activity } from "../dto/activity.dto";
import {
  cancelCallActivity,
  cancelEmailActivity,
  cancelMeeting,
  completeMeeting,
  completeTask,
  deleteActivity,
  getActivityDetail,
  sendEmailForActivity,
  startTask,
} from "../service/activity.service";
import { RelatedInfoCard } from "./RelatedInfoCard";
import { OwnerInfoCard } from "./OwnerInfoCard";
import { ActivityMetaInfoCard } from "./ActivityMetaInfoCard";

const TYPE_META: Record<ActivityType, { label: string; listPath: string; editPrefix: string }> = {
  call: { label: "Cuộc gọi", listPath: "/crm/activities/calls", editPrefix: "/crm/activities/call" },
  email: { label: "Email", listPath: "/crm/activities/emails", editPrefix: "/crm/activities/email" },
  meeting: { label: "Cuộc họp", listPath: "/crm/activities/meetings", editPrefix: "/crm/activities/meeting" },
  task: { label: "Công việc", listPath: "/crm/activities/tasks", editPrefix: "/crm/activities/task" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Đang chờ",
  in_progress: "Đang xử lý",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  "Not Started": "Chưa bắt đầu",
  "In Progress": "Đang làm",
  Completed: "Hoàn tất",
};

function iconFor(type: ActivityType, detail?: Activity) {
  if (type === "call") {
    return detail?.call?.is_inbound ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />;
  }
  if (type === "email") return <Mail className="h-4 w-4" />;
  if (type === "meeting") return <Video className="h-4 w-4" />;
  return <CheckSquare className="h-4 w-4" />;
}

function getStatus(detail: Activity) {
  if (detail.activity_type === "task") return detail.task?.status || "Not Started";
  return detail.status || (detail.done ? "completed" : "pending");
}

function statusClass(status: string) {
  if (status === "completed" || status === "Completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "in_progress" || status === "In Progress") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "cancelled") return "bg-gray-100 text-gray-600 border-gray-200";
  return "bg-orange-50 text-orange-700 border-orange-200";
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="break-words text-sm font-medium text-gray-800">{value || "-"}</div>
      </div>
    </div>
  );
}

function DetailRows({ detail }: { detail: Activity }) {
  if (detail.activity_type === "call") {
    return (
      <>
        <InfoRow icon={<Phone className="h-4 w-4" />} label="Gọi từ" value={detail.call?.call_from} />
        <InfoRow icon={<Phone className="h-4 w-4" />} label="Gọi đến" value={detail.call?.call_to} />
        <InfoRow icon={<Clock className="h-4 w-4" />} label="Thời lượng" value={detail.call?.duration ? `${detail.call.duration} giây` : "-"} />
        <InfoRow icon={<CheckCircle className="h-4 w-4" />} label="Kết quả" value={detail.call?.result || "-"} />
      </>
    );
  }

  if (detail.activity_type === "email") {
    return (
      <>
        <InfoRow icon={<Mail className="h-4 w-4" />} label="Email từ" value={detail.email?.email_from} />
        <InfoRow icon={<Mail className="h-4 w-4" />} label="Email đến" value={detail.email?.email_to} />
        <InfoRow icon={<ArrowUpRight className="h-4 w-4" />} label="Loại email" value={detail.email?.direction === "in" ? "Nhận vào" : "Gửi đi"} />
        <InfoRow icon={<CheckCircle className="h-4 w-4" />} label="Trạng thái gửi" value={detail.email?.status || "-"} />
      </>
    );
  }

  if (detail.activity_type === "meeting") {
    return (
      <>
        <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Bắt đầu" value={formatDateTime(detail.meeting?.start_at)} />
        <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Kết thúc" value={formatDateTime(detail.meeting?.end_at)} />
        <InfoRow icon={<MapPin className="h-4 w-4" />} label="Địa điểm" value={detail.meeting?.location || "-"} />
        <InfoRow
          icon={<Video className="h-4 w-4" />}
          label="Link họp"
          value={
            detail.meeting?.meeting_link ? (
              <a className="text-orange-600 hover:underline" href={detail.meeting.meeting_link} target="_blank" rel="noreferrer">
                {detail.meeting.meeting_link}
              </a>
            ) : (
              "-"
            )
          }
        />
      </>
    );
  }

  return (
    <>
      <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Hạn xử lý" value={formatDateTime(detail.due_at)} />
      <InfoRow icon={<Clock className="h-4 w-4" />} label="Nhắc nhở" value={formatDateTime(detail.task?.reminder_at)} />
      <InfoRow icon={<CheckCircle className="h-4 w-4" />} label="Trạng thái task" value={detail.task?.status || "-"} />
      <InfoRow icon={<UserRound className="h-4 w-4" />} label="Ưu tiên" value={detail.priority || "-"} />
    </>
  );
}

export function ActivityDetailView({ type }: { type: ActivityType }) {
  const { id } = useParams();
  const activityId = Number(id);
  const navigate = useNavigate();
  const meta = TYPE_META[type];
  const [detail, setDetail] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await getActivityDetail(activityId);
      setDetail(data);
    } catch (err: any) {
      setAlert({ type: "error", message: err?.response?.data?.message || err?.message || "Không thể tải activity" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      setAlert({ type: "success", message: successMessage });
      loadDetail();
    } catch (err: any) {
      setAlert({ type: "error", message: err?.response?.data?.message || err?.message || "Không thể thực hiện thao tác" });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa activity này? Hành động này không thể hoàn tác.")) return;
    try {
      await deleteActivity(activityId);
      navigate(meta.listPath);
    } catch (err: any) {
      setAlert({ type: "error", message: err?.response?.data?.message || err?.message || "Không thể xóa activity" });
    }
  };

  if (loading) return <div className="page-container text-center text-gray-500">Đang tải activity...</div>;
  if (!detail) return <div className="page-container text-center text-gray-500">Không tìm thấy activity.</div>;

  const status = getStatus(detail);
  const editable = status !== "completed" && status !== "Completed" && status !== "cancelled";

  return (
    <div className="page-container">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="erp-card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Quay lại"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                {iconFor(type, detail)}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-gray-900">{detail.subject || meta.label}</h1>
                <p className="text-xs text-gray-500">{meta.label} #{detail.id}</p>
              </div>
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(status)}`}>
                {STATUS_LABELS[status] || status}
              </span>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {type === "email" && editable && (
                <Button variant="outline" leftIcon={<Send className="h-4 w-4" />} onClick={() => runAction(() => sendEmailForActivity(activityId), "Đã gửi email.")}>
                  Gửi email
                </Button>
              )}
              {type === "task" && detail.task?.status === "Not Started" && (
                <Button variant="outline" leftIcon={<PlayCircle className="h-4 w-4" />} onClick={() => runAction(() => startTask(activityId), "Task đã bắt đầu.")}>
                  Bắt đầu
                </Button>
              )}
              {type === "task" && detail.task?.status === "In Progress" && (
                <Button variant="outline" leftIcon={<CheckCircle className="h-4 w-4" />} onClick={() => runAction(() => completeTask(activityId), "Task đã hoàn tất.")}>
                  Hoàn tất
                </Button>
              )}
              {type === "meeting" && editable && (
                <Button variant="outline" leftIcon={<CheckCircle className="h-4 w-4" />} onClick={() => runAction(() => completeMeeting(activityId), "Cuộc họp đã hoàn tất.")}>
                  Hoàn tất
                </Button>
              )}
              {(type === "call" || type === "email" || type === "meeting") && editable && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const action =
                      type === "call"
                        ? () => cancelCallActivity(activityId)
                        : type === "email"
                        ? () => cancelEmailActivity(activityId)
                        : () => cancelMeeting(activityId);
                    runAction(action, "Activity đã được hủy.");
                  }}
                >
                  Hủy
                </Button>
              )}
              {editable && (
                <Button variant="outline" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => navigate(`${meta.editPrefix}/${activityId}/edit`)}>
                  Sửa
                </Button>
              )}
              <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={handleDelete}>
                Xóa
              </Button>
            </div>
          </div>

          {alert && (
            <div className="px-5 pt-4">
              <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
            </div>
          )}

          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-900">Thông tin chi tiết</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <DetailRows detail={detail} />
                </div>
              </section>

              <section className="space-y-2 border-t border-gray-100 pt-5">
                <h2 className="text-sm font-semibold text-gray-900">Ghi chú</h2>
                <div className="min-h-24 rounded-md border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-line">
                  {detail.notes || "Chưa có ghi chú."}
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <RelatedInfoCard relatedType={detail.related_type} lead={detail.lead} opportunity={detail.opportunity} customer={detail.customer} />
              <OwnerInfoCard fullName={detail.owner?.full_name} email={detail.owner?.email} phone={detail.owner?.phone} />
              <ActivityMetaInfoCard createdAt={detail.created_at} updatedAt={detail.updated_at} completedAt={detail.completed_at} />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
