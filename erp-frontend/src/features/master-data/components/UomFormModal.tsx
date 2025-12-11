import { useState, useEffect } from "react";
import { CreateUomDto, UpdateUomDto } from "../dto/uom.dto";
import { FormInput } from "../../../components/ui/FormInput";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";

interface Props {
  data: UpdateUomDto & { id: number } | null; // modal edit luôn đầy đủ loại UOM
  onClose: () => void;
  onSubmit: (data: CreateUomDto | UpdateUomDto) => void;
}

export default function UomFormModal({ data, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<CreateUomDto>({ code: "", name: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm(prev => ({ ...prev, ...data }));
  }, [data]);

  const submit = () => {
    if (!form.code || !form.name) {
      setError("Both code & name are required");
      return;
    }
    onSubmit(form);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-80 space-y-4">
        <h3 className="font-semibold text-lg">{data?.id ? "Edit UOM" : "Add UOM"}</h3>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <FormInput label="Code" value={form.code}
          disabled={!!data?.id}
          onChange={(v) => setForm({ ...form, code: v })}
          required />

        <FormInput label="Name" value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Save</Button>
        </div>
      </div>
    </div>
  );
}
