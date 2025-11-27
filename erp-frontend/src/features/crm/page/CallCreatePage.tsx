// src/features/crm/pages/CallCreatePage.tsx

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../../../store/hooks";

import { createCallActivity } from "../service/activity.service";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { FormInput } from "../../../components/ui/FormInput";

import {
  ArrowLeft,
  Phone,
  // PhoneOutgoing,
  // PhoneIncoming,
  // Info,
} from "lucide-react";

type RelatedType = "lead" | "opportunity" | "customer";

const MOCK_CUSTOMERS = [
  { id: 1, name: "Công ty ABC", phone: "0902333444" },
  { id: 2, name: "Công ty XYZ", phone: "0911222333" },
];

export default function CallCreatePage() {
  const navigate = useNavigate();

  // =============================
  // GET REDUX DATA
  // =============================
  const currentUser = useAppSelector((s) => s.auth.user);
  const myLeads = useAppSelector((s) => s.lead.allLeads) || [];
  const myOpps = useAppSelector((s) => s.opportunity.allOpportunities) || [];

  const owner_id = currentUser?.id || 1;
  const owner_phone = currentUser?.phone || "";

  // =============================
  // FORM STATE
  // =============================
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  const [form, setForm] = useState({
    subject: "",
    related_type: "lead" as RelatedType,
    related_id: "",
    is_inbound: false, // false = outgoing
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
    call_from: "",
    call_to: "",
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // =============================
  // RELATED LIST
  // =============================
  const relatedList = useMemo(() => {
    if (form.related_type === "lead") {
      return myLeads.map((l) => ({ id: l.id, name: l.name, phone: l.phone }));
    }
    if (form.related_type === "opportunity") {
      return myOpps.map((o) => ({
        id: o.id,
        name: o.name,
        phone: o.lead?.phone || o.customer?.phone || "",
      }));
    }
    return MOCK_CUSTOMERS;
  }, [form.related_type, myLeads, myOpps]);

  // =============================
  // AUTO-FILL CALL FROM / CALL TO
  // =============================
  const handleDirectionChange = (value: string) => {
    const is_inbound = value === "inbound";
    update("is_inbound", is_inbound);

    const target = relatedList.find((x) => x.id === Number(form.related_id));
    const targetPhone = target?.phone || "";

    if (is_inbound) {
      update("call_from", targetPhone); // Khách gọi đến
      update("call_to", owner_phone);
    } else {
      update("call_from", owner_phone); // Sale gọi đi
      update("call_to", targetPhone);
    }
  };

  const handleRelatedIdChange = (idStr: string) => {
    update("related_id", idStr);

    const id = Number(idStr);
    const target = relatedList.find((x) => x.id === id);
    const targetPhone = target?.phone || "";

    if (form.is_inbound) {
      update("call_from", targetPhone);
      update("call_to", owner_phone);
    } else {
      update("call_from", owner_phone);
      update("call_to", targetPhone);
    }
  };

  // =============================
  // HANDLE SUBMIT
  // =============================
  const handleCreate = async () => {
    if (!form.subject.trim())
      return setAlert({ type: "warning", message: "Vui lòng nhập tiêu đề cuộc gọi" });

    if (!form.related_id)
      return setAlert({ type: "warning", message: "Vui lòng chọn đối tượng liên quan" });

    try {
      await createCallActivity({
        subject: form.subject,
        related_type: form.related_type,
        related_id: Number(form.related_id),
        owner_id,
        notes: form.notes || null,
        call_from: form.call_from,
        call_to: form.call_to,
        is_inbound: form.is_inbound,
        priority: form.priority,
      });

      setAlert({ type: "success", message: "Ghi log cuộc gọi thành công!" });
      setTimeout(() => navigate(-1), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tạo log cuộc gọi";
      setAlert({ type: "error", message: msg });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-300">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Phone className="w-7 h-7 text-orange-500" />
            Tạo hoạt động cuộc gọi
          </h1>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 space-y-6">

            {/* SUBJECT */}
            <FormInput
              label="Tiêu đề cuộc gọi"
              required
              placeholder="Ví dụ: Gọi tư vấn khách hàng"
              value={form.subject}
              onChange={(v) => update("subject", v)}
            />

            {/* RELATED */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Liên quan đến
                </label>
                <select
                  className="w-full px-4 py-2.5 border rounded-lg"
                  value={form.related_type}
                  onChange={(e) => update("related_type", e.target.value as RelatedType)}
                >
                  <option value="lead">Lead</option>
                  <option value="opportunity">Opportunity</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium mb-2">Loại cuộc gọi</label>
              <select
                value={form.is_inbound ? "inbound" : "outbound"}
                onChange={(e) => handleDirectionChange(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg"
              >
                <option value="outbound">Gọi đi</option>
                <option value="inbound">Gọi đến</option>
              </select>
            </div>

            {/* FROM / TO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput
                label="Gọi từ"
                value={form.call_from}
                onChange={(v) => update("call_from", v)}
              />
              <FormInput
                label="Gọi đến"
                value={form.call_to}
                onChange={(v) => update("call_to", v)}
              />
            </div>

            {/* PRIORITY */}
            <div>
              <label className="block text-sm font-medium mb-2">Mức ưu tiên</label>
              <select
                value={form.priority}
                onChange={(e) => update("priority", e.target.value as typeof form.priority)}
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
                className="w-full border rounded-lg px-4 py-3"
                placeholder="Nội dung cuộc gọi..."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Hủy
              </Button>
              <Button onClick={handleCreate} className="min-w-40">
                Tạo cuộc gọi
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
