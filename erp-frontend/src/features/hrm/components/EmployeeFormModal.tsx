import { useState, useEffect } from "react";
import { EmployeeDTO, EmployeeFormPayload } from "../dto/employee.dto";
import axiosClient from "../../../api/axiosClient";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: EmployeeDTO | null;
  onSubmit: (data: EmployeeFormPayload) => Promise<void>;
}

interface Bank {
  code: string;
  name: string;
  shortName: string;
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
    branch_id: null,
    birth_date: null,
    cccd: null,
    hire_date: null,
    department_id: null,
    position_id: null,
    bank_account: null,
    bank_name: null,
  });

  const [banks, setBanks] = useState<Bank[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [positions, setPositions] = useState<{ id: number; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [depRes, posRes, branchRes, bankRes] = await Promise.all([
          axiosClient.get("/hrm/departments"),
          axiosClient.get("/hrm/positions"),
          axiosClient.get("/branch"),
          fetch("https://api.vietqr.io/v2/banks").then(r => r.json())
        ]);

        setDepartments(depRes.data || []);
        setPositions(posRes.data || []);
        setBranches(branchRes.data || []);
        setBanks(bankRes.data || []);
      } catch (err) {
        console.error("Failed to load master data", err);
      }
    };

    loadMasterData();
  }, []);

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
        department_id: initialData.department_id ?? null,
        position_id: initialData.position_id ?? null,
        bank_account: initialData.bank_account || null,
        bank_name: initialData.bank_name || null,
        status: initialData.status || "active",
        branch_id: (initialData as any).branch_id ?? null,
      });
    } else {
      setForm({
        emp_code: "",
        full_name: "",
        gender: "male",
        contract_type: "official",
        base_salary: 0,
        status: "active",
        branch_id: null,
        birth_date: null,
        cccd: null,
        hire_date: null,
        department_id: null,
        position_id: null,
        bank_account: null,
        bank_name: null,
      });
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "base_salary" ? Number(value) : value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {initialData ? "Cập nhật thông tin nhân viên" : "Thêm nhân viên mới"}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {initialData ? `Mã NV: ${initialData.emp_code}` : "Vui lòng điền đầy đủ thông tin bên dưới"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Thông tin cơ bản */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-blue-600 rounded"></div>
              <h3 className="text-lg font-semibold text-gray-800">Thông tin cơ bản</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chi nhánh <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.branch_id ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      branch_id: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">-- Chọn chi nhánh --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mã nhân viên <span className="text-red-500">*</span>
                </label>
                <input
                  name="emp_code"
                  value={form.emp_code}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="VD: NV001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={form.status ?? "active"}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="active">✓ Đang làm việc</option>
                  <option value="inactive">✗ Ngừng hoạt động</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Nhập họ và tên đầy đủ"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  CCCD/CMND
                </label>
                <input
                  name="cccd"
                  value={form.cccd ?? ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Số CCCD/CMND"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giới tính <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={form.birth_date ?? ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày vào làm
                </label>
                <input
                  type="date"
                  name="hire_date"
                  value={form.hire_date ?? ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Thông tin công việc */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-blue-600 rounded"></div>
              <h3 className="text-lg font-semibold text-gray-800">Thông tin công việc</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phòng ban
                </label>
                <select
                  name="department_id"
                  value={form.department_id ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      department_id: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chức danh
                </label>
                <select
                  name="position_id"
                  value={form.position_id ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      position_id: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">-- Chọn chức danh --</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loại hợp đồng <span className="text-red-500">*</span>
                </label>
                <select
                  name="contract_type"
                  value={form.contract_type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="trial">Thử việc</option>
                  <option value="official">Chính thức</option>
                  <option value="seasonal">Thời vụ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lương cơ bản <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    name="base_salary"
                    type="number"
                    value={form.base_salary}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    VNĐ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin ngân hàng */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-blue-600 rounded"></div>
              <h3 className="text-lg font-semibold text-gray-800">Thông tin thanh toán</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngân hàng
                </label>
                <select
                  value={
                    banks.find(
                      (b) =>
                        b.shortName === form.bank_name || b.name === form.bank_name
                    )?.code || ""
                  }
                  onChange={(e) => {
                    const bank = banks.find((b) => b.code === e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      bank_name: bank?.shortName || bank?.name || null,
                    }));
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.shortName || b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số tài khoản
                </label>
                <input
                  name="bank_account"
                  value={form.bank_account ?? ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Nhập số tài khoản"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {initialData ? "Cập nhật" : "Thêm mới"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}