// src/features/crm/pages/TaskCreatePage.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { createTaskActivity } from "../store/activitySlice";

import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { FormInput } from "../../../components/ui/FormInput";
import { RootState } from "../../../store/store";

import {
  ArrowLeft,
  CheckSquare,
  Flag,
  Calendar,
  Timer,
  AlertCircle,
} from "lucide-react";

type RelatedType = "lead" | "opportunity" | "customer";
type Priority = "low" | "medium" | "high";
type Status = "Not Started" | "In Progress" | "Completed";

export default function TaskCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUserId = useAppSelector((s: RootState) => s.auth.user?.id) || 1;
  const { loading, error } = useAppSelector((s) => s.activity);

  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  const [form, setForm] = useState({
    subject: "",
    related_type: "lead" as RelatedType,
    related_id: "",
    priority: "medium" as Priority,
    status: "Not Started" as Status,
    due_at: "",
    reminder_at: "",
    notes: "",
  });

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleCreate = async () => {
    if (!form.subject.trim()) {
      setAlert({ type: "warning", message: "Vui lòng nhập tiêu đề công việc" });
      return;
    }
    if (!form.related_id) {
      setAlert({ type: "warning", message: "Vui lòng nhập ID đối tượng liên quan" });
      return;
    }
    if (!form.due_at) {
      setAlert({ type: "warning", message: "Vui lòng chọn hạn hoàn thành" });
      return;
    }

    try {
      await dispatch(
        createTaskActivity({
          subject: form.subject,
          related_type: form.related_type,
          related_id: Number(form.related_id),
          owner_id: currentUserId,
          priority: form.priority,
          status: form.status,
          due_at: new Date(form.due_at),
          reminder_at: form.reminder_at ? new Date(form.reminder_at) : null,
          notes: form.notes || null,
        })
      ).unwrap();

      setAlert({ type: "success", message: "Tạo công việc thành công!" });
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tạo công việc";
      setAlert({ type: "error", message });
    }
  };

  // Preview màu
  const statusColor = {
    "Not Started": "bg-gray-100 text-gray-700",
    "In Progress": "bg-orange-100 text-orange-700",
    "Completed": "bg-green-100 text-green-700",
  }[form.status];

  const priorityColor = {
    high: "bg-red-100 text-red-700",
    medium: "bg-orange-100 text-orange-700",
    low: "bg-green-100 text-green-700",
  }[form.priority];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
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
              <CheckSquare className="w-7 h-7 text-orange-500" />
              Tạo công việc mới
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

        {/* Preview */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-600">Preview:</span>
          <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${statusColor}`}>
            {form.status === "Not Started" ? "Chưa bắt đầu" :
             form.status === "In Progress" ? "Đang thực hiện" : "Đã hoàn thành"}
          </span>
          <span className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-1 ${priorityColor}`}>
            <Flag className="w-3.5 h-3.5" />
            {form.priority === "high" ? "Cao" : form.priority === "medium" ? "Trung bình" : "Thấp"}
          </span>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 space-y-6">
            {/* Tiêu đề */}
            <FormInput
              label="Tiêu đề công việc"
              required
              placeholder="Nhập tiêu đề công việc..."
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
                  Hạn hoàn thành
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={form.due_at}
                  onChange={(e) => update("due_at", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  Nhắc nhở (tùy chọn)
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={form.reminder_at}
                  onChange={(e) => update("reminder_at", e.target.value)}
                />
              </div>
            </div>

            {/* Ưu tiên & Trạng thái */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Độ ưu tiên
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  value={form.priority}
                  onChange={(e) => update("priority", e.target.value as Priority)}
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Trạng thái ban đầu
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value as Status)}
                >
                  <option value="Not Started">Chưa bắt đầu</option>
                  <option value="In Progress">Đang thực hiện</option>
                  <option value="Completed">Đã hoàn thành</option>
                </select>
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                placeholder="Nhập ghi chú chi tiết..."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>

            {/* Nút */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => navigate(-1)} disabled={loading}>
                Hủy
              </Button>
              <Button onClick={handleCreate} loading={loading} className="min-w-40">
                Tạo công việc
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}