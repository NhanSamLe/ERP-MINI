import React, { useState, useEffect } from "react";
import { CreateTaxRateDto, Tax, UpdateTaxRateDto } from "../dto/tax.dto";
import { Button } from "../../../components/ui/Button";
import { FormInput } from "../../../components/ui/FormInput";
import { Alert } from "../../../components/ui/Alert";
import { AppliesTo, TaxType } from "../../../types/enum";

interface Props {
  data: Tax | null;
  onClose: () => void;
  onSubmitCreate: (data: CreateTaxRateDto) => void;
  onSubmitUpdate: (id: number, data: UpdateTaxRateDto) => void;
}

export default function TaxFormModal({
  data,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: Props) {
  const isEdit = !!data?.id;
  const TAX_TYPE_OPTIONS: TaxType[] = [
  "VAT",
  "CIT",
  "PIT",
  "IMPORT",
  "EXPORT",
  "EXCISE",
  "ENVIRONMENTAL",
  "OTHER",
];
  const APPLIES_OPTIONS: AppliesTo[] = ["sale", "purchase", "both"];

  const [form, setForm] = useState<CreateTaxRateDto>({
    code: "",
    name: "",
    type: "VAT",
    rate: 0,
    applies_to: "both",
    is_vat: false,
    effective_date: "",
    expiry_date: null,
    status: "active",
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setForm({
        code: data.code,
        name: data.name,
        type: data.type,
        rate: data.rate,
        applies_to: data.applies_to,
        is_vat: data.is_vat,
        effective_date: data.effective_date ? data.effective_date.split("T")[0] : "",
        expiry_date: data.expiry_date ? data.expiry_date.split("T")[0] : "",
        status: data.status,
      });
    }
  }, [data]);

  const updateField = <K extends keyof CreateTaxRateDto>(
    field: K,
    value: CreateTaxRateDto[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.name || (!isEdit && !form.code)) {
      setError("Code & Name are required!");
      return;
    }
    let isVat= false;
    if(form.applies_to.toString() =="VAT")
    {
      isVat = true;
    }
    setError(null);

    if (isEdit) {
      const dto: UpdateTaxRateDto = {
        name: form.name,
        type: form.type,
        rate: form.rate,
        applies_to: form.applies_to,
        is_vat: isVat,
        effective_date: form.effective_date,
        expiry_date: form.expiry_date,
        status: form.status,
      };
      onSubmitUpdate(data!.id, dto);
    } else {
      onSubmitCreate(form);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xl space-y-4">
        <h2 className="text-lg font-semibold">
          {isEdit ? "Edit Tax Rate" : "Add Tax Rate"}
        </h2>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        {/* RESPONSIVE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* CODE */}
          <div className="md:col-span-2">
            <FormInput
              label="Tax Code"
              required
              value={form.code}
              disabled={isEdit}
              onChange={(v) => updateField("code", v)}
            />
          </div>

          {/* NAME */}
          <div className="md:col-span-2">
            <FormInput
              label="Tax Name"
              required
              value={form.name}
              onChange={(v) => updateField("name", v)}
            />
          </div>

          {/* RATE */}
          <FormInput
            label="Rate (%)"
            type="number"
            value={String(form.rate)}
            onChange={(v) => updateField("rate", Number(v))}
          />

          {/* TAX TYPE */}
          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              className="border p-2 w-full rounded mt-1"
              value={form.type}
              onChange={(e) => updateField("type", e.target.value as TaxType)}
            >
              {TAX_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t.toString()}
                </option>
              ))}
            </select>
          </div>

          {/* APPLIES TO */}
          <div>
            <label className="text-sm font-medium">Applies To</label>
             <select
              className="border p-2 w-full rounded mt-1"
              value={form.applies_to}
              onChange={(e) => updateField("applies_to", e.target.value as AppliesTo)}
            >
              {APPLIES_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS */}
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              className="border p-2 w-full rounded mt-1"
              value={form.status}
              onChange={(e) =>
                updateField("status", e.target.value as "active" | "inactive")
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* EFFECTIVE DATE */}
          <FormInput
            label="Effective Date"
            type="date"
            value={form.effective_date ?? ""}
            onChange={(v) => updateField("effective_date", v)}
          />

          {/* EXPIRY DATE */}
          <FormInput
            label="Expiry Date"
            type="date"
            value={form.expiry_date ?? ""}
            onChange={(v) => updateField("expiry_date", v)}
          />

          
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Save</Button>
        </div>
      </div>
    </div>
  );
}
