// src/features/crm/pages/TaskCreatePage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/buttonn";
import { Alert } from "@/components/ui/Alert";
import { FormInput } from "@/components/ui/FormInput";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { Calendar, ArrowLeft, CheckSquare } from "lucide-react";

import { createTaskActivity } from "../service/activity.service";

import { getAllLeads } from "../service/lead.service";
import { getAllOpportunities } from "../service/opportunity.service";
import { fetchPartners } from "../../partner/partner.service";

import { Lead } from "../dto/lead.dto";
import { Opportunity } from "../dto/opportunity.dto";
import { Partner } from "../../partner/store/partner.types";

type RelatedType = "lead" | "opportunity" | "customer";

interface SimpleItem {
  id: number;
  name: string;
}

export default function TaskCreatePage() {
  const navigate = useNavigate();

  // ============================
  // STATE
  // ============================
  const [leads, setLeads] = useState<SimpleItem[]>([]);
  const [opps, setOpps] = useState<SimpleItem[]>([]);
  const [customers, setCustomers] = useState<SimpleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // ============================
  // CURRENT USER (mock)
  // ============================
  const currentUserId= useSelector((state: RootState) => state.auth.user?.id);

  // ============================
  // FORM STATE
  // ============================
  const [form, setForm] = useState({
    subject: "",
    related_type: "lead" as RelatedType,
    related_id: "",
    due_at: "",
    reminder_at: "",
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

      // Leads
      const leadList: Lead[] = await getAllLeads();
      setLeads(
        leadList.map((l) => ({
          id: l.id,
          name: l.name,
        }))
      );

      // Opportunities
      const oppList: Opportunity[] = await getAllOpportunities();
      setOpps(
        oppList.map((o) => ({
          id: o.id,
          name: o.name,
        }))
      );

      // Customers
      const partnerList: Partner[] = await fetchPartners({
        type: "customer",
        status: "active",
      });

      setCustomers(
        partnerList.map((p) => ({
          id: p.id,
          name: p.name,
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
  // RELATED LIST BY TYPE
  // ============================
  const relatedList = useMemo<SimpleItem[]>(() => {
    if (form.related_type === "lead") return leads;
    if (form.related_type === "opportunity") return opps;
    return customers;
  }, [form.related_type, leads, opps, customers]);

  // ============================
  // SUBMIT
  // ============================
  const handleCreate = async () => {
    if (!form.subject.trim()) {
      return setAlert({
        type: "warning",
        message: "Vui lòng nhập tiêu đề Task",
      });
    }

    if (!form.related_id) {
      return setAlert({
        type: "warning",
        message: "Vui lòng chọn đối tượng liên quan",
      });
    }

    if (!form.due_at) {
      return setAlert({
        type: "warning",
        message: "Vui lòng chọn ngày đáo hạn",
      });
    }

    try {
      await createTaskActivity({
        subject: form.subject,
        related_type: form.related_type,
        related_id: Number(form.related_id),
        owner_id: currentUserId ??1 ,
        due_at: new Date(form.due_at),
        reminder_at: form.reminder_at ? new Date(form.reminder_at) : null,
        priority: form.priority,
        notes: form.notes || null,
      });

      setAlert({
        type: "success",
        message: "Tạo Task thành công!",
      });

      setTimeout(() => navigate(-1), 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tạo Task";
      setAlert({ type: "error", message: msg });
    }
  };

  // ============================
  // UI
  // ============================
  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <h1 className="text-2xl font-bold flex items-center gap-3">
            <CheckSquare className="w-7 h-7 text-orange-500" />
            Tạo Task mới
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
            label="Tên Task"
            required
            placeholder="Ví dụ: Gửi báo giá cho khách"
            value={form.subject}
            onChange={(v) => update("subject", v)}
          />

          {/* RELATED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="block text-sm font-medium mb-2">Liên quan đến</label>

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
              <label className="block text-sm font-medium mb-2">Chọn đối tượng</label>

              <select
                value={form.related_id}
                onChange={(e) => update("related_id", e.target.value)}
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

          {/* DUE DATE */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Ngày tới hạn
            </label>

            <input
              type="datetime-local"
              className="w-full px-4 py-2.5 border rounded-lg"
              value={form.due_at}
              min={new Date().toISOString().slice(0,16)}   // 🔥 ràng buộc ngày >= hiện tại
              onChange={(e) => update("due_at", e.target.value)}
            />
          </div>

          {/* REMINDER */}
          <div>
            <label className="block text-sm font-medium mb-2">Nhắc nhở</label>

            <input
                type="datetime-local"
                className="w-full px-4 py-2.5 border rounded-lg"
                value={form.reminder_at}
                disabled={!form.due_at}      
                min={new Date().toISOString().slice(0,16)}                 // 🔒 phải chọn due_at trước
                max={form.due_at || undefined}              // 🔥 reminder không được vượt quá due_at
                onChange={(e) => update("reminder_at", e.target.value)}
              />
          </div>

          {/* PRIORITY */}
          <div>
            <label className="block text-sm font-medium mb-2">Mức ưu tiên</label>

            <select
              value={form.priority}
              onChange={(e) =>
                update("priority", e.target.value as "low" | "medium" | "high")
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
              rows={6}
              className="w-full px-4 py-3 border rounded-lg"
              placeholder="Nội dung công việc..."
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
              Tạo Task
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
