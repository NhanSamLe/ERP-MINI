// src/features/crm/pages/MeetingCreatePage.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/buttonn";
import { Alert } from "@/components/ui/Alert";
import { FormInput } from "@/components/ui/FormInput";

import { Calendar, ArrowLeft, MapPin, Users, Link2 } from "lucide-react";

import { createMeetingActivity } from "../service/activity.service";

import { getAllLeads } from "../service/lead.service";
import { getAllOpportunities } from "../service/opportunity.service";
import { fetchPartners } from "../../partner/partner.service";

import { Lead } from "../dto/lead.dto";
import { Opportunity } from "../dto/opportunity.dto";
import { Partner } from "../../partner/store/partner.types";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
type RelatedType = "lead" | "opportunity" | "customer";

interface SimpleItem {
  id: number;
  name: string;
  email?: string | null;
}

/* ============================
   Loading Overlay Component
=============================*/
function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50">
      <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );
}

export default function MeetingCreatePage() {
  const navigate = useNavigate();

const currentUserId= useSelector((state: RootState) => state.auth.user?.id);

  // ===========================================
  // STATE
  // ===========================================
  const [loading, setLoading] = useState(true); // load dữ liệu
  const [submitting, setSubmitting] = useState(false); // load khi submit

  const [leads, setLeads] = useState<SimpleItem[]>([]);
  const [opps, setOpps] = useState<SimpleItem[]>([]);
  const [customers, setCustomers] = useState<SimpleItem[]>([]);

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  const [form, setForm] = useState({
    subject: "",
    related_type: "lead" as RelatedType,
    related_id: "",
    start_at: "",
    end_at: "",
    location: "",
    attendees: "",
    meeting_link: "",
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ===========================================
  // LOAD RELATED DATA
  // ===========================================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Leads
      const leadList: Lead[] = await getAllLeads();
      setLeads(leadList.map((l) => ({ id: l.id, name: l.name, email: l.email })));

      // Opportunities
      const oppList: Opportunity[] = await getAllOpportunities();
      setOpps(
        oppList.map((o) => ({
          id: o.id,
          name: o.name,
          email: o.lead?.email || o.customer?.email || "",
        }))
      );

      // Customers
      const customerList: Partner[] = await fetchPartners({
        type: "customer",
        status: "active",
      });
      setCustomers(
        customerList.map((c) => ({ id: c.id, name: c.name, email: c.email }))
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Không thể tải dữ liệu liên quan";
      setAlert({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // SELECT RELATED LIST
  // ===========================================
  const relatedList = useMemo<SimpleItem[]>(() => {
    switch (form.related_type) {
      case "lead":
        return leads;
      case "opportunity":
        return opps;
      default:
        return customers;
    }
  }, [form.related_type, leads, opps, customers]);

  // ===========================================
  // SUBMIT
  // ===========================================
  const handleCreate = async () => {
    if (!form.subject.trim())
      return setAlert({ type: "warning", message: "Vui lòng nhập tiêu đề cuộc họp" });

    if (!form.related_id)
      return setAlert({ type: "warning", message: "Vui lòng chọn đối tượng liên quan" });

    if (!form.start_at || !form.end_at)
      return setAlert({
        type: "warning",
        message: "Vui lòng chọn thời gian bắt đầu và kết thúc",
      });

    if (new Date(form.end_at) <= new Date(form.start_at))
      return setAlert({
        type: "warning",
        message: "Thời gian kết thúc phải sau thời gian bắt đầu",
      });

    try {
      setSubmitting(true);

      await createMeetingActivity({
        subject: form.subject,
        related_type: form.related_type,
        related_id: Number(form.related_id),
        owner_id: currentUserId ?? 1 ,
        start_at: new Date(form.start_at),
        end_at: new Date(form.end_at),
        location: form.location || null,
        attendees: form.attendees || null,
        meeting_link: form.meeting_link || null,
        notes: form.notes || null,
        priority: form.priority,
      });

      setAlert({ type: "success", message: "Tạo cuộc họp thành công!" });

      setTimeout(() => navigate(-1), 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tạo cuộc họp";
      setAlert({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // ===========================================
  // UI
  // ===========================================
  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-300">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-7 h-7 text-orange-500" />
            Tạo cuộc họp mới
          </h1>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-4xl mx-auto px-6 py-8 relative">
        {loading && <LoadingOverlay />}

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            className="mb-6"
          />
        )}

        {/* FORM */}
        <div className="bg-white rounded-xl border shadow-sm px-8 py-6 space-y-6 relative">

          {/* SUBJECT */}
          <FormInput
            label="Tiêu đề cuộc họp"
            required
            placeholder="VD: Họp triển khai kế hoạch Q1"
            value={form.subject}
            onChange={(v) => update("subject", v)}
          />

          {/* RELATED SELECT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm mb-2">Liên quan đến</label>
              <select
                value={form.related_type}
                onChange={(e) => update("related_type", e.target.value as RelatedType)}
                className="border px-4 py-2.5 rounded-lg w-full"
              >
                <option value="lead">Lead</option>
                <option value="opportunity">Opportunity</option>
                <option value="customer">Customer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Đối tượng</label>
              <select
                value={form.related_id}
                onChange={(e) => update("related_id", e.target.value)}
                className="border px-4 py-2.5 rounded-lg w-full"
              >
                <option value="">— Chọn —</option>
                {relatedList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DATE & TIME */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm mb-2">Thời gian bắt đầu</label>
              <input
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => update("start_at", e.target.value)}
                className="border px-4 py-2.5 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Thời gian kết thúc</label>
              <input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => update("end_at", e.target.value)}
                className="border px-4 py-2.5 rounded-lg w-full"
              />
            </div>
          </div>

          {/* LOCATION */}
          <FormInput
            label="Địa điểm"
            placeholder="VD: Phòng họp A1 – Tòa nhà chính"
            value={form.location}
            onChange={(v) => update("location", v)}
            icon={<MapPin className="w-4 h-4" />}
          />

          {/* ATTENDEES */}
          <FormInput
            label="Người tham dự"
            placeholder="Nhập danh sách email, cách nhau bằng dấu phẩy"
            value={form.attendees}
            onChange={(v) => update("attendees", v)}
            icon={<Users className="w-4 h-4" />}
          />

          {/* MEETING LINK */}
          <FormInput
            label="Link họp"
            placeholder="https://meet.google.com/abc-defg-hij"
            value={form.meeting_link}
            onChange={(v) => update("meeting_link", v)}
            icon={<Link2 className="w-4 h-4" />}
          />

          {/* PRIORITY */}
          <div>
            <label className="block text-sm mb-2">Mức ưu tiên</label>
            <select
              value={form.priority}
              onChange={(e) => update("priority", e.target.value as "low" | "medium" | "high")}
              className="border px-4 py-2.5 rounded-lg w-full"
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>

          {/* NOTES */}
          <div>
            <label className="block text-sm mb-2">Ghi chú</label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="border px-4 py-2.5 rounded-lg w-full"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
              Hủy
            </Button>

            <Button
              className="min-w-40 flex justify-center"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                "Tạo cuộc họp"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
