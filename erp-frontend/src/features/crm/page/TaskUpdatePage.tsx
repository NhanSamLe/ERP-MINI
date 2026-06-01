// src/features/crm/pages/TaskUpdatePage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getActivityDetail, updateActivity, updateTaskDetail } from "../service/activity.service";
import { Activity } from "../dto/activity.dto";
import { TaskStatus } from "@/types/enum";
import {
  ArrowLeft, CheckSquare, Calendar, Bell, Save,
  Loader2, AlertTriangle, CheckCircle2, Circle, PlayCircle,
} from "lucide-react";

type Priority = "low" | "medium" | "high";
type Status   = "Not Started" | "In Progress" | "Completed";

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Thấp",       color: "text-gray-500 bg-gray-100 border-gray-200" },
  { value: "medium", label: "Trung bình", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "high",   label: "Cao",        color: "text-red-600 bg-red-50 border-red-200" },
];

const STATUS_OPTIONS: { value: Status; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "Not Started", label: "Chưa bắt đầu",   icon: <Circle className="w-4 h-4" />,       color: "text-gray-500 bg-gray-50 border-gray-200" },
  { value: "In Progress", label: "Đang thực hiện",  icon: <PlayCircle className="w-4 h-4" />,    color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "Completed",   label: "Hoàn thành",      icon: <CheckCircle2 className="w-4 h-4" />,  color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
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

  if (loading) return (
    <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Đang tải...</span>
      </div>
    </div>
  );
  if (!detail) return (
    <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center">
      <div className="text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-gray-400 mx-auto" />
        <p className="text-gray-600">Không tìm thấy công việc</p>
        <button onClick={() => navigate(-1)} className="text-sm text-orange-600 hover:underline">Quay lại</button>
      </div>
    </div>
  );

  const isDone = status === "Completed";

  return (
    <div className="min-h-screen bg-[#f6f8fc] flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
          <CheckSquare className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-none">Cập nhật công việc</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-none truncate max-w-xs">{subject || "—"}</p>
        </div>
        <div className="flex-1" />
        {isDone && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-full shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu
        </button>
      </header>

      {/* Body */}
      <main className="flex-1 flex justify-center px-4 py-6">
        <div className="w-full max-w-2xl space-y-4">

          {/* General info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-orange-500 rounded-full" />
              <h2 className="text-sm font-semibold text-gray-800">Thông tin chung</h2>
            </div>
            <div className="p-5 space-y-4">

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Tiêu đề <span className="text-red-500">*</span></label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="Tiêu đề công việc..." />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Mức ưu tiên</label>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map(p => (
                    <button key={p.value} type="button" onClick={() => setPriority(p.value as Priority)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        priority === p.value ? p.color + " shadow-sm" : "text-gray-400 bg-white border-gray-200 hover:border-gray-300"
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Hạn hoàn thành
                </label>
                <input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Ghi chú</label>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none" />
              </div>
            </div>
          </div>

          {/* Task detail */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
              <h2 className="text-sm font-semibold text-gray-800">Chi tiết công việc</h2>
            </div>
            <div className="p-5 space-y-4">

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Trạng thái</label>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.value} type="button" onClick={() => setStatus(s.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                        status === s.value ? s.color + " shadow-sm" : "text-gray-400 bg-white border-gray-200 hover:border-gray-300"
                      }`}>
                      {s.icon}
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminder */}
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1.5">
                  <Bell className="w-3.5 h-3.5" /> Nhắc nhở (tuỳ chọn)
                </label>
                <input type="datetime-local" value={reminderAt} onChange={e => setReminderAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                {reminderAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Nhắc lúc: {new Date(reminderAt).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Meta */}
          <details className="group">
            <summary className="cursor-pointer list-none flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 select-none">
              <span className="group-open:rotate-90 transition-transform inline-block">›</span>
              Thông tin kỹ thuật
            </summary>
            <div className="mt-1 bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-gray-500">
              <div><span className="font-medium text-gray-700">Activity ID:</span> {activityId}</div>
              <div><span className="font-medium text-gray-700">Trạng thái hệ thống:</span> {detail.status || "—"}</div>
              <div><span className="font-medium text-gray-700">Liên kết:</span> {detail.related_type} #{detail.related_id}</div>
              <div><span className="font-medium text-gray-700">Người phụ trách:</span> {detail.owner?.full_name || "—"}</div>
            </div>
          </details>
        </div>
      </main>
    </div>
  );
}
