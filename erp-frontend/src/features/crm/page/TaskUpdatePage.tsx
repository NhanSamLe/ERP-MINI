// src/features/crm/pages/TaskUpdatePage.tsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchActivityDetail,
  clearActivityDetail,
  updateActivity,
  updateTaskDetail,
} from "../store/activitySlice";


import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { FormInput } from "../../../components/ui/FormInput";

import {
  ArrowLeft,
  CheckSquare,
  Calendar,
  Bell,
  AlertCircle,
  Flag,
  FileText,
} from "lucide-react";

type Priority = "low" | "medium" | "high";
type Status = "Not Started" | "In Progress" | "Completed";

export default function TaskUpdatePage() {
  const { id } = useParams<{ id: string }>();
  const taskId = Number(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { detail, loading, error } = useAppSelector((s) => s.activity);

  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  const [form, setForm] = useState({
    subject: "",
    due_at: "",
    reminder_at: "",
    priority: "medium" as Priority,
    status: "Not Started" as Status,
    notes: "",
  });

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  // Fetch detail
  useEffect(() => {
    if (taskId) {
      dispatch(fetchActivityDetail({ id: taskId}));
    }
    return () => {
      dispatch(clearActivityDetail());
    };
  }, [dispatch, taskId]);

  // Fill form when data loaded
  useEffect(() => {
    if (detail && detail.activity_type === "task" && detail.task) {
      const t = detail.task;
      setForm({
        subject: detail.subject ?? "",
        due_at: detail.due_at ? new Date(detail.due_at).toISOString().slice(0, 16) : "",
        reminder_at: t.reminder_at ? new Date(t.reminder_at).toISOString().slice(0, 16) : "",
        priority: detail.priority ?? "medium",
        status: t.status ?? "Not Started",
        notes: detail.notes ?? "",
      });
    }
  }, [detail]);

  const handleSave = async () => {
    try {
      // Cập nhật activity chung
      await dispatch(updateActivity({
        activityId: taskId,
        subject: form.subject,
        notes: form.notes || null,
        due_at: form.due_at ? new Date(form.due_at) : null,
      })).unwrap();

      // Cập nhật chi tiết task
      await dispatch(updateTaskDetail({
        activityId: taskId,
        data: {
          activity_id: taskId,
          priority: form.priority,
          status: form.status,
          reminder_at: form.reminder_at ? new Date(form.reminder_at) : null,
        },
      })).unwrap();

      setAlert({ type: "success", message: "Cập nhật công việc thành công!" });
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      let message = "Cập nhật thất bại. Vui lòng thử lại.";
      if (err instanceof Error) {
        message = err.message;
      }
      setAlert({ type: "error", message });
    }
  };

  if (!detail || detail.activity_type !== "task") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">
          {loading ? "Đang tải công việc..." : "Không tìm thấy công việc"}
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
              <CheckSquare className="w-7 h-7 text-orange-500" />
              Cập nhật công việc
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

            {/* Tiêu đề công việc */}
            <FormInput
              label="Tiêu đề công việc"
              required
              placeholder="Ví dụ: Gọi lại khách hàng ABC để chốt hợp đồng"
              value={form.subject}
              onChange={(v) => update("subject", v)}
              className="text-lg"
            />

            {/* Hạn hoàn thành */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Hạn hoàn thành
              </label>
              <input
                type="datetime-local"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={form.due_at}
                onChange={(e) => update("due_at", e.target.value)}
              />
            </div>

            {/* Nhắc nhở */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Nhắc nhở (tùy chọn)
              </label>
              <input
                type="datetime-local"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={form.reminder_at}
                onChange={(e) => update("reminder_at", e.target.value)}
              />
            </div>

            {/* Ưu tiên & Trạng thái */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Độ ưu tiên
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                  Trạng thái
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value as Status)}
                >
                  <option value="Not Started">Chưa bắt đầu</option>
                  <option value="In Progress">Đang thực hiện</option>
                  <option value="Completed">Hoàn thành</option>
                </select>
              </div>
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
                placeholder="Mô tả chi tiết công việc, hướng dẫn thực hiện..."
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