import React, { useState, useEffect } from "react";
import { CreateTaxRateDto, Tax, UpdateTaxRateDto } from "../dto/tax.dto";
import { Button } from "../../../components/ui/Button";
import { FormInput } from "../../../components/ui/FormInput";
import { Alert } from "../../../components/ui/Alert";
import { AppliesTo } from "../../../types/enum";
interface Props {
  data: Tax | null;
  onClose: () => void;
  onSubmitCreate: (data: CreateTaxRateDto) => void;
  onSubmitUpdate: (id: number, data: UpdateTaxRateDto) => void;
}


export default function TaxFormModal({ data, onClose, onSubmitCreate, onSubmitUpdate }: Props) {
  const [form, setForm] = useState<CreateTaxRateDto>({
    code: "",
    name: "",
    type: "VAT",
    rate: 0,
    applies_to: "both",
    status: "active",
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm(prev => ({ ...prev, ...data }));
  }, [data]);

 const handleSubmit = () => {
  if (!form.name || (!data?.id && !form.code)) {
    setError("Code & Name are required for create!");
    return;
  }

  if (data?.id) {
    onSubmitUpdate(data.id, form);
  } else {
    const dto: CreateTaxRateDto = {
      code: form.code!,
      name: form.name,
      type: form.type,
      rate: form.rate,
      applies_to: form.applies_to,
      status: form.status,
    };

    onSubmitCreate(dto);
  }
};

  const updateField = <K extends keyof CreateTaxRateDto>(
  field: K,
  value: CreateTaxRateDto[K]
) => {
  setForm((prev) => ({ ...prev, [field]: value }));
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-md w-96 space-y-4">
        <h2 className="text-lg font-semibold">{data?.id ? "Edit Tax" : "Add Tax"}</h2>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <FormInput label="Tax Code" required value={form.code} disabled={!!data?.id}
          onChange={(v) => updateField("code", v)} />

        <FormInput label="Tax Name" required value={form.name}
          onChange={(v) => updateField("name", v)} />

        <FormInput label="Rate (%)" type="number" value={String(form.rate)}
          onChange={(v) => updateField("rate", Number(v))} />

        <select className="border p-2 w-full rounded"
          value={form.applies_to}
          onChange={(e) => updateField("applies_to", e.target.value  as AppliesTo)}>
          <option value="sale">Sale</option>
          <option value="purchase">Purchase</option>
          <option value="both">Both</option>
        </select>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Save</Button>
        </div>
      </div>
    </div>
  );
}
