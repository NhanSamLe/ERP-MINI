// src/features/crm/pages/OpportunityCreatePage.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { createOpportunity } from "../store/opportunity/opportunity.thunks";
import { CreateOpportunityDto } from "../dto/opportunity.dto";
// import { OpportunityStage } from "../../../types/enum";
import { UiAlert } from "../../../types/ui";
import { FormInput } from "../../../components/ui/FormInput";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";

export default function OpportunityCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { loading, error } = useAppSelector((s) => s.opportunity);

  const [alert, setAlert] = useState<UiAlert | null>(null);

  const [form, setForm] = useState({
    lead_id: "",
    name: "",
    expected_value: "",
    probability: "",
    closing_date: "",
    notes: "",
  });

  const updateField = <K extends keyof typeof form>(
    key: K,
    value: typeof form[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleCreate = async () => {
    if (!form.name || !form.lead_id) {
      setAlert({ type: "warning", message: "Name và Lead ID là bắt buộc" });
      return;
    }

    const payload: CreateOpportunityDto = {
      lead_id: Number(form.lead_id),
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow space-y-6">

        <h1 className="text-xl font-bold">Tạo Opportunity mới</h1>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
        {error && <Alert type="error" message={error} />}

        <FormInput
          label="Lead ID"
          value={form.lead_id}
          onChange={(v) => updateField("lead_id", v)}
          required
        />

        <FormInput
          label="Tên Opportunity"
          value={form.name}
          onChange={(v) => updateField("name", v)}
          required
        />

        <FormInput
          label="Expected Value (USD)"
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

        <FormInput
          label="Ghi chú"
          textarea
          value={form.notes}
          onChange={(v) => updateField("notes", v)}
        />

        <Button fullWidth loading={loading} onClick={handleCreate}>
          Create Opportunity
        </Button>
      </div>
    </div>
  );
}
