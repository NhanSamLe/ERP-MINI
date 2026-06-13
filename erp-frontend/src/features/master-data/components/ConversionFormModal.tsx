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

  useEffect(() => {
    if (data) setForm((prev) => ({ ...prev, ...data }));
  }, [data]);

  const submit = () => {
    if (!form.from_uom_id || !form.to_uom_id) {
      setError("Vui lòng chọn đầy đủ đơn vị nguồn và đơn vị đích.");
      return;
    }
    if (form.from_uom_id === form.to_uom_id) {
      setError("Đơn vị nguồn và đơn vị đích phải khác nhau.");
      return;
    }
    if (!form.factor || Number(form.factor) <= 0) {
      setError("Hệ số quy đổi phải lớn hơn 0.");
      return;
    }

    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 shadow-xl">
        <h3 className="font-bold text-lg text-gray-900">
          {data?.id ? "Cập nhật quy đổi đơn vị" : "Thêm quy đổi đơn vị"}
        </h3>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <div>
          <label className="text-sm font-medium text-gray-700">Đơn vị nguồn</label>
          <select
            className="border p-2 rounded w-full mt-1"
            value={form.from_uom_id}
            onChange={(e) => setForm({ ...form, from_uom_id: Number(e.target.value) })}
          >
            <option value="">Chọn đơn vị nguồn</option>
            {Uoms.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} - {u.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Đơn vị đích</label>
          <select
            className="border p-2 rounded w-full mt-1"
            value={form.to_uom_id}
            onChange={(e) => setForm({ ...form, to_uom_id: Number(e.target.value) })}
          >
            <option value="">Chọn đơn vị đích</option>
            {Uoms.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} - {u.name}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          label="Hệ số quy đổi"
          type="number"
          value={String(form.factor)}
          onChange={(v) => setForm({ ...form, factor: Number(v) })}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button variant="primary" onClick={submit}>Lưu</Button>
        </div>
      </div>
    </div>
  );
}
