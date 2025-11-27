// src/features/crm/pages/MeetingUpdatePage.tsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchActivityDetail,
  clearActivityDetail,
  updateActivity,
  updateMeetingDetail,
} from "../store/activitySlice";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { FormInput } from "../../../components/ui/FormInput";

import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Link2,
  FileText,
} from "lucide-react";

export default function MeetingUpdatePage() {
  const { id } = useParams<{ id: string }>();
  const meetingId = Number(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { detail, loading, error } = useAppSelector((s) => s.activity);

  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  const [form, setForm] = useState({
    subject: "",
    start_at: "",
    end_at: "",
    location: "",
    attendees: "",
    meeting_link: "",
    notes: "",
  });

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  // Fetch detail
  useEffect(() => {
    if (meetingId) {
      dispatch(fetchActivityDetail({ id: meetingId }));
    }
    return () => {
      dispatch(clearActivityDetail());
    };
  }, [dispatch, meetingId]);

  // Fill form when data loaded
  useEffect(() => {
    if (detail && detail.activity_type === "meeting" && detail.meeting) {
      const m = detail.meeting;
      setForm({
        subject: detail.subject ?? "",
        start_at: m.start_at ? new Date(m.start_at).toISOString().slice(0, 16) : "",
        end_at: m.end_at ? new Date(m.end_at).toISOString().slice(0, 16) : "",
        location: m.location ?? "",
        attendees: m.attendees ?? "",
        meeting_link: m.meeting_link ?? "",
        notes: detail.notes ?? "",
      });
    }
  }, [detail]);

  const handleSave = async () => {
    try {
      // Cập nhật activity chung
      await dispatch(updateActivity({
        activityId: meetingId,
        subject: form.subject,
        notes: form.notes || null,
      })).unwrap();

      // Cập nhật chi tiết meeting
      await dispatch(updateMeetingDetail({
        activityId: meetingId,
        data: {
          activity_id: meetingId,
          start_at: form.start_at ? new Date(form.start_at) : null,
          end_at: form.end_at ? new Date(form.end_at) : null,
          location: form.location || null,
          attendees: form.attendees || null,
          meeting_link: form.meeting_link || null,
        },
      })).unwrap();

      setAlert({ type: "success", message: "Cập nhật cuộc họp thành công!" });
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      let message = "Cập nhật thất bại. Vui lòng thử lại.";
      if (err instanceof Error) {
        message = err.message;
      }
      setAlert({ type: "error", message });
    }
  };

  if (!detail || detail.activity_type !== "meeting") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">
          {loading ? "Đang tải thông tin cuộc họp..." : "Không tìm thấy cuộc họp"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER CAM – ĐỒNG BỘ HOÀN HẢO */}
      <div className="bg-white border-b border-gray-300">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-7 h-7 text-orange-500" />
              Cập nhật cuộc họp
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {alert && (
          <div className="mb-6">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 space-y-6">

            {/* Tiêu đề */}
            <FormInput
              label="Tiêu đề cuộc họp"
              required
              placeholder="Ví dụ: Họp đánh giá quý với khách hàng ABC"
              value={form.subject}
              onChange={(v) => update("subject", v)}
              className="text-lg"
            />

            {/* Thời gian */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Thời gian bắt đầu
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={form.start_at}
                  onChange={(e) => update("start_at", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Thời gian kết thúc
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={form.end_at}
                  onChange={(e) => update("end_at", e.target.value)}
                />
              </div>
            </div>

            {/* Địa điểm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Địa điểm
              </label>
              <FormInput
                placeholder="Ví dụ: Phòng họp 301, Tầng 3"
                value={form.location}
                onChange={(v) => update("location", v)}
              />
            </div>

            {/* Người tham dự */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Người tham dự
              </label>
              <FormInput
                placeholder="Nhập tên hoặc email, cách nhau bằng dấu phẩy"
                value={form.attendees}
                onChange={(v) => update("attendees", v)}
              />
            </div>

            {/* Link họp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Link họp online
              </label>
              <FormInput
                placeholder="https://meet.google.com/xxx-yyy-zzz"
                value={form.meeting_link}
                onChange={(v) => update("meeting_link", v)}
              />
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Ghi chú
              </label>
              <textarea
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                placeholder="Nội dung cần thảo luận, mục tiêu cuộc họp..."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>

            {/* Nút hành động */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={() => navigate(-1)} disabled={loading}>
                Hủy
              </Button>
              <Button onClick={handleSave} loading={loading} className="min-w-40">
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}