import { useState } from "react";
import { LeaveRequestPayload, LeaveTypeDTO } from "../dto/leave.dto";

interface Props {
  open: boolean;
  leaveTypes: LeaveTypeDTO[];
  onClose: () => void;
  onSubmit: (data: LeaveRequestPayload) => void;
}

export default function LeaveRequestFormModal({
  open,
  leaveTypes,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<LeaveRequestPayload>({
    leave_type_id: 0,
    from_date: "",
    to_date: "",
    total_days: 1,
    reason: "",
  });
  const calcDays = (from: string, to: string) => {
  if (!from || !to) return 0;
  const start = new Date(from);
  const end = new Date(to);

  return (
    Math.ceil(
      (end.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
};

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-[500px]">
        <h2 className="text-xl font-bold mb-4">Tạo đơn nghỉ phép</h2>

        <select
          className="w-full border p-2 rounded mb-3"
          onChange={(e) =>
            setForm({
              ...form,
              leave_type_id: Number(e.target.value),
            })
          }
        >
          <option>Chọn loại phép</option>
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <input
  type="date"
  className="w-full border p-2 rounded mb-3"
  onChange={(e) => {
    const value = e.target.value;

    setForm({
      ...form,
      from_date: value,
      total_days: calcDays(value, form.to_date),
    });
  }}
/>

        <input
  type="date"
  className="w-full border p-2 rounded mb-3"
  onChange={(e) => {
    const value = e.target.value;

    setForm({
      ...form,
      to_date: value,
      total_days: calcDays(form.from_date, value),
    });
  }}
/>
        <input
          type="number"
          className="w-full border p-2 rounded mb-3"
          placeholder="Số ngày nghỉ"
          onChange={(e) =>
            setForm({
              ...form,
              total_days: Number(e.target.value),
            })
          }
        />

        <textarea
          className="w-full border p-2 rounded mb-3"
          placeholder="Lý do"
          onChange={(e) =>
            setForm({ ...form, reason: e.target.value })
          }
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Hủy</button>

          <button
            className="bg-orange-600 text-white px-4 py-2 rounded"
            onClick={() => onSubmit(form)}
          >
            Gửi đơn
          </button>
        </div>
      </div>
    </div>
  );
}