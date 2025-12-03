import React, { useEffect, useState } from "react";
import { AttendanceDTO } from "../dto/attendance.dto";
import { useAppSelector } from "../../../store/hooks";

interface AttendanceFormModalProps {
  open: boolean;
  onClose: () => void;
  initialValue?: AttendanceDTO | null;
  onSubmit: (values: AttendanceDTO | Partial<AttendanceDTO>) => void;
}

const defaultForm: AttendanceDTO = {
  branch_id: 1,
  employee_id: 1,
  work_date: "",
  check_in: "",
  check_out: "",
  working_hours: 0,
  status: "present",
  note: "",
};

const AttendanceFormModal: React.FC<AttendanceFormModalProps> = ({
  open,
  onClose,
  initialValue,
  onSubmit,
}) => {
  const [form, setForm] = useState<AttendanceDTO>(defaultForm);

 const branches =
  useAppSelector((s) => (s.branch as any).branches || (s.branch as any).items || []) || [];

const employees =
  useAppSelector((s) => {
    const anyState = s as any;
    return (
      anyState.employee?.items ||
      anyState.employee?.employees ||
      []
    );
  }) || [];


  useEffect(() => {
    if (initialValue) {
      setForm({
        ...defaultForm,
        ...initialValue,
        work_date: initialValue.work_date?.slice(0, 10), // yyyy-MM-dd
      });
    } else {
      setForm(defaultForm);
    }
  }, [initialValue, open]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "branch_id" || name === "employee_id" || name === "working_hours"
          ? value === ""
            ? ("" as any) // để select về rỗng, khi submit bạn có thể check lại nếu cần
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h2 className="font-semibold">
            {initialValue ? "Cập nhật chấm công" : "Tạo chấm công"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Branch & Employee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Branch
              </label>
              <select
                name="branch_id"
                value={form.branch_id || ""}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-full text-sm"
                required
              >
                <option value="">Chọn chi nhánh</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.code ? `${b.code} - ${b.name}` : b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Employee
              </label>
              <select
                name="employee_id"
                value={form.employee_id || ""}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-full text-sm"
                required
              >
                <option value="">Chọn nhân viên</option>
                {employees.map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name || e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ngày làm việc */}
          <div>
            <label className="block text-sm font-medium mb-1">Ngày làm việc</label>
            <input
              type="date"
              name="work_date"
              value={form.work_date}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
              required
            />
          </div>

          {/* Check in / out */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Check in</label>
              <input
                type="datetime-local"
                name="check_in"
                value={form.check_in || ""}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Check out</label>
              <input
                type="datetime-local"
                name="check_out"
                value={form.check_out || ""}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-full"
              />
            </div>
          </div>

          {/* Working hours & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Số giờ làm (working_hours)
              </label>
              <input
                type="number"
                step="0.25"
                name="working_hours"
                value={form.working_hours ?? 0}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select
                name="status"
                value={form.status || "present"}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú</label>
            <textarea
              name="note"
              value={form.note || ""}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 border rounded"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1 rounded bg-blue-600 text-white"
            >
              {initialValue ? "Lưu" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceFormModal;
