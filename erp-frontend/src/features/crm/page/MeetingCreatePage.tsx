// src/features/crm/pages/MeetingCreatePage.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { createMeetingActivity } from "../store/activitySlice";
import { RootState } from "../../../store/store";

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

type RelatedType = "lead" | "opportunity" | "customer";

export default function MeetingCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUserId = useAppSelector((s: RootState) => s.auth.user?.id) || 1;
  const { loading, error } = useAppSelector((s) => s.activity);

  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  const [form, setForm] = useState({
    subject: "",
    related_type: "lead" as RelatedType,
    related_id: "",
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
  ) => setForm(prev => ({ ...prev, [key]: value }));

  const handleCreate = async () => {
    if (!form.subject.trim()) {
      setAlert({ type: "warning", message: "Vui lòng nhập tiêu đề cuộc họp" });
      return;
    }
    if (!form.related_id) {
      setAlert({ type: "warning", message: "Vui lòng nhập ID đối tượng liên quan" });
      return;
    }
    if (!form.start_at || !form.end_at) {
      setAlert({ type: "warning", message: "Vui lòng chọn thời gian bắt đầu và kết thúc" });
      return;
    }
    if (new Date(form.end_at) <= new Date(form.start_at)) {
      setAlert({ type: "warning", message: "Thời gian kết thúc phải sau thời gian bắt đầu" });
      return;
    }

    try {
      await dispatch(createMeetingActivity({
        subject: form.subject,
        related_type: form.related_type,
        related_id: Number(form.related_id),
        owner_id: currentUserId,
        start_at: new Date(form.start_at),
        end_at: new Date(form.end_at),
        location: form.location || null,
        attendees: form.attendees || null,
        meeting_link: form.meeting_link || null,
        notes: form.notes || null,
      })).unwrap();

      setAlert({ type: "success", message: "Tạo cuộc họp thành công!" });
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tạo cuộc họp";
      setAlert({ type: "error", message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER ĐỒNG BỘ - MÀU CAM CHỦ ĐẠO */}
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
              Tạo cuộc họp mới
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Alert */}
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

        {/* Form đẹp */}
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

            {/* Liên quan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Liên quan đến
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  value={form.related_type}
                  onChange={(e) => update("related_type", e.target.value as RelatedType)}
                >
                  <option value="lead">Lead</option>
                  <option value="opportunity">Cơ hội</option>
                  <option value="customer">Khách hàng</option>
                </select>
              </div>

              <FormInput
                label="ID đối tượng"
                required
                placeholder="Ví dụ: 123"
                value={form.related_id}
                onChange={(v) => update("related_id", v)}
              />
            </div>

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
                Địa điểm (tùy chọn)
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
                Người tham dự (tùy chọn)
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
                Link ( Link Meet Hoặc GgMap)
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
                Ghi chú (tùy chọn)
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                placeholder="Nội dung cần thảo luận, mục tiêu cuộc họp..."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>

            {/* Nút hành động */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => navigate(-1)} disabled={loading}>
                Hủy
              </Button>
              <Button onClick={handleCreate} loading={loading} className="min-w-40">
                Tạo cuộc họp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}