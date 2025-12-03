// src/features/crm/pages/EmailUpdatePage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getActivityDetail,
  updateActivity,
  updateEmailDetail,
} from "../service/activity.service";

import { Activity } from "../dto/activity.dto";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/buttonn";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import { FormInput } from "@/components/ui/FormInput";

import {
  ArrowLeft,
  Mail,
  Settings,
  PenLine,
  FileText,
} from "lucide-react";

import TipTapEditor from "../components/TipTapEditor";

export default function EmailUpdatePage() {
  const { id } = useParams();
  const activityId = Number(id);
  const navigate = useNavigate();

  const [detail, setDetail] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // ========================================================
  // FORM STATE
  // ========================================================
  const [general, setGeneral] = useState({
    subject: "",
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
  });

  const [emailInfo, setEmailInfo] = useState({
    subject:"",
    cc: "",
    bcc: "",
    html_body: "",
  });

  const updateGeneral = <K extends keyof typeof general>(
    k: K,
    v: typeof general[K]
  ) => setGeneral((p) => ({ ...p, [k]: v }));

  const updateEmailInfo = <K extends keyof typeof emailInfo>(
    k: K,
    v: typeof emailInfo[K]
  ) => setEmailInfo((p) => ({ ...p, [k]: v }));

  const htmlToText = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.innerText;
  };

  // ========================================================
  // LOAD DETAIL
  // ========================================================
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

      if (res.email) {
        setEmailInfo({
          subject: res.email.subject ||"",
          cc: res.email.cc || "",
          bcc: res.email.bcc || "",
          html_body: res.email.html_body || "",
        });
      }

    } catch (err) {
      setAlert({
        type: "error",
        message: err instanceof Error ? err.message : "Không thể tải dữ liệu email",
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // SAVE GENERAL
  // ========================================================
  const handleSaveGeneral = async () => {
    try {
      await updateActivity({
        activityId,
        subject: general.subject,
        notes: general.notes || null,
        priority: general.priority,
      });

      setAlert({ type: "success", message: "Đã lưu thông tin chung!" });
    } catch {
      setAlert({ type: "error", message: "Không thể lưu thông tin chung" });
    }
  };

  // ========================================================
  // SAVE EMAIL DETAIL
  // ========================================================
  const handleSaveEmailDetail = async () => {
    try {
      await updateEmailDetail(activityId, {
        activity_id: activityId,
        cc: emailInfo.cc || null,
        subject: emailInfo.subject||"",
        bcc: emailInfo.bcc || null,
        html_body: emailInfo.html_body || null,
        text_body: htmlToText(emailInfo.html_body),
      });

      setAlert({ type: "success", message: "Đã lưu chi tiết email!" });
    } catch {
      setAlert({ type: "error", message: "Không thể lưu chi tiết email" });
    }
  };

  // ========================================================
  // RENDER
  // ========================================================
  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!detail?.email)
    return <div className="p-8 text-center">Không tìm thấy email</div>;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4 max-w-5xl mx-auto">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Mail className="w-6 h-6 text-blue-500" />
          Cập nhật Email
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

        {/* ========================================================
            GENERAL INFORMATION
        ========================================================= */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Settings className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Thông tin chung</h2>
          </CardHeader>

          <Separator />

          <CardContent className="pt-5 space-y-6">

            <FormInput
              label="Tiêu đề email"
              required
              value={general.subject}
              onChange={(v) => updateGeneral("subject", v)}
            />

            {/* PRIORITY */}
            <div>
              <label className="block text-sm font-medium mb-2">Mức ưu tiên</label>
              <select
                className="border px-4 py-2 rounded-lg"
                value={general.priority}
                onChange={(e) =>
                  updateGeneral("priority", e.target.value as "low" | "medium" | "high")
                }
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
                rows={5}
                value={general.notes}
                className="w-full border rounded-lg px-4 py-3"
                onChange={(e) => updateGeneral("notes", e.target.value)}
              />
            </div>

            {/* SAVE GENERAL */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveGeneral}>Lưu thông tin chung</Button>
            </div>

          </CardContent>
        </Card>

        {/* ========================================================
            READ ONLY EMAIL INFO
        ========================================================= */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Thông tin email (không chỉnh sửa)</h2>
          </CardHeader>
          <Separator />

          <CardContent className="pt-4 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Direction</span>
              <span className="font-medium">{detail.email.direction}</span>
            </div>

            <div className="flex justify-between">
              <span>Email From</span>
              <span className="font-medium">{detail.email.email_from}</span>
            </div>

            <div className="flex justify-between">
              <span>Email To</span>
              <span className="font-medium">{detail.email.email_to}</span>
            </div>

            {detail.email.status && (
              <div className="flex justify-between">
                <span>Status</span>
                <span className="font-medium">{detail.email.status}</span>
              </div>
            )}

            {detail.email.message_id && (
              <div className="flex justify-between">
                <span>Message ID</span>
                <span className="font-medium">{detail.email.message_id}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ========================================================
            EMAIL DETAIL – TipTap HTML Editor
        ========================================================= */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <PenLine className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Chi tiết email</h2>
          </CardHeader>
          <Separator />

          <CardContent className="pt-5 space-y-6">

            <FormInput
              label="Tiêu Đề Email"
              value={emailInfo.subject}
              onChange={(v) => updateEmailInfo("subject", v)}
              placeholder="Tiêu Đề"
            />
            {/* CC */}
            <FormInput
              label="CC"
              value={emailInfo.cc}
              onChange={(v) => updateEmailInfo("cc", v)}
              placeholder="cc@example.com"
            />

            {/* BCC */}
            <FormInput
              label="BCC"
              value={emailInfo.bcc}
              onChange={(v) => updateEmailInfo("bcc", v)}
              placeholder="bcc@example.com"
            />

            {/* HTML BODY */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Nội dung email (HTML)</label>
              <TipTapEditor
                value={emailInfo.html_body}
                onChange={(val) => updateEmailInfo("html_body", val)}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveEmailDetail}>Lưu chi tiết email</Button>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
