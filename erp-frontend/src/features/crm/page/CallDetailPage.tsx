// src/features/crm/pages/CallDetailPage.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate} from "react-router-dom";
import { OwnerInfoCard } from "../components/OwnerInfoCard";
import {
  getActivityDetail,
  deleteActivity,
  cancelCallActivity,
} from "../service/activity.service";
import {ActivityMetaInfoCard} from "../components/ActivityMetaInfoCard"
import { Button } from "@/components/ui/buttonn";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import { Activity } from "../dto/activity.dto";
import {
  ArrowLeft,
  Phone,
  Clock,
  Pencil,
  Trash2,
  Timer,
  FileText,
  Headphones,
  FileAxis3d
} from "lucide-react";

import { RelatedInfoCard } from "../components/RelatedInfoCard";
import { formatDateTime } from "../../../utils/time.helper";

export default function CallDetailPage() {
  const { id } = useParams();
  const callId = Number(id);
  const navigate = useNavigate();



const [detail, setDetail] = useState<Activity | null>(null);
const [loading, setLoading] = useState<boolean>(true);

const [alert, setAlert] = useState<{
  type: "success" | "error";
  message: string;
} | null>(null);


  useEffect(() => {
    loadDetail();
  }, [callId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await getActivityDetail(callId);
      setDetail(res);
    } catch {
      setAlert({ type: "error", message: "Không tải được dữ liệu" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Hủy cuộc gọi này?")) return;
    try {
      await cancelCallActivity(callId);
      loadDetail();
      setAlert({ type: "success", message: "Đã hủy cuộc gọi" });
    } catch {
      setAlert({ type: "error", message: "Không thể hủy cuộc gọi" });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa cuộc gọi? Hành động này không thể hoàn tác.")) return;
    try {
      await deleteActivity(callId);
      navigate("/crm/activities/calls");
    } catch {
      setAlert({ type: "error", message: "Không thể xóa cuộc gọi" });
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!detail) return <div className="p-8 text-center">Không tìm thấy dữ liệu</div>;

  const { call } = detail;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ================= HEADER ================= */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* LEFT: Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Phone className="w-5 h-5 text-orange-500" />
                {detail.subject || "Cuộc gọi"}
              </h1>

              <p className="text-sm text-gray-500 flex items-center gap-2">
                {detail.status === "completed"
                  ? "Đã hoàn thành"
                  : detail.status === "cancelled"
                  ? "Đã hủy"
                  : "Đang chờ xử lý"}
                   {/* Direction badge */}
                  {call?.is_inbound ? (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-100 text-green-700">
                      Cuộc gọi đến
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-700">
                      Cuộc gọi đi
                    </span>
                  )}
              </p>
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2">

            {detail.status !== "completed" && detail.status !== "cancelled" && (
              <Button variant="secondary" onClick={handleCancel}>
                Hủy
              </Button>
            )}
            {detail.status !== "completed" && detail.status !== "cancelled" && (
              <>
                <Button onClick={() => navigate(`/crm/activities/call/${callId}/edit`)}>
                  <Pencil className="w-4 h-4 mr-1" /> Sửa
                </Button>
                </>
              )}
         {detail.status !== "completed" && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Xóa
            </Button>
            )}
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

          {/* CALL INFO CARD */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Thông tin cuộc gọi</h3>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">

              <div className="space-y-2">

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 font-medium">
                    Gọi từ: {call?.call_from || "—"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 rotate-180" />
                  <span className="text-gray-700 font-medium">
                    Gọi đến: {call?.call_to || "—"}
                  </span>
                </div>

                {detail.due_at && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      Thời gian: {formatDateTime(detail.due_at)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Timer className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    Thời lượng: {call?.duration ? `${call.duration} giây` : "—"}
                  </span>
                </div>

                {call?.result && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 capitalize">
                      Kết quả: {call.result}
                    </span>
                  </div>
                )}
                {detail.notes && (
                  <div className="flex items-center gap-3">
                    <FileAxis3d className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 capitalize">
                      Ghi chú: {detail.notes}
                    </span>
                  </div>
                )}

                {call?.recording_url && (
                  <div className="pt-2">
                    <a
                      href={call.recording_url}
                      target="_blank"
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <Headphones className="w-4 h-4" />
                      Nghe lại ghi âm
                    </a>
                  </div>
                )}
              </div>
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
          {/* CREATED & UPDATED */}
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
