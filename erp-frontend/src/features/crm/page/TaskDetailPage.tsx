// src/features/crm/pages/TaskDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchActivityDetail,
  startTask,
  completeTask,
  deleteActivity,
  clearActivityDetail,
} from "../store/activitySlice";

import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";

import {
  ArrowLeft,
  Calendar,
  User,
  Flag,
  PlayCircle,
  CheckCircle,
  Pencil,
  Trash2,
  Timer,
  Building2,
  Phone,
  CheckSquare
} from "lucide-react";

export default function TaskDetailPage() {
  const { id } = useParams();
  const taskId = Number(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { detail, error, loading } = useAppSelector((s) => s.activity);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    dispatch(fetchActivityDetail({ id: taskId }));
    return () => {dispatch(clearActivityDetail())};
  }, [dispatch, taskId]);

  const handleStart = async () => {
    try {
      await dispatch(startTask(taskId)).unwrap();
      setAlert({ type: "success", message: "Task đã được bắt đầu!" });
    } catch {
      setAlert({ type: "error", message: "Không thể bắt đầu task" });
    }
  };

  const handleComplete = async () => {
    try {
      await dispatch(completeTask(taskId)).unwrap();
      setAlert({ type: "success", message: "Task đã hoàn thành!" });
    } catch {
      setAlert({ type: "error", message: "Không thể hoàn thành task" });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa task này? Không thể hoàn tác.")) return;
    try {
      await dispatch(deleteActivity(taskId)).unwrap();
      navigate("/crm/activities/task");
    } catch {
      setAlert({ type: "error", message: "Xóa task thất bại" });
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  if (!detail) return <div className="p-8 text-center text-gray-500">Không tìm thấy task</div>;

  const { task, lead, opportunity, customer, owner } = detail;

  // Xác định màu trạng thái
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Started": return "bg-gray-100 text-gray-700";
      case "In Progress": return "bg-blue-100 text-blue-700";
      case "Completed": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER MỎNG - ĐỒNG BỘ VỚI CÁC LOẠI KHÁC */}
      <div className="bg-white border-b border-gray-300">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
             <CheckSquare className="w-6 h-6 text-orange-500" />
              {detail.subject || "Task không có tiêu đề"}
            </h1>

            {/* Badge trạng thái + ưu tiên */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(task?.status || "")}`}>
                {task?.status || "Chưa xác định"}
              </span>

              {detail?.priority && (
                <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getPriorityColor(detail.priority)}`}>
                  <Flag className="w-3.5 h-3.5" />
                  {detail.priority}
                </span>
              )}
            </div>
          </div>

          {/* Nút hành động nhỏ gọn */}
          <div className="flex items-center gap-2">
            {task?.status === "Not Started" && (
              <Button size="sm" onClick={handleStart}>
                <PlayCircle className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Bắt đầu</span>
              </Button>
            )}

            {task?.status !== "Completed" && (
              <Button size="sm" onClick={handleComplete}>
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Hoàn thành</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/crm/activities/task/${taskId}/edit`)}
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Sửa</span>
            </Button>

            <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {alert && (
          <div className="mb-5">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}
        {error && (
          <div className="mb-5">
            <Alert type="error" message={error} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái: Thông tin task */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin chính */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-800">Thông tin công việc</h2>
              </div>
              <div className="p-6 space-y-5">
                {detail.due_at && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Hạn chót</p>
                      <p className="font-medium">
                        {new Date(detail.due_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                )}

                {task?.reminder_at && (
                  <div className="flex items-center gap-3">
                    <Timer className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Nhắc nhở</p>
                      <p className="font-medium">
                        {new Date(task.reminder_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                )}

                {detail.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Ghi chú</p>
                    <p className="whitespace-pre-line text-gray-700 leading-relaxed">{detail.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cột phải: Liên quan & metadata */}
          <div className="space-y-6">
            {/* Liên quan đến */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-800">Liên quan đến</h2>
              </div>
              <div className="p-5 space-y-6">
                {lead && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Lead</p>
                    <Link to={`/crm/leads/${lead.id}`} className="text-lg font-semibold text-blue-600 hover:underline block">
                      {lead.name}
                    </Link>
                    {lead.phone && <p className="mt-1 text-sm text-gray-600 flex items-center gap-2"><Phone className="w-4 h-4" /> {lead.phone}</p>}
                  </div>
                )}

                {opportunity && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Cơ hội</p>
                    <Link to={`/crm/opportunities/${opportunity.id}`} className="text-lg font-semibold text-blue-600 hover:underline block">
                      {opportunity.name}
                    </Link>
                  </div>
                )}

                {customer && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Khách hàng</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      {customer.name}
                    </p>
                  </div>
                )}

                {!lead && !opportunity && !customer && (
                  <p className="text-gray-500 italic">Không liên kết với đối tượng nào</p>
                )}
              </div>
            </div>

            {/* Thông tin khác */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-800">Thông tin khác</h2>
              </div>
              <div className="p-5 space-y-4">
                {owner && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">{owner.full_name}</p>
                      <p className="text-sm text-gray-500">Người thực hiện</p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạo lúc</span>
                    <span className="font-medium">{new Date(detail.created_at || "").toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cập nhật</span>
                    <span className="font-medium">{new Date(detail.updated_at || "").toLocaleString("vi-VN")}</span>
                  </div>
                  {detail.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hoàn thành</span>
                      <span className="font-medium text-green-600">
                        {new Date(detail.completed_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}