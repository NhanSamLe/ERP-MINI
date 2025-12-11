import { useState, useEffect } from "react";
import { useAppSelector } from "../../../store/hooks";
import { CreateUomConversionDto, UomConversion } from "../dto/uom.dto";
import { FormInput } from "../../../components/ui/FormInput";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";

interface Props {
  data: Partial<UomConversion> | null;
  onClose: () => void;
  onSubmit: (data: CreateUomConversionDto) => void;
}

export default function ConversionFormModal({ data, onClose, onSubmit }: Props) {
  const { Uoms } = useAppSelector((state) => state.uom);

  const [form, setForm] = useState<CreateUomConversionDto>({
    from_uom_id: 0,
    to_uom_id: 0,
    factor: 1,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (data) setForm(prev => ({ ...prev, ...data })) }, [data]);

  const submit = () => {
    if (form.from_uom_id === form.to_uom_id)
      return setError("Cannot convert to the same UOM");

    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-96 space-y-4">
        <h3 className="font-bold text-lg">UOM Conversion</h3>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <select className="border p-2 rounded w-full"
          value={form.from_uom_id}
          onChange={(e) => setForm({ ...form, from_uom_id: Number(e.target.value) })}>
          <option value="">Select From UOM</option>
          {Uoms.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select className="border p-2 rounded w-full"
          value={form.to_uom_id}
          onChange={(e) => setForm({ ...form, to_uom_id: Number(e.target.value) })}>
          <option value="">Select To UOM</option>
          {Uoms.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <FormInput label="Factor" type="number"
          value={String(form.factor)}
          onChange={(v) => setForm({ ...form, factor: Number(v) })} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Save</Button>
        </div>
      </div>
    </div>
  );
}
