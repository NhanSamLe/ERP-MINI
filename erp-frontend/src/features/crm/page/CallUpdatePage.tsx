// src/features/crm/pages/CallUpdatePage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getActivityDetail,
  updateActivity,
  updateCallDetail
} from "../service/activity.service";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/buttonn";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FormInput } from "@/components/ui/FormInput";

import {
  ArrowLeft,
  Phone,
  Settings,
  PhoneCall,
  Mic,
  Clock,
  FileText,
} from "lucide-react";

import { Activity } from "../dto/activity.dto";
import { ResultType } from "@/types/enum";

export default function CallUpdatePage() {
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

  const [callInfo, setCallInfo] = useState({
    duration: "",
    result: null as ResultType | null,
    recording_url: "",
  });

  const updateGeneral = <K extends keyof typeof general>(k: K, v: typeof general[K]) =>
    setGeneral((p) => ({ ...p, [k]: v }));

  const updateCallInfo = <K extends keyof typeof callInfo>(k: K, v: typeof callInfo[K]) =>
    setCallInfo((p) => ({ ...p, [k]: v }));

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

      setGeneral({
        subject: res.subject || "",
        priority: res.priority || "medium",
        notes: res.notes || "",
      });

      setCallInfo({
        duration: res.call?.duration?.toString() || "",
        result: (res.call?.result as ResultType) ?? null,
        recording_url: res.call?.recording_url || "",
      });

    } catch (err: unknown) {
      setAlert({
        type: "error",
        message: err instanceof Error ? err.message : "Không thể tải dữ liệu",
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // SAVE GENERAL INFO
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
          err instanceof Error ? err.message : "Không thể lưu thông tin chung",
      });
    }
  };

  // ========================
  // SAVE CALL DETAIL
  // ========================
  const handleSaveCallDetail = async () => {
    try {
      await updateCallDetail(activityId, {
        activity_id: activityId,
        duration: callInfo.duration ? Number(callInfo.duration) : null,
        result: callInfo.result || null,
        recording_url: callInfo.recording_url || null,
      });

      setAlert({ type: "success", message: "Đã lưu chi tiết cuộc gọi!" });

    } catch (err: unknown) {
      setAlert({
        type: "error",
        message:
          err instanceof Error ? err.message : "Không thể lưu chi tiết cuộc gọi",
      });
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!detail) return <div className="p-8 text-center">Không tìm thấy hoạt động</div>;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4 max-w-5xl mx-auto">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Phone className="w-6 h-6 text-orange-500" />
          Cập nhật cuộc gọi
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
            <Settings className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Thông tin chung</h2>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 pt-5">

            <FormInput
              label="Tiêu đề cuộc gọi"
              required
              value={general.subject}
              onChange={(v) => updateGeneral("subject", v)}
            />

            <div>
              <label className="block text-sm font-medium mb-2">Mức ưu tiên</label>
              <select
                value={general.priority}
                onChange={(e) =>
                  updateGeneral("priority", e.target.value as "low" | "medium" | "high")
                }
                className="border px-4 py-2 rounded-lg"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Ghi chú
              </label>
              <textarea
                rows={5}
                value={general.notes}
                onChange={(e) => updateGeneral("notes", e.target.value)}
                className="w-full border rounded-lg px-4 py-3"
              />
            </div>

            {/* SAVE GENERAL BUTTON */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveGeneral}>
                Lưu thông tin chung
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* ==============================
            2️⃣ CALL DETAILS
        =============================== */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <PhoneCall className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Chi tiết cuộc gọi</h2>
          </CardHeader>

          <Separator />

          <CardContent className="space-y-6 pt-5">

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Thời lượng (giây)
              </label>
              <FormInput
                value={callInfo.duration}
                onChange={(v) =>
                  updateCallInfo("duration", v.replace(/\D/g, ""))
                }
                placeholder="VD: 120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Kết quả cuộc gọi
              </label>
              <select
                className="border px-4 py-2 rounded-lg"
                value={callInfo.result || ""}
                onChange={(e) =>
                  updateCallInfo("result", e.target.value as ResultType)
                }
              >
                <option value="">— Chọn kết quả —</option>
                <option value="connected">Connected</option>
                <option value="no_answer">No Answer</option>
                <option value="busy">Busy</option>
                <option value="failed">Failed</option>
                <option value="call_back">Call Back</option>
                <option value="wrong_number">Wrong Number</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Link ghi âm
              </label>
              <FormInput
                value={callInfo.recording_url}
                onChange={(v) => updateCallInfo("recording_url", v)}
                placeholder="https://..."
              />
            </div>

            {/* SAVE CALL DETAIL BUTTON */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveCallDetail}>
                Lưu chi tiết cuộc gọi
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
