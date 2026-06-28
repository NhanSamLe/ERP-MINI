import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getActivityDetail, updateActivity, updateMeetingDetail } from "../service/activity.service";
import { Activity } from "../dto/activity.dto";
import { StandardFormLayout, FormSection } from "@/components/layout";
import { StatusBadge } from "@/components/common";
import { Calendar, MapPin, Users, Link2, FileText, Clock } from "lucide-react";
import { ActivityRelatedSummary } from "../components/ActivityRelatedSummary";

export default function MeetingUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const activityId = Number(id);

  const [detail, setDetail] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [subject,     setSubject]     = useState("");
  const [priority,    setPriority]    = useState<"low" | "medium" | "high">("medium");
  const [notes,       setNotes]       = useState("");
  const [startAt,     setStartAt]     = useState("");
  const [endAt,       setEndAt]       = useState("");
  const [location,    setLocation]    = useState("");
  const [attendees,   setAttendees]   = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  useEffect(() => { loadDetail(); }, [activityId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await getActivityDetail(activityId);
      setDetail(res);
      setSubject(res.subject || "");
      setPriority(res.priority || "medium");
      setNotes(res.notes || "");
      if (res.meeting) {
        setStartAt(res.meeting.start_at ? new Date(res.meeting.start_at).toISOString().slice(0, 16) : "");
        setEndAt(res.meeting.end_at   ? new Date(res.meeting.end_at).toISOString().slice(0, 16)   : "");
        setLocation(res.meeting.location || "");
        setAttendees(res.meeting.attendees || "");
        setMeetingLink(res.meeting.meeting_link || "");
      }
    } catch {
      toast.error("Không thể tải dữ liệu cuộc họp");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!subject.trim()) { toast.error("Vui lòng nhập tiêu đề"); return; }
    if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }
    try {
      setSaving(true);
      await updateActivity({ activityId, subject, notes: notes || null, priority });
      await updateMeetingDetail(activityId, {
        activity_id: activityId,
        start_at:    startAt ? new Date(startAt) : null,
        end_at:      endAt   ? new Date(endAt)   : null,
        location:    location || null,
        attendees:   attendees || null,
        meeting_link: meetingLink || null,
      });
      toast.success("Đã lưu thông tin cuộc họp");
    } catch {
      toast.error("Không thể lưu, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  const isDone = detail?.status === "completed";

  return (
    <StandardFormLayout
      title={subject || "Cập nhật cuộc họp"}
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
        detail?.meeting ? (
          <FormSection title="Thông tin cuộc họp" icon={<Calendar className="w-4 h-4" />}>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Bắt đầu</p>
                <p className="font-medium text-gray-800">
                  {detail.meeting.start_at ? new Date(detail.meeting.start_at).toLocaleString("vi-VN") : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Kết thúc</p>
                <p className="font-medium text-gray-800">
                  {detail.meeting.end_at ? new Date(detail.meeting.end_at).toLocaleString("vi-VN") : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Trạng thái</p>
                <StatusBadge status={detail.status ?? "pending"} />
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
      <FormSection title="Thông tin chung" icon={<Calendar className="w-4 h-4" />}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Tiêu đề cuộc họp..."
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

      {/* Meeting detail */}
      <FormSection title="Chi tiết cuộc họp" icon={<Clock className="w-4 h-4" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Thời gian bắt đầu</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={e => setStartAt(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Thời gian kết thúc</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={e => setEndAt(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <MapPin className="w-3.5 h-3.5" /> Địa điểm
            </label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Phòng họp, địa chỉ, hoặc Online..."
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Users className="w-3.5 h-3.5" /> Người tham dự
            </label>
            <input
              value={attendees}
              onChange={e => setAttendees(e.target.value)}
              placeholder="Tên hoặc email, cách nhau bằng dấu phẩy..."
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Link2 className="w-3.5 h-3.5" /> Link họp
            </label>
            <input
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </FormSection>
    </StandardFormLayout>
  );
}
