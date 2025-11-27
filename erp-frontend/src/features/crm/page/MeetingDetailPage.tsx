// src/features/crm/pages/MeetingDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchActivityDetail,
  completeActivity,
  deleteActivity,
  clearActivityDetail,
} from "../store/activitySlice";

import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import {
  ArrowLeft,
  CheckCircle,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Link2,
  User,
  Phone,
  Mail,
  Building2,
} from "lucide-react";

export default function MeetingDetailPage() {
  const { id } = useParams();
  const meetingId = Number(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { detail, error, loading } = useAppSelector((s) => s.activity);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    dispatch(fetchActivityDetail({ id: meetingId }));
    return () => {dispatch(clearActivityDetail())};
  }, [dispatch, meetingId]);

  const handleComplete = async () => {
    try {
      await dispatch(completeActivity({ activityId: meetingId })).unwrap();
      setAlert({ type: "success", message: "Meeting đã được đánh dấu hoàn thành" });
    } catch {
      setAlert({ type: "error", message: "Không thể hoàn thành meeting" });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa meeting này? Hành động không thể hoàn tác.")) return;
    try {
      await dispatch(deleteActivity(meetingId)).unwrap();
      navigate("/crm/activities/meeting");
    } catch {
      setAlert({ type: "error", message: "Xóa meeting thất bại" });
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  if (!detail) return <div className="p-8 text-center text-gray-500">Không tìm thấy meeting</div>;

  const { meeting, lead, opportunity, customer, owner } = detail;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER SIÊU MỎNG - GIỐNG ERP UTE */}
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
              <Calendar className="w-6 h-6 text-orange-500" />
              {detail.subject || "Meeting không có tiêu đề"}
            </h1>

            {/* Badge trạng thái - giống hệt ERP UTE */}
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

          {/* Nút nhỏ gọn */}
          <div className="flex items-center gap-2">
            {!detail.done && (
              <Button size="sm" onClick={handleComplete}>
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Hoàn thành</span>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => navigate(`/crm/activities/meeting/${meetingId}/edit`)}>
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
        {/* Alert */}
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
          {/* Cột trái - Thông tin cuộc họp */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin cuộc họp */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-800">Thông tin cuộc họp</h2>
              </div>
              <div className="p-5 space-y-5">
                {meeting ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Bắt đầu</p>
                        <p className="font-medium text-gray-900">
                          {new Date(meeting.start_at).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Kết thúc</p>
                        <p className="font-medium text-gray-900">
                          {meeting.end_at ? new Date(meeting.end_at).toLocaleString("vi-VN") : "—"}
                        </p>
                      </div>
                    </div>

                    {meeting.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Địa điểm</p>
                          <p className="font-medium">{meeting.location}</p>
                        </div>
                      </div>
                    )}

                    {meeting.meeting_link && (
                      <div className="flex items-start gap-3">
                        <Link2 className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Link họp</p>
                          <a
                            href={meeting.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium break-all"
                          >
                            {meeting.meeting_link}
                          </a>
                        </div>
                      </div>
                    )}

                    {meeting.attendees && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Người tham gia</p>
                        <p className="font-medium pl-8">{meeting.attendees}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 italic pl-8">Chưa có thông tin chi tiết cuộc họp</p>
                )}
              </div>
            </div>

            {/* Ghi chú */}
            {detail.notes && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-semibold text-gray-800">Ghi chú</h2>
                </div>
                <div className="p-5">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{detail.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Cột phải - Liên quan đến */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-800">Liên quan đến</h2>
              </div>
              <div className="p-5 space-y-6">
                {lead && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Lead</p>
                    <Link to={`/crm/leads/${lead.id}`} className="text-lg font-semibold text-blue-600 hover:underline">
                      {lead.name}
                    </Link>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {lead.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {lead.phone}</p>}
                      {lead.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {lead.email}</p>}
                    </div>
                  </div>
                )}

                {opportunity && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Cơ hội</p>
                    <Link to={`/crm/opportunities/${opportunity.id}`} className="text-lg font-semibold text-blue-600 hover:underline">
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
                      <p className="text-sm text-gray-500">Người sở hữu</p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạo lúc</span>
                    <span className="font-medium">
                      {new Date(detail.created_at || "").toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cập nhật</span>
                    <span className="font-medium">
                      {new Date(detail.updated_at || "").toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  {detail.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hoàn thành</span>
                      <span className="font-medium text-green-600">
                        {new Date(detail.completed_at).toLocaleDateString("vi-VN")}
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