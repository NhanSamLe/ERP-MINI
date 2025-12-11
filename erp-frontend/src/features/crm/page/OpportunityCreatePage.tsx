import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchAllLeads } from "../store/lead/lead.thunks";
import { createOpportunity } from "../store/opportunity/opportunity.thunks";

import { fetchPartners } from "../../partner/partner.service"; // <-- Service from file
import { Partner } from "../../partner/store/partner.types";   // <-- Type from file
import { Lead } from "../dto/lead.dto";
import { CreateOpportunityDto } from "../dto/opportunity.dto";

import { UiAlert } from "../../../types/ui";
import { FormInput } from "../../../components/ui/FormInput";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";

export default function OpportunityCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // ------------------- STATE -------------------
  const { allLeads } = useAppSelector((s) => s.lead);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [alert, setAlert] = useState<UiAlert | null>(null);

  const [mode, setMode] = useState<"lead" | "customer">("lead"); // Mode tạo

  const [form, setForm] = useState({
    related_id: "",
    name: "",
    expected_value: "",
    probability: "",
    closing_date: "",
    notes: "",
  });

  const updateField = <K extends keyof typeof form>(k: K, v: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  // ------------------- LOAD DATA -------------------
  useEffect(() => {
    dispatch(fetchAllLeads());
    loadCustomers();
  }, [dispatch]);

  const loadCustomers = async () => {
    try {
      const customers = await fetchPartners({ type: "customer" });
      setPartners(customers);
    } catch (err) {
      console.error(err);
    }
  };

  // ------------------- SUBMIT -------------------
  const handleCreate = async () => {
    if (!form.name || !form.related_id) {
      setAlert({ type: "warning", message: "Hãy chọn Lead/Customer và nhập tên." });
      return;
    }

    const payload: CreateOpportunityDto = {
      related_type: mode, // "lead" | "customer"
      related_id: Number(form.related_id),
      name: form.name,
      expected_value: form.expected_value ? Number(form.expected_value) : undefined,
      probability: form.probability ? Number(form.probability) : undefined,
      closing_date: form.closing_date || null,
    };

    try {
      const result = await dispatch(createOpportunity(payload)).unwrap();
      setAlert({ type: "success", message: "Tạo Opportunity thành công!" });

      setTimeout(() => {
        navigate(`/crm/opportunities/${result.id}`);
      }, 700);
    } catch {
      setAlert({ type: "error", message: "Không thể tạo Opportunity" });
    }
  };

  // ------------------- JSX -------------------
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow space-y-6">

        <h1 className="text-xl font-bold">Tạo Opportunity mới</h1>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* =================== TOGGLE MODE =================== */}
        <div className="flex gap-3 bg-gray-100 p-2 rounded-lg">
          <button
            className={`flex-1 py-2 rounded-lg ${
              mode === "lead" ? "bg-orange-500 text-white" : "text-gray-600"
            }`}
            onClick={() => setMode("lead")}
          >
            Tạo từ Lead
          </button>

          <button
            className={`flex-1 py-2 rounded-lg ${
              mode === "customer" ? "bg-orange-500 text-white" : "text-gray-600"
            }`}
            onClick={() => setMode("customer")}
          >
            Tạo từ Customer
          </button>
        </div>

        {/* =================== SELECT LEAD OR CUSTOMER =================== */}
        {mode === "lead" && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Chọn Lead</label>
            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={form.related_id}
              onChange={(e) => updateField("related_id", e.target.value)}
            >
              <option value="">-- Chọn Lead --</option>
              {allLeads.map((lead: Lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} — {lead.email ?? "no email"}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === "customer" && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Chọn Customer</label>
            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={form.related_id}
              onChange={(e) => updateField("related_id", e.target.value)}
            >
              <option value="">-- Chọn Customer --</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.phone ?? "no phone"}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* =================== FORM INPUT =================== */}
        <FormInput
          label="Tên Opportunity"
          value={form.name}
          onChange={(v) => updateField("name", v)}
          required
        />

        <FormInput
          label="Expected Value"
          value={form.expected_value}
          onChange={(v) => updateField("expected_value", v)}
          placeholder="5000"
        />

        <FormInput
          label="Probability (%)"
          value={form.probability}
          onChange={(v) => updateField("probability", v)}
          placeholder="50"
        />

        <FormInput
          label="Closing Date"
          type="date"
          value={form.closing_date}
          onChange={(v) => updateField("closing_date", v)}
        />
        <Button fullWidth onClick={handleCreate}>
          Create Opportunity
        </Button>

      </div>
    </div>
  );
}
