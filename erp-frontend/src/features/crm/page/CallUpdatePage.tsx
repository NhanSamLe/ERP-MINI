import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getActivityDetail, updateActivity, updateCallDetail } from "../service/activity.service";
import { Activity } from "../dto/activity.dto";
import { ResultType } from "@/types/enum";
import { StandardFormLayout, FormSection } from "@/components/layout";
import { StatusBadge } from "@/components/common";
import { Phone, Clock, Mic, FileText, PhoneCall } from "lucide-react";
import { ActivityRelatedSummary } from "../components/ActivityRelatedSummary";

const RESULT_OPTIONS: { value: ResultType; label: string }[] = [
  { value: "connected",    label: "Đã kết nối" },
  { value: "no_answer",   label: "Không nghe máy" },
  { value: "busy",        label: "Bận" },
  { value: "failed",      label: "Thất bại" },
  { value: "call_back",   label: "Gọi lại sau" },
  { value: "wrong_number",label: "Sai số" },
];

export default function CallUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const activityId = Number(id);

  const [detail, setDetail] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState("");
  const [result, setResult] = useState<ResultType | "">("");
  const [recordingUrl, setRecordingUrl] = useState("");

  useEffect(() => { loadDetail(); }, [activityId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await getActivityDetail(activityId);
      setDetail(res);
      setSubject(res.subject || "");
      setPriority(res.priority || "medium");
      setNotes(res.notes || "");
      setDuration(res.call?.duration?.toString() || "");
      setResult((res.call?.result as ResultType) ?? "");
      setRecordingUrl(res.call?.recording_url || "");
    } catch {
      toast.error("Không thể tải dữ liệu cuộc gọi");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!subject.trim()) { toast.error("Vui lòng nhập tiêu đề"); return; }
    try {
      setSaving(true);
      await updateActivity({ activityId, subject, notes: notes || null, priority });
      await updateCallDetail(activityId, {
        activity_id: activityId,
        duration: duration ? Number(duration) : null,
        result: (result as ResultType) || null,
        recording_url: recordingUrl || null,
      });
      toast.success("Đã lưu thông tin cuộc gọi");
    } catch {
      toast.error("Không thể lưu, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  const isDone = detail?.status === "completed";

  return (
    <StandardFormLayout
      title={subject || "Cập nhật cuộc gọi"}
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
        detail?.call ? (
          <FormSection title="Thông tin cuộc gọi" icon={<PhoneCall className="w-4 h-4" />}>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Từ</p>
                <p className="font-medium text-gray-800">{detail.call.call_from || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Đến</p>
                <p className="font-medium text-gray-800">{detail.call.call_to || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Chiều</p>
                <p className="font-medium text-gray-800">{detail.call.is_inbound ? "Inbound" : "Outbound"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Trạng thái</p>
                <StatusBadge status={detail.status ?? "pending"} />
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
      <FormSection title="Thông tin chung" icon={<Phone className="w-4 h-4" />}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Tiêu đề cuộc gọi..."
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mức ưu tiên</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className="h-9 rounded-md border border-gray-200 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <FileText className="w-3.5 h-3.5" /> Ghi chú
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ghi chú thêm..."
              className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </FormSection>

      {/* Call detail */}
      <FormSection title="Chi tiết cuộc gọi" icon={<PhoneCall className="w-4 h-4" />}>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Clock className="w-3.5 h-3.5" /> Thời lượng (giây)
            </label>
            <input
              type="number"
              min={0}
              value={duration}
              onChange={e => setDuration(e.target.value.replace(/\D/g, ""))}
              placeholder="VD: 120"
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {duration && (
              <p className="text-xs text-gray-400 mt-1">
                ≈ {Math.floor(Number(duration) / 60)} phút {Number(duration) % 60} giây
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kết quả cuộc gọi</label>
            <select
              value={result}
              onChange={e => setResult(e.target.value as ResultType)}
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">— Chọn kết quả —</option>
              {RESULT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Mic className="w-3.5 h-3.5" /> Link ghi âm
            </label>
            <input
              value={recordingUrl}
              onChange={e => setRecordingUrl(e.target.value)}
              placeholder="https://..."
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </FormSection>
    </StandardFormLayout>
  );
}
