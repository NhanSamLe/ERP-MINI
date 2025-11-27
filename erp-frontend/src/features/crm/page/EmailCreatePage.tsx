// src/features/crm/pages/EmailCreatePage.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { createEmailActivity } from "../store/activitySlice";
import { RootState } from "../../../store/store";

import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { FormInput } from "../../../components/ui/FormInput";

import {
  ArrowLeft,
  Mail,
  ArrowUpFromDot,
  ArrowDownToDot,
  Link,
  FileText,
} from "lucide-react";

type RelatedType = "lead" | "opportunity" | "customer";
type Direction = "in" | "out";

export default function EmailCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUserId = useAppSelector((s: RootState) => s.auth.user?.id) || 1;
  const { loading, error } = useAppSelector((s) => s.activity);
  const EMAIL_STATUS_OPTIONS = [
  "draft",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "failed",
  "bounced",
 ];
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  const [form, setForm] = useState({
    subject: "",
    related_type: "lead" as RelatedType,
    related_id: "",
    direction: "out" as Direction,
    email_from: "",
    email_to: "",
    status: "",
    message_id: "",
    notes: "",
  });

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => setForm(prev => ({ ...prev, [key]: value }));

  const handleCreate = async () => {
    if (!form.subject.trim()) {
      setAlert({ type: "warning", message: "Vui lòng nhập tiêu đề email" });
      return;
    }
    if (!form.related_id) {
      setAlert({ type: "warning", message: "Vui lòng nhập ID đối tượng liên quan" });
      return;
    }
    if (!form.email_to.trim()) {
      setAlert({ type: "warning", message: "Vui lòng nhập email người nhận" });
      return;
    }

    try {
      await dispatch(createEmailActivity({
        subject: form.subject,
        related_type: form.related_type,
        related_id: Number(form.related_id),
        owner_id: currentUserId,
        direction: form.direction,
        email_from: form.email_from || '',
        email_to: form.email_to,
        status: form.status || '',
        message_id: form.message_id || '',
        notes: form.notes || null,
      })).unwrap();

      setAlert({ type: "success", message: "Gửi email thành công!" });
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể gửi email";
      setAlert({ type: "error", message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER CAM – GIỐNG HỆT MEETING */}
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
              <Mail className="w-7 h-7 text-orange-500" />
              Soạn email mới
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
              label="Tiêu đề email"
              required
              placeholder="Ví dụ: Cập nhật tiến độ dự án Q4/2025"
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

            {/* Hướng email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                {form.direction === "out" ? (
                  <ArrowUpFromDot className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownToDot className="w-4 h-4 text-blue-600" />
                )}
                Hướng email
              </label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={form.direction}
                onChange={(e) => update("direction", e.target.value as Direction)}
              >
                <option value="out">Gửi đi (Outbound)</option>
                <option value="in">Nhận về (Inbound)</option>
              </select>
            </div>

            {/* Từ & Đến */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <ArrowUpFromDot className="w-4 h-4 text-green-600" />
                  Từ (Email của bạn)
                </label>
                <FormInput
                  placeholder="you@company.com"
                  value={form.email_from}
                  onChange={(v) => update("email_from", v)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <ArrowDownToDot className="w-4 h-4 text-blue-600" />
                  Đến (Email người nhận)
                </label>
                <FormInput
                  required
                  placeholder="customer@example.com"
                  value={form.email_to}
                  onChange={(v) => update("email_to", v)}
                />
              </div>
            </div>

            {/* Trạng thái & Message ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái (tùy chọn)
                </label>
                <select
                  value={form.status}
                  onChange={(v) => update("status", v)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none border-gray-300"
                >
                  <option value="">-- Chọn trạng thái --</option>
                  {EMAIL_STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Message ID (tùy chọn)
                </label>
                <FormInput
                  placeholder="<abc123@gmail.com>"
                  value={form.message_id}
                  onChange={(v) => update("message_id", v)}
                />
              </div>
            </div>

            {/* Nội dung email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Nội dung email
              </label>
              <textarea
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none font-medium text-gray-800"
                placeholder="Kính gửi anh/chị...\n\nNội dung email của bạn ở đây..."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>

            {/* Nút */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={() => navigate(-1)} disabled={loading}>
                Hủy
              </Button>
              <Button onClick={handleCreate} loading={loading} className="min-w-40">
                Gửi email
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}