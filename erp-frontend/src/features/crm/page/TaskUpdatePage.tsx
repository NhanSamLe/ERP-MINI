import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getActivityDetail, updateActivity, updateTaskDetail } from "../service/activity.service";
import { Activity } from "../dto/activity.dto";
import { TaskStatus } from "@/types/enum";
import { StandardFormLayout, FormSection } from "@/components/layout";
import { StatusBadge } from "@/components/common";
import { CheckSquare, Calendar, Bell, Circle, PlayCircle, CheckCircle2 } from "lucide-react";
import { ActivityRelatedSummary } from "../components/ActivityRelatedSummary";

type Priority = "low" | "medium" | "high";
type Status = "Not Started" | "In Progress" | "Completed";

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Thấp",       color: "text-gray-500 bg-gray-100 border-gray-200" },
  { value: "medium", label: "Trung bình", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "high",   label: "Cao",        color: "text-red-600 bg-red-50 border-red-200" },
];

const STATUS_OPTIONS: { value: Status; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "Not Started", label: "Chưa bắt đầu",  icon: <Circle className="w-4 h-4" />,      color: "text-gray-500 bg-gray-50 border-gray-200" },
  { value: "In Progress", label: "Đang thực hiện", icon: <PlayCircle className="w-4 h-4" />,   color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "Completed",   label: "Hoàn thành",     icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
];

export default function TaskUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const activityId = Number(id);

  const [detail, setDetail] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [subject,    setSubject]    = useState("");
  const [priority,   setPriority]   = useState<Priority>("medium");
  const [notes,      setNotes]      = useState("");
  const [dueAt,      setDueAt]      = useState("");
  const [status,     setStatus]     = useState<Status>("Not Started");
  const [reminderAt, setReminderAt] = useState("");

  useEffect(() => { loadDetail(); }, [activityId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await getActivityDetail(activityId);
      setDetail(res);
      setSubject(res.subject || "");
      setPriority(res.priority || "medium");
      setNotes(res.notes || "");
      setDueAt(res.due_at ? new Date(res.due_at).toISOString().slice(0, 16) : "");
      if (res.task) {
        setStatus(res.task.status || "Not Started");
        setReminderAt(res.task.reminder_at ? new Date(res.task.reminder_at).toISOString().slice(0, 16) : "");
      }
    } catch {
      toast.error("Không thể tải dữ liệu công việc");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!subject.trim()) { toast.error("Vui lòng nhập tiêu đề"); return; }
    try {
      setSaving(true);
      await updateActivity({ activityId, subject, notes: notes || null, priority, due_at: dueAt ? new Date(dueAt) : null });
      await updateTaskDetail(activityId, {
        activity_id: activityId,
        status: status as TaskStatus,
        reminder_at: reminderAt ? new Date(reminderAt) : null,
      });
      toast.success("Đã lưu thông tin công việc");
    } catch {
      toast.error("Không thể lưu, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  const isDone = status === "Completed";

  return (
    <StandardFormLayout
      title={subject || "Cập nhật công việc"}
      loading={loading}
      statusBadge={detail ? <StatusBadge status={detail.status ?? "pending"} /> : undefined}
      actions={[
        { label: "Quay lại", variant: "outline", onClick: () => navigate(-1) },
        {
          label: saving ? "Đang lưu..." : "Lưu thay đổi",
          variant: "primary",
          onClick: handleSave,
          isLoading: saving,
          disabled: saving || isDone,
        },
      ]}
      sidebarContent={
        detail ? (
          <FormSection title="Thông tin công việc" icon={<CheckSquare className="w-4 h-4" />}>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Trạng thái</p>
                <StatusBadge status={detail.status ?? "pending"} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Hạn hoàn thành</p>
                <p className="font-medium text-gray-800">
                  {detail.due_at ? new Date(detail.due_at).toLocaleString("vi-VN") : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Người phụ trách</p>
                <p className="font-medium text-gray-800">{detail.owner?.full_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Thông tin liên kết</p>
                <ActivityRelatedSummary activity={detail} />
              </div>
            </div>
          </FormSection>
        ) : undefined
      }
    >
      {/* General info */}
      <FormSection title="Thông tin chung" icon={<CheckSquare className="w-4 h-4" />}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Tiêu đề công việc..."
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mức ưu tiên</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value as Priority)}
                  className={`flex-1 h-9 rounded-md border text-sm font-medium transition-all ${
                    priority === p.value ? p.color + " shadow-sm" : "text-gray-400 bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5" /> Hạn hoàn thành
            </label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={e => setDueAt(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ghi chú thêm..."
              className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </FormSection>

      {/* Task detail */}
      <FormSection title="Chi tiết công việc" icon={<CheckCircle2 className="w-4 h-4" />}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border text-sm font-medium transition-all ${
                    status === s.value ? s.color + " shadow-sm" : "text-gray-400 bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Bell className="w-3.5 h-3.5" /> Nhắc nhở (tuỳ chọn)
            </label>
            <input
              type="datetime-local"
              value={reminderAt}
              onChange={e => setReminderAt(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {reminderAt && (
              <p className="text-xs text-gray-400 mt-1">
                Nhắc lúc: {new Date(reminderAt).toLocaleString("vi-VN")}
              </p>
            )}
          </div>
        </div>
      </FormSection>
    </StandardFormLayout>
  );
}
