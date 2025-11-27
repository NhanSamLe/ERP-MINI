// src/features/crm/pages/EmailUpdatePage.tsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchActivityDetail,
  clearActivityDetail,
  updateActivity,
  updateEmailDetail,
} from "../store/activitySlice";

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

type Direction = "in" | "out";

export default function EmailUpdatePage() {
  const { id } = useParams<{ id: string }>();
  const emailId = Number(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { detail, loading, error } = useAppSelector((s) => s.activity);

  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  const [form, setForm] = useState({
    subject: "",
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
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  // Fetch detail
  useEffect(() => {
    if (emailId) {
      dispatch(fetchActivityDetail({ id: emailId }));
    }
    return () => {
      dispatch(clearActivityDetail());
    };
  }, [dispatch, emailId]);

  // Fill form when detail loaded
  useEffect(() => {
    if (detail && detail.activity_type === "email" && detail.email) {
      setForm({
        subject: detail.subject ?? "",
        direction: detail.email.direction,
        email_from: detail.email.email_from ?? "",
        email_to: detail.email.email_to ?? "",
        status: detail.email.status ?? "",
        message_id: detail.email.message_id ?? "",
        notes: detail.notes ?? "",
      });
    }
  }, [detail]);

  const handleSave = async () => {
    try {
      // Cập nhật activity chung
      await dispatch(updateActivity({
        activityId: emailId,
        subject: form.subject,
        notes: form.notes || null,
      })).unwrap();

      // Cập nhật chi tiết email
      await dispatch(updateEmailDetail({
        activityId: emailId,
        data: {
          activity_id: emailId,
          direction: form.direction,
          email_from: form.email_from || null,
          email_to: form.email_to || null
        },
      })).unwrap();

      setAlert({ type: "success", message: "Cập nhật email thành công!" });
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      let message = "Cập nhật thất bại. Vui lòng thử lại.";
      if (err instanceof Error) {
        message = err.message;
      }
      setAlert({ type: "error", message });
    }
  };

  if (!detail || detail.activity_type !== "email") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Đang tải thông tin email...</div>
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
              <Mail className="w-7 h-7 text-orange-500" />
              Cập nhật email
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

            {/* Tiêu đề email */}
            <FormInput
              label="Tiêu đề email"
              required
              placeholder="Ví dụ: Cập nhật tiến độ dự án Q4/2025"
              value={form.subject}
              onChange={(v) => update("subject", v)}
              className="text-lg"
            />

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
                  Trạng thái
                </label>
                <FormInput
                  placeholder="sent, delivered, opened..."
                  value={form.status}
                  onChange={(v) => update("status", v)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Message ID
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
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none font-medium text-gray-800"
                placeholder="Nội dung email..."
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