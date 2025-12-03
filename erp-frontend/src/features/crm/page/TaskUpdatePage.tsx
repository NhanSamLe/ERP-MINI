// src/features/crm/pages/TaskUpdatePage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  getActivityDetail,
  updateActivity,
  updateTaskDetail,
} from "../service/activity.service";

import { Activity } from "../dto/activity.dto";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/buttonn";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import { FormInput } from "@/components/ui/FormInput";

import {
  ArrowLeft,
  CheckSquare,
  Calendar,
  Bell,
  FileText,
  AlertCircle,
  Flag,
} from "lucide-react";

type Priority = "low" | "medium" | "high";
type Status = "Not Started" | "In Progress" | "Completed";

export default function TaskUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const activityId = Number(id);

  const [detail, setDetail] = useState<Activity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // ==========================
  // FORM STATE
  // ==========================
  const [general, setGeneral] = useState({
    subject: "",
    due_at: "",
    priority: "medium" as Priority,
    notes: "",
  });

  const [taskInfo, setTaskInfo] = useState({
    status: "Not Started" as Status,
    reminder_at: "",
  });

  const updateGeneral = <K extends keyof typeof general>(
    key: K,
    value: typeof general[K]
  ) => setGeneral((prev) => ({ ...prev, [key]: value }));

  const updateTaskInfo = <K extends keyof typeof taskInfo>(
    key: K,
    value: typeof taskInfo[K]
  ) => setTaskInfo((prev) => ({ ...prev, [key]: value }));

  // ==========================
  // LOAD DATA
  // ==========================
  useEffect(() => {
    loadDetail();
  }, [activityId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await getActivityDetail(activityId);
      setDetail(res);

      // GENERAL INFO
      setGeneral({
        subject: res.subject || "",
        due_at: res.due_at
          ? new Date(res.due_at).toISOString().slice(0, 16)
          : "",
        priority: res.priority || "medium",
        notes: res.notes || "",
      });

      // DETAIL TASK
      if (res.task) {
        setTaskInfo({
          status: res.task.status || "Not Started",
          reminder_at: res.task.reminder_at
            ? new Date(res.task.reminder_at).toISOString().slice(0, 16)
            : "",
        });
      }
    } catch (err) {
      setAlert({
        type: "error",
        message:
          err instanceof Error ? err.message : "Không thể tải dữ liệu task",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // SAVE GENERAL INFO
  // ==========================
  const handleSaveGeneral = async () => {
    try {
      await updateActivity({
        activityId,
        subject: general.subject,
        notes: general.notes || null,
        due_at: general.due_at ? new Date(general.due_at) : null,
        priority: general.priority,
      });

      setAlert({ type: "success", message: "Đã lưu thông tin chung!" });
    } catch (err) {
      setAlert({
        type: "error",
        message:
          err instanceof Error ? err.message : "Không thể lưu thông tin chung",
      });
    }
  };

  // ==========================
  // SAVE TASK DETAILS
  // ==========================
  const handleSaveTaskDetail = async () => {
    try {
      await updateTaskDetail(activityId, {
        activity_id: activityId,
        status: taskInfo.status,
        reminder_at: taskInfo.reminder_at
          ? new Date(taskInfo.reminder_at)
          : null,
      });

      setAlert({ type: "success", message: "Đã lưu chi tiết công việc!" });
    } catch (err) {
      setAlert({
        type: "error",
        message:
          err instanceof Error ? err.message : "Không thể lưu chi tiết công việc",
      });
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!detail) return <div className="p-8 text-center">Không tìm thấy công việc</div>;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4 max-w-5xl mx-auto">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <h1 className="text-xl font-semibold flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-orange-500" />
          Cập nhật công việc
        </h1>
      </div>

      {/* BODY */}
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* ====================================================
            1️⃣ GENERAL INFORMATION
        ==================================================== */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Flag className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Thông tin chung</h2>
          </CardHeader>

          <Separator />

          <CardContent className="space-y-6 pt-5">
            <FormInput
              label="Tiêu đề công việc"
              required
              value={general.subject}
              onChange={(v) => updateGeneral("subject", v)}
            />

            {/* PRIORITY */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Mức ưu tiên
              </label>
              <select
                value={general.priority}
                onChange={(e) =>
                  updateGeneral(
                    "priority",
                    e.target.value as Priority
                  )
                }
                className="border px-4 py-2 rounded-lg"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </select>
            </div>

            {/* DUE DATE */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Hạn hoàn thành
              </label>
              <input
                type="datetime-local"
                value={general.due_at}
                onChange={(e) => updateGeneral("due_at", e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            {/* NOTES */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Ghi chú
              </label>
              <textarea
                rows={5}
                className="w-full border rounded-lg px-4 py-3"
                value={general.notes}
                onChange={(e) => updateGeneral("notes", e.target.value)}
              />
            </div>

            {/* SAVE GENERAL BUTTON */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveGeneral}>Lưu thông tin chung</Button>
            </div>
          </CardContent>
        </Card>

        {/* ====================================================
            2️⃣ TASK DETAILS
        ==================================================== */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Chi tiết công việc</h2>
          </CardHeader>

          <Separator />

          <CardContent className="space-y-6 pt-5">

            {/* STATUS */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Trạng thái
              </label>
              <select
                value={taskInfo.status}
                onChange={(e) =>
                  updateTaskInfo("status", e.target.value as Status)
                }
                className="border px-4 py-2 rounded-lg"
              >
                <option value="Not Started">Chưa bắt đầu</option>
                <option value="In Progress">Đang thực hiện</option>
                <option value="Completed">Hoàn thành</option>
              </select>
            </div>

            {/* REMINDER */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Nhắc nhở (tùy chọn)
              </label>
              <input
                type="datetime-local"
                value={taskInfo.reminder_at}
                onChange={(e) =>
                  updateTaskInfo("reminder_at", e.target.value)
                }
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            {/* SAVE TASK DETAIL BUTTON */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveTaskDetail}>
                Lưu chi tiết công việc
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
