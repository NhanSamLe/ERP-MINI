// src/features/crm/pages/MeetingDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  getActivityDetail,
  deleteActivity,
  completeMeeting,
  cancelMeeting,
} from "../service/activity.service";

import { Activity } from "../dto/activity.dto";

import { Button } from "@/components/ui/buttonn";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Link2,
  Pencil,
  Trash2,
  CheckCircle,
} from "lucide-react";

import { RelatedInfoCard } from "../components/RelatedInfoCard";
import { OwnerInfoCard } from "../components/OwnerInfoCard";
import { ActivityMetaInfoCard } from "../components/ActivityMetaInfoCard";

import { formatDateTime } from "@/utils/time.helper";

export default function MeetingDetailPage() {
  const { id } = useParams();
  const meetingId = Number(id);
  const navigate = useNavigate();

  const [detail, setDetail] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ===================== LOAD DETAIL =====================
  useEffect(() => {
    loadDetail();
  }, [meetingId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await getActivityDetail(meetingId);
      setDetail(res);
    } catch {
      setAlert({
        type: "error",
        message: "Không thể tải thông tin cuộc họp",
      });
    } finally {
      setLoading(false);
    }
  };

  // ===================== ACTIONS =====================
 const handleComplete = async () => {
  if (!window.confirm("Đánh dấu hoàn thành cuộc họp?")) return;

  try {
    const res = await completeMeeting(meetingId);

    if (!res.success) {
      return setAlert({
        type: "error",
        message: res.message || "Không thể hoàn thành",
      });
    }

    setAlert({ type: "success", message: res.message || "Meeting đã hoàn thành" });
    loadDetail();

  } catch (err) {
    const msg =
    err instanceof Error
      ? err.message
      : "Lỗi kết nối server";

  setAlert({ type: "error", message: msg });
  }
};


  const handleCancel = async () => {
    if (!window.confirm("Hủy cuộc họp này?")) return;
    try {
      await cancelMeeting(meetingId);
      setAlert({ type: "success", message: "Cuộc họp đã bị hủy" });
      loadDetail();
    } catch {
      setAlert({ type: "error", message: "Không thể hủy meeting" });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa cuộc họp này?")) return;
    try {
      await deleteActivity(meetingId);
      navigate("/crm/activities/meeting");
    } catch {
      setAlert({ type: "error", message: "Không thể xóa cuộc họp" });
    }
  };

  // ===================== UI =====================
  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!detail || !detail.meeting)
    return <div className="p-8 text-center">Không tìm thấy Meeting</div>;

  const m = detail.meeting;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ================= HEADER ================= */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-6 h-6 text-orange-500" />
              {detail.subject || "Meeting"}
            </h1>

            <span
              className={`px-3 py-1 text-xs rounded-full ${
                detail.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : detail.status === "cancelled"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {detail.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {detail.status !== "completed" && detail.status !== "cancelled" && (
              <Button size="sm" onClick={handleComplete}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Hoàn thành
              </Button>
            )}

            {detail.status !== "completed" && detail.status !== "cancelled" && (
              <Button size="sm" onClick={handleCancel}>
                Hủy
              </Button>
            )}

          {detail.status !== "completed" && detail.status !== "cancelled" &&(
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigate(`/crm/activities/meeting/${meetingId}/edit`)
              }
            >
              <Pencil className="w-4 h-4 mr-1" />
              Sửa
            </Button>
            )}
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Xóa
            </Button>
          </div>
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {alert && (
          <div className="lg:col-span-3">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">

          {/* MEETING INFO */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Thông tin cuộc họp</h2>
            </CardHeader>
            <Separator />
            <CardContent className="py-4 space-y-4">

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-800">
                  Bắt đầu: {formatDateTime(m.start_at)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-800">
                  Kết thúc: {m.end_at ? formatDateTime(m.end_at) : "—"}
                </span>
              </div>

              {m.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-800">{m.location}</span>
                </div>
              )}

              {m.meeting_link && (
                <div className="flex items-center gap-3">
                  <Link2 className="w-4 h-4 text-gray-500" />
                  <a
                    href={m.meeting_link}
                    className="text-blue-600 hover:underline break-all"
                    target="_blank"
                  >
                    {m.meeting_link}
                  </a>
                </div>
              )}

              {m.attendees && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-800">{m.attendees}</span>
                </div>
              )}

              {detail.notes && (
                <div className="pt-2">
                  <h4 className="font-medium mb-1">Ghi chú</h4>
                  <p className="text-gray-700 whitespace-pre-line">
                    {detail.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Related */}
          <RelatedInfoCard
            relatedType={detail.related_type}
            lead={detail.lead}
            opportunity={detail.opportunity}
            customer={detail.customer}
          />

          {/* Owner */}
          <OwnerInfoCard
            fullName={detail.owner?.full_name}
            email={detail.owner?.email}
            phone={detail.owner?.phone}
          />

          {/* Meta Info */}
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
