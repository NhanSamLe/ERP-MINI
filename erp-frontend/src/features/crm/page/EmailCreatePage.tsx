import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/buttonn";
import { Alert } from "../../../components/ui/Alert";
import { FormInput } from "../../../components/ui/FormInput";

import { ArrowLeft, Mail } from "lucide-react";

import { createEmailActivity } from "../service/activity.service";

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
  email: string;
}

export default function EmailCreatePage() {
  const navigate = useNavigate();

  // ============================
  //  STATE
  // ============================
  const [leads, setLeads] = useState<SimpleItem[]>([]);
  const [opps, setOpps] = useState<SimpleItem[]>([]);
  const [customers, setCustomers] = useState<SimpleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // ============================
  // CURRENT USER
  // ============================
 const currentUserId= useSelector((state: RootState) => state.auth.user?.id);
  const owner_email = "owner@example.com";

  // ============================
  // FORM
  // ============================
  const [form, setForm] = useState({
    subject: "",
    related_type: "lead" as RelatedType,
    related_id: "",
    direction: "out" as "in" | "out",
    email_from: owner_email,
    email_to: "",
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ============================
  // LOAD DATA
  // ============================
  useEffect(() => {
    loadRelatedData();
  }, []);

  const loadRelatedData = async () => {
    try {
      setLoading(true);

      const leadList: Lead[] = await getAllLeads();
      setLeads(
        leadList.map((l) => ({
          id: l.id,
          name: l.name,
          email: l.email || "",
        }))
      );

      const oppList: Opportunity[] = await getAllOpportunities();
      setOpps(
        oppList.map((o) => ({
          id: o.id,
          name: o.name,
          email: o.lead?.email || o.customer?.email || "",
        }))
      );

      const partnerList: Partner[] = await fetchPartners({
        type: "customer",
        status: "active",
      });

      setCustomers(
        partnerList.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email || "",
        }))
      );
    } catch {
      setAlert({
        type: "error",
        message: "Không thể tải dữ liệu liên quan",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // CHỌN LIST THEO related_type
  // ============================
  const relatedList = useMemo<SimpleItem[]>(() => {
    if (form.related_type === "lead") return leads;
    if (form.related_type === "opportunity") return opps;
    return customers;
  }, [form.related_type, leads, opps, customers]);

  // ============================
  // AUTO-FILL EMAIL
  // ============================
  const handleRelatedIdChange = (value: string) => {
    update("related_id", value);

    const id = Number(value);
    const target = relatedList.find((x) => x.id === id);
    const targetEmail = target?.email || "";

    if (form.direction === "out") {
      update("email_from", owner_email);
      update("email_to", targetEmail);
    } else {
      update("email_from", targetEmail);
      update("email_to", owner_email);
    }
  };

  const handleDirectionChange = (value: "in" | "out") => {
    update("direction", value);

    const target = relatedList.find((x) => x.id === Number(form.related_id));
    const targetEmail = target?.email || "";

    if (value === "out") {
      update("email_from", owner_email);
      update("email_to", targetEmail);
    } else {
      update("email_from", targetEmail);
      update("email_to", owner_email);
    }
  };

  // ============================
  // SUBMIT
  // ============================
  const handleCreate = async () => {
    if (!form.subject.trim()) {
      return setAlert({
        type: "warning",
        message: "Vui lòng nhập tiêu đề email",
      });
    }

    if (!form.related_id) {
      return setAlert({
        type: "warning",
        message: "Vui lòng chọn đối tượng liên quan",
      });
    }

    try {
      await createEmailActivity({
        subject: form.subject,
        related_type: form.related_type,
        related_id: Number(form.related_id),
        owner_id: currentUserId ?? 1 ,
        direction: form.direction,
        email_from: form.email_from || null,
        email_to: form.email_to || null,
        notes: form.notes || null,
        priority: form.priority,
      });

      setAlert({
        type: "success",
        message: "Tạo hoạt động email thành công!",
      });

      setTimeout(() => navigate(-1), 800);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể tạo hoạt động email";
      setAlert({ type: "error", message });
    }
  };

  // ============================
  // UI
  // ============================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-300">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="w-7 h-7 text-blue-500" />
            Tạo hoạt động email
          </h1>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <div className="bg-white rounded-xl border shadow-sm px-8 py-6 space-y-6">

          {/* SUBJECT */}
          <FormInput
            label="Tiêu đề email"
            required
            placeholder="Ví dụ: Gửi báo giá cho khách hàng"
            value={form.subject}
            onChange={(v) => update("subject", v)}
          />

          {/* RELATED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                Liên quan đến
              </label>
              <select
                value={form.related_type}
                onChange={(e) =>
                  update("related_type", e.target.value as RelatedType)
                }
                className="w-full px-4 py-2.5 border rounded-lg"
              >
                <option value="lead">Lead</option>
                <option value="opportunity">Opportunity</option>
                <option value="customer">Customer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Chọn đối tượng
              </label>

              <select
                value={form.related_id}
                onChange={(e) => handleRelatedIdChange(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg"
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

          {/* DIRECTION */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Loại email
            </label>
            <select
              value={form.direction}
              onChange={(e) =>
                handleDirectionChange(e.target.value as "in" | "out")
              }
              className="w-full px-4 py-2.5 border rounded-lg"
            >
              <option value="out">Email gửi đi</option>
              <option value="in">Email nhận vào</option>
            </select>
          </div>

          {/* EMAIL FROM / TO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
              label="Email từ"
              value={form.email_from}
              onChange={(v) => update("email_from", v)}
            />
            <FormInput
              label="Email đến"
              value={form.email_to}
              onChange={(v) => update("email_to", v)}
            />
          </div>

          {/* PRIORITY */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Mức ưu tiên
            </label>
            <select
              value={form.priority}
              onChange={(e) =>
                update("priority", e.target.value as typeof form.priority)
              }
              className="w-full px-4 py-2.5 border rounded-lg"
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>

          {/* NOTES */}
          <div>
            <label className="block text-sm font-medium mb-2">Ghi chú</label>
            <textarea
              rows={5}
              className="w-full px-4 py-3 border rounded-lg"
              placeholder="Nội dung email..."
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Hủy
            </Button>
            <Button className="min-w-40" onClick={handleCreate} disabled={loading}>
              Tạo email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
