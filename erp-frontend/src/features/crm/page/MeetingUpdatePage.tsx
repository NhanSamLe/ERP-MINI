// src/features/crm/pages/MeetingUpdatePage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getActivityDetail,
  updateActivity,
  updateMeetingDetail,
} from "../service/activity.service";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/buttonn";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FormInput } from "@/components/ui/FormInput";

import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Link2,
  FileText,
  Settings,
} from "lucide-react";

import { Activity } from "../dto/activity.dto";

export default function MeetingUpdatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const activityId = Number(id);

  const [detail, setDetail] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // ========================
  // FORM STATE
  // ========================
  const [general, setGeneral] = useState({
    subject: "",
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
  });

  const [meetingInfo, setMeetingInfo] = useState({
    start_at: "",
    end_at: "",
    location: "",
    attendees: "",
    meeting_link: "",
  });

  const updateGeneral = <K extends keyof typeof general>(
    key: K,
    value: (typeof general)[K]
  ) => setGeneral((p) => ({ ...p, [key]: value }));

  const updateMeetingInfo = <K extends keyof typeof meetingInfo>(
    key: K,
    value: (typeof meetingInfo)[K]
  ) => setMeetingInfo((p) => ({ ...p, [key]: value }));

  // ========================
  // LOAD DETAIL
  // ========================
  useEffect(() => {
    loadDetail();
  }, [activityId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await getActivityDetail(activityId);
      setDetail(res);

      // SECTION 1 – General Info
      setGeneral({
        subject: res.subject || "",
        priority: res.priority || "medium",
        notes: res.notes || "",
      });

      // SECTION 2 – Meeting Info
      if (res.meeting) {
        const m = res.meeting;
        setMeetingInfo({
          start_at: m.start_at
            ? new Date(m.start_at).toISOString().slice(0, 16)
            : "",
          end_at: m.end_at
            ? new Date(m.end_at).toISOString().slice(0, 16)
            : "",
          location: m.location || "",
          attendees: m.attendees || "",
          meeting_link: m.meeting_link || "",
        });
      }
    } catch (err: unknown) {
      setAlert({
        type: "error",
        message:
          err instanceof Error ? err.message : "Không thể tải dữ liệu cuộc họp",
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // SAVE GENERAL
  // ========================
  const handleSaveGeneral = async () => {
    try {
      await updateActivity({
        activityId,
        subject: general.subject,
        notes: general.notes || null,
        priority: general.priority,
      });

      setAlert({ type: "success", message: "Đã lưu thông tin chung!" });
    } catch (err: unknown) {
      setAlert({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Không thể lưu thông tin chung",
      });
    }
  };

  // ========================
  // SAVE MEETING DETAIL
  // ========================
  const handleSaveMeetingDetail = async () => {
    try {
      await updateMeetingDetail(activityId, {
        activity_id: activityId,
        start_at: meetingInfo.start_at
          ? new Date(meetingInfo.start_at)
          : null,
        end_at: meetingInfo.end_at ? new Date(meetingInfo.end_at) : null,
        location: meetingInfo.location || null,
        attendees: meetingInfo.attendees || null,
        meeting_link: meetingInfo.meeting_link || null,
      });

      setAlert({
        type: "success",
        message: "Đã lưu thông tin chi tiết Meeting!",
      });
    } catch (err: unknown) {
      setAlert({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Không thể lưu chi tiết meeting",
      });
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!detail) return <div className="p-8 text-center">Không tìm thấy cuộc họp</div>;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4 max-w-5xl mx-auto">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="w-6 h-6 text-orange-500" />
          Cập nhật cuộc họp
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

        {/* ==============================
            1️⃣ GENERAL INFORMATION
        =============================== */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Thông tin chung</h2>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 pt-5">

            <FormInput
              label="Tiêu đề cuộc họp"
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
                    e.target.value as "low" | "medium" | "high"
                  )
                }
                className="border px-4 py-2 rounded-lg"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </select>
            </div>

            {/* NOTES */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Ghi chú
              </label>
              <textarea
                rows={4}
                className="w-full border rounded-lg px-4 py-3"
                value={general.notes}
                onChange={(e) => updateGeneral("notes", e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveGeneral}>
                Lưu thông tin chung
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ==============================
            2️⃣ MEETING DETAIL
        =============================== */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Chi tiết cuộc họp</h2>
          </CardHeader>

          <Separator />

          <CardContent className="space-y-6 pt-5">

            {/* START + END */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm mb-2">Thời gian bắt đầu</label>
                <input
                  type="datetime-local"
                  className="border w-full rounded-lg px-4 py-2"
                  value={meetingInfo.start_at}
                  onChange={(e) =>
                    updateMeetingInfo("start_at", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Thời gian kết thúc</label>
                <input
                  type="datetime-local"
                  className="border w-full rounded-lg px-4 py-2"
                  value={meetingInfo.end_at}
                  onChange={(e) =>
                    updateMeetingInfo("end_at", e.target.value)
                  }
                />
              </div>
            </div>

            {/* LOCATION */}
            <FormInput
              label="Địa điểm"
              value={meetingInfo.location}
              onChange={(v) => updateMeetingInfo("location", v)}
              icon={<MapPin className="w-4 h-4" />}
            />

            {/* ATTENDEES */}
            <FormInput
              label="Người tham dự"
              value={meetingInfo.attendees}
              onChange={(v) => updateMeetingInfo("attendees", v)}
              icon={<Users className="w-4 h-4" />}
            />

            {/* MEETING LINK */}
            <FormInput
              label="Link họp"
              value={meetingInfo.meeting_link}
              onChange={(v) => updateMeetingInfo("meeting_link", v)}
              icon={<Link2 className="w-4 h-4" />}
            />

            <div className="flex justify-end">
              <Button onClick={handleSaveMeetingDetail}>
                Lưu chi tiết cuộc họp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
