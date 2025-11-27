// src/features/crm/pages/EmailDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchActivityDetail,
  clearActivityDetail,
  completeActivity,
  deleteActivity,
} from "../store/activitySlice";

import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";

import {
  ArrowLeft,
  Mail,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Pencil,
  Trash2,
  User,
  Send,
  Inbox,
  Building2,
  Phone,
} from "lucide-react";

export default function EmailDetailPage() {
  const { id } = useParams();
  const emailId = Number(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { detail, error, loading } = useAppSelector((s) => s.activity);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    dispatch(fetchActivityDetail({ id: emailId}));
    return () => {dispatch(clearActivityDetail())};
  }, [dispatch, emailId]);

  const handleComplete = async () => {
    try {
      await dispatch(completeActivity({ activityId: emailId })).unwrap();
      setAlert({ type: "success", message: "Email đã được đánh dấu hoàn thành" });
    } catch {
      setAlert({ type: "error", message: "Không thể hoàn thành email" });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa email này? Hành động không thể hoàn tác.")) return;
    try {
      await dispatch(deleteActivity(emailId)).unwrap();
      navigate("/crm/activities/email");
    } catch {
      setAlert({ type: "error", message: "Xóa email thất bại" });
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải email...</div>;
  if (!detail) return <div className="p-8 text-center text-gray-500">Không tìm thấy email</div>;

  const { email, lead, opportunity, customer, owner } = detail;
  const isOutbound = email?.direction === "out";
  // const isInbound = email?.direction === "in";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER MỎNG – ĐẸP NHƯ ERP UTE */}
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
              <Mail className={`w-6 h-6 ${isOutbound ? "text-blue-500" : "text-green-500"}`} />
              {detail.subject || "(Không có tiêu đề)"}
            </h1>

            {/* Badge hướng email + trạng thái hoàn thành */}
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${
                  isOutbound
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {isOutbound ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                {isOutbound ? "Gửi đi" : "Nhận về"}
              </span>

              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  detail.done
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {detail.done ? "Đã hoàn thành" : "Chưa hoàn thành"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!detail.done && (
              <Button size="sm" onClick={handleComplete}>
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Hoàn thành</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/crm/activities/email/${emailId}/edit`)}
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
          <div className="mb-mb-5">
            <Alert type="error" message={error} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái: Nội dung email */}
          <div className="lg:col-span-2 space-y-6">
            {/* Email Header Info */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-800">Chi tiết email</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex items-center gap-3">
                    {isOutbound ? <Send className="w-5 h-5 text-blue-500" /> : <Inbox className="w-5 h-5 text-green-500" />}
                    <div>
                      <p className="text-sm text-gray-600">Từ</p>
                      <p className="font-medium">{email?.email_from || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Đến</p>
                      <p className="font-medium break-all">{email?.email_to || "—"}</p>
                    </div>
                  </div>

                  {email?.message_id && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Nội dung gửi</p>
                      <p className="font-medium text-gray-700">{email.message_id}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600">Trạng thái gửi</p>
                    <p className="font-medium">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        email?.status === "sent" ? "bg-green-100 text-green-700" :
                        email?.status === "failed" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {email?.status || "—"}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Thời gian hạn</p>
                    <p className="font-medium">
                      {detail.due_at ? new Date(detail.due_at).toLocaleString("vi-VN") : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Thời gian gửi</p>
                    <p className="font-medium">
                      {detail.completed_at ? new Date(detail.completed_at).toLocaleString("vi-VN") : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nội dung email */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-800">Nội dung</h2>
              </div>
              <div className="p-6">
                <div
                  className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: detail.notes || "<em>(Không có nội dung)</em>" }}
                />
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
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium">{owner.full_name}</p>
                      <p className="text-sm text-gray-500">Người xử lý</p>
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