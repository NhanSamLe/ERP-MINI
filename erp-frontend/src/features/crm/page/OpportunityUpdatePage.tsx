// src/features/crm/pages/OpportunityUpdatePage.tsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchOpportunityDetail,
  updateOpportunity,
} from "../store/opportunity/opportunity.thunks";

import { UpdateOpportunityDto } from "../dto/opportunity.dto";
import { FormInput } from "../../../components/ui/FormInput";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { UiAlert } from "../../../types/ui";

export default function OpportunityUpdatePage() {
  const { id } = useParams();
  const oppId = Number(id);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { detail, loading, error } = useAppSelector((s) => s.opportunity);
  const [alert, setAlert] = useState<UiAlert | null>(null);

  const [form, setForm] = useState({
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

  useEffect(() => {
    dispatch(fetchOpportunityDetail(oppId));
  }, [dispatch, oppId]);

  useEffect(() => {
    if (detail) {
      setForm({
        name: detail.name ?? "",
        expected_value: detail.expected_value?.toString() ?? "",
        probability: detail.probability?.toString() ?? "",
        closing_date: detail.closing_date ?? "",
        notes: detail.loss_reason ?? "",
      });
    }
  }, [detail]);

  const handleUpdate = async () => {
    const payload: UpdateOpportunityDto = {
      oppId,
      name: form.name,
      expected_value: form.expected_value ? Number(form.expected_value) : undefined,
      probability: form.probability ? Number(form.probability) : undefined,
      closing_date: form.closing_date || null,
      notes: form.notes || undefined,
    };

    try {
      await dispatch(updateOpportunity({ data: payload })).unwrap();
      setAlert({ type: "success", message: "Cập nhật Opportunity thành công!" });

      setTimeout(() => {
        navigate(`/crm/opportunities/${oppId}`);
      }, 800);
    } catch {
      setAlert({ type: "error", message: "Cập nhật thất bại" });
    }
  };

  if (!detail) return <div className="p-6">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow space-y-6">

        <h1 className="text-xl font-bold">Cập nhật Opportunity</h1>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
        {error && <Alert type="error" message={error} />}

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
        />

        <FormInput
          label="Probability (%)"
          value={form.probability}
          onChange={(v) => updateField("probability", v)}
        />

        <FormInput
          label="Closing Date"
          type="date"
          value={form.closing_date ?? ""}
          onChange={(v) => updateField("closing_date", v)}
        />

        <FormInput
          label="Notes"
          textarea
          value={form.notes}
          onChange={(v) => updateField("notes", v)}
        />

        <Button fullWidth loading={loading} onClick={handleUpdate}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
