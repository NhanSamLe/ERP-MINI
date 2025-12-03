// src/features/crm/pages/TaskDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate} from "react-router-dom";

import {
  getActivityDetail,
  startTask,
  completeTask,
  deleteActivity,
} from "../service/activity.service"; // dùng service FE

import { Activity } from "../dto/activity.dto";

import { Button } from "@/components/ui/buttonn";
import { Alert } from "@/components/ui/Alert";

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";

import {
  ArrowLeft,
  CheckSquare,
  CheckCircle,
  PlayCircle,
  Pencil,
  Trash2,
  Flag,
  Calendar,
  Timer,
} from "lucide-react";

import { RelatedInfoCard } from "../components/RelatedInfoCard";
import { OwnerInfoCard } from "../components/OwnerInfoCard";
import { ActivityMetaInfoCard } from "../components/ActivityMetaInfoCard";

import { formatDateTime } from "@/utils/time.helper";

export default function TaskDetailPage() {
  const { id } = useParams();
  const taskId = Number(id);
  const navigate = useNavigate();

  const [detail, setDetail] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // =======================
  // LOAD DETAIL
  // =======================
  useEffect(() => {
    loadDetail();
  }, [taskId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await getActivityDetail(taskId);
      setDetail(data);
    } catch (err) {
      setAlert({
        type: "error",
        message: err instanceof Error ? err.message : "Không thể tải dữ liệu",
      });
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // ACTIONS
  // =======================
  const handleStart = async () => {
    try {
      await startTask(taskId);
      setAlert({ type: "success", message: "Task đã được bắt đầu" });
      loadDetail();
    } catch {
      setAlert({ type: "error", message: "Không thể bắt đầu task" });
    }
  };

  const handleComplete = async () => {
    try {
      await completeTask(taskId);
      setAlert({ type: "success", message: "Task đã hoàn thành" });
      loadDetail();
    } catch {
      setAlert({ type: "error", message: "Không thể hoàn thành task" });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa task này?")) return;
    try {
      await deleteActivity(taskId);
      navigate("/crm/activities/tasks");
    } catch {
      setAlert({ type: "error", message: "Không thể xóa task" });
    }
  };

  // =======================
  // RENDER
  // =======================
  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!detail || !detail.task)
    return <div className="p-8 text-center">Không tìm thấy task</div>;

  const task = detail.task;

  const statusBadge =
    {
      "Not Started": "bg-gray-100 text-gray-700",
      "In Progress": "bg-blue-100 text-blue-600",
      Completed: "bg-green-100 text-green-700",
    }[task.status || "Not Started"] ?? "bg-gray-100 text-gray-700";

  const priorityBadge =
    {
      low: "bg-green-100 text-green-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-red-100 text-red-700",
    }[detail.priority || "medium"];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-orange-500" />
                {detail.subject || "Task"}
              </h1>

              <div className="flex gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs rounded-full ${statusBadge}`}>
                  {task.status}
                </span>

                <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${priorityBadge}`}>
                  <Flag className="w-3 h-3" />
                  {detail.priority}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT ACTION BUTTONS */}
          <div className="flex gap-2">

            {task.status === "Not Started" && (
              <Button size="sm" onClick={handleStart}>
                <PlayCircle className="w-4 h-4 mr-1" /> Bắt đầu
              </Button>
            )}

            {task.status == "In Progress" &&  (
              <Button size="sm" onClick={handleComplete}>
                <CheckCircle className="w-4 h-4 mr-1" /> Hoàn thành
              </Button>
            )}
            {task.status !== "Completed"  && (

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/crm/activities/task/${taskId}/edit`)}
            >
              <Pencil className="w-4 h-4 mr-1" /> Sửa
            </Button>
            )}
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Xóa
            </Button>

          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {alert && (
          <div className="lg:col-span-3">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Thông tin Task</h2>
            </CardHeader>
            <Separator />

            <CardContent className="pt-4 space-y-5">

              {/* Due date */}
              {detail.due_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Hạn chót</p>
                    <p className="font-medium">{formatDateTime(detail.due_at)}</p>
                  </div>
                </div>
              )}

              {/* Reminder */}
              {task.reminder_at && (
                <div className="flex items-center gap-3">
                  <Timer className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nhắc nhở</p>
                    <p className="font-medium">{formatDateTime(task.reminder_at)}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {detail.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Ghi chú</p>
                  <p className="whitespace-pre-line text-gray-800">{detail.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">

          <RelatedInfoCard
            relatedType={detail.related_type}
            lead={detail.lead}
            opportunity={detail.opportunity}
            customer={detail.customer}
          />

          <OwnerInfoCard
            fullName={detail.owner?.full_name}
            email={detail.owner?.email}
            phone={detail.owner?.phone}
          />

          <ActivityMetaInfoCard
            createdAt={detail.created_at}
            updatedAt={detail.updated_at}
            completedAt={detail.completed_at}
          />
        </div>
      </div>
    </div>
  );
}
