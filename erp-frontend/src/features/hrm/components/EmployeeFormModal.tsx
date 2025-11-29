import { useState, useEffect } from "react";
import { EmployeeDTO, EmployeeFormPayload } from "../dto/employee.dto";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: EmployeeDTO | null;
  onSubmit: (data: EmployeeFormPayload) => Promise<void>;
}

export default function EmployeeFormModal({
  open,
  onClose,
  initialData,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<EmployeeFormPayload>({
    emp_code: "",
    full_name: "",
    gender: "male",
    contract_type: "official",
    base_salary: 0,
    status: "active",
  });

  // Load dữ liệu khi Edit
  useEffect(() => {
    if (initialData) {
      setForm({
        emp_code: initialData.emp_code,
        full_name: initialData.full_name,
        gender: initialData.gender,
        contract_type: initialData.contract_type,
        base_salary: initialData.base_salary,
        birth_date: initialData.birth_date || null,
        cccd: initialData.cccd || null,
        hire_date: initialData.hire_date || null,
        department_id: initialData.department_id || null,
        position_id: initialData.position_id || null,
        bank_account: initialData.bank_account || null,
        bank_name: initialData.bank_name || null,
        status: initialData.status || "active",
      });
    } else {
      setForm({
        emp_code: "",
        full_name: "",
        gender: "male",
        contract_type: "official",
        base_salary: 0,
        status: "active",
      });
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "base_salary" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          {initialData ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            
            <div>
              <label className="text-sm font-medium">Mã nhân viên</label>
              <input
                name="emp_code"
                value={form.emp_code}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Họ tên</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Giới tính</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Loại hợp đồng</label>
              <select
                name="contract_type"
                value={form.contract_type}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              >
                <option value="trial">Thử việc</option>
                <option value="official">Chính thức</option>
                <option value="seasonal">Thời vụ</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Lương cơ bản</label>
              <input
                name="base_salary"
                type="number"
                value={form.base_salary}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                name="status"
                value={form.status ?? "active"}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              >
                <option value="active">Đang làm</option>
                <option value="inactive">Ngưng hoạt động</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              className="px-4 py-2 text-sm border rounded"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
