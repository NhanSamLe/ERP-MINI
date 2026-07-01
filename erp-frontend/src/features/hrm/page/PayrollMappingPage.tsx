import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Building2, 
  AlertCircle,
  FileText,
  X,
  Layers
} from "lucide-react";
import { payrollMappingApi, PayrollAccountMappingDTO, PayrollMappingItemType } from "../api/payrollMapping.api";
import { departmentApi } from "../api/department.api";
import { Department } from "../store/department/department.type";
import { fetchGlAccounts } from "../../finance/service/glAccount.service";
import { GlAccountDTO } from "../../finance/dto/glAccount.dto";
import { Branch, fetchBranches } from "../../company/branch.service";

const ITEM_TYPE_LABELS: Record<PayrollMappingItemType, string> = {
  salary: "Chi phí lương phải trả (Expense)",
  social_insurance_company: "BHXH công ty đóng (Expense)",
  social_insurance_employee: "BHXH khấu trừ vào lương NV (Liability)",
  pit: "Thuế TNCN phải nộp (Liability)",
  net_payable: "Lương thực lĩnh phải trả (Liability)"
};

export default function PayrollMappingPage() {
  const [items, setItems] = useState<PayrollAccountMappingDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [glAccounts, setGlAccounts] = useState<GlAccountDTO[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PayrollAccountMappingDTO | null>(null);
  const [form, setForm] = useState<{
    id?: number;
    branch_id?: number;
    department_id?: number | null;
    item_type: PayrollMappingItemType;
    account_id?: number;
  }>({
    branch_id: undefined,
    department_id: null,
    item_type: "salary",
    account_id: undefined
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await payrollMappingApi.getAll();
      setItems(data);
    } catch (error) {
      toast.error("Không thể tải danh sách cấu hình tài khoản lương");
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      const deps = await departmentApi.getAll();
      setDepartments(deps);

      const accounts = await fetchGlAccounts();
      setGlAccounts(accounts);

      const brs = await fetchBranches();
      setBranches(brs);
    } catch (err) {
      console.error("Lỗi tải thông tin cấu hình:", err);
    }
  };

  useEffect(() => {
    loadData();
    loadDropdowns();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      id: undefined,
      branch_id: branches[0]?.id,
      department_id: null,
      item_type: "salary",
      account_id: glAccounts[0]?.id
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: PayrollAccountMappingDTO) => {
    setEditingItem(item);
    setForm({
      id: item.id,
      branch_id: item.branch_id,
      department_id: item.department_id || null,
      item_type: item.item_type,
      account_id: item.account_id
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.branch_id) {
      toast.error("Vui lòng chọn chi nhánh");
      return;
    }
    if (!form.account_id) {
      toast.error("Vui lòng chọn tài khoản kế toán");
      return;
    }

    try {
      if (form.id) {
        await payrollMappingApi.update(form.id, {
          branch_id: form.branch_id,
          department_id: form.department_id,
          item_type: form.item_type,
          account_id: form.account_id
        });
        toast.success("Cập nhật cấu hình tài khoản lương thành công");
      } else {
        await payrollMappingApi.create({
          branch_id: form.branch_id,
          department_id: form.department_id,
          item_type: form.item_type,
          account_id: form.account_id
        });
        toast.success("Tạo cấu hình tài khoản lương thành công");
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Đã xảy ra lỗi khi lưu cấu hình");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa cấu hình tài khoản này?")) return;
    try {
      await payrollMappingApi.remove(id);
      toast.success("Xóa cấu hình thành công");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể xóa cấu hình này");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl shadow-lg">
                <Layers className="w-7 h-7 text-white" />
              </div>
              Cấu hình tài khoản lương
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Thiết lập tài khoản hạch toán tự động vào Sổ cái khi phê duyệt bảng lương
            </p>
          </div>

          <button
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 flex items-center gap-2 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium"
            onClick={handleOpenCreate}
          >
            <Plus className="w-5 h-5" />
            Thêm cấu hình tài khoản
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3 text-orange-800">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">Nguyên tắc hoạt động hạch toán lương:</p>
          <ul className="list-disc ml-5 mt-1 space-y-1">
            <li>Hệ thống ưu tiên tìm cấu hình theo <strong>Phòng ban</strong> cụ thể của nhân viên trước.</li>
            <li>Nếu phòng ban của nhân viên không có cấu hình riêng, hệ thống sẽ tự động áp dụng cấu hình <strong>Mặc định (Tất cả phòng ban)</strong>.</li>
            <li>Nếu cả cấu hình phòng ban và cấu hình mặc định đều trống, hệ thống sẽ sử dụng tài khoản fallback chuẩn (như 642, 334, 338, 3335).</li>
          </ul>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Phòng ban áp dụng
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Khoản mục lương
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tài khoản hạch toán (GL Account)
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
                      <p className="mt-4 text-gray-500 text-sm">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="bg-gray-100 rounded-full p-4 mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">Chưa có cấu hình tài khoản lương nào</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Bấm "Thêm cấu hình tài khoản" để bắt đầu thiết lập liên kết Sổ cái kế toán
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const depName = item.department?.name || "Mặc định (Tất cả phòng ban)";
                  const accCode = item.gl_account?.code || item.account_id;
                  const accName = item.gl_account?.name || "";

                  return (
                    <tr key={item.id} className="hover:bg-orange-50/50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${item.department_id ? "text-gray-900" : "text-orange-600"}`}>
                          {depName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {ITEM_TYPE_LABELS[item.item_type]}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 font-mono text-xs font-bold border border-orange-200">
                            {accCode}
                          </span>
                          <span className="text-gray-600 text-sm font-medium">{accName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            className="p-2 border border-gray-200 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-200 shadow-sm"
                            onClick={() => handleOpenEdit(item)}
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 border border-gray-200 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 shadow-sm"
                            onClick={() => item.id && handleDelete(item.id)}
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-500" />
                  {editingItem ? "Chỉnh sửa cấu hình" : "Thêm cấu hình tài khoản"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Thiết lập tài khoản GL tương ứng cho từng mục lương
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-5">
              {/* Branch */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chi nhánh <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  value={form.branch_id ?? ""}
                  onChange={(e) => setForm({ ...form, branch_id: Number(e.target.value) })}
                >
                  <option value="">-- Chọn chi nhánh --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phòng ban áp dụng
                </label>
                <select
                  className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  value={form.department_id ?? ""}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      department_id: e.target.value ? Number(e.target.value) : null
                    });
                  }}
                >
                  <option value="">-- Mặc định (Tất cả phòng ban) --</option>
                  {departments.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.code} — {dep.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Khoản mục lương <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  value={form.item_type}
                  onChange={(e) => setForm({ ...form, item_type: e.target.value as PayrollMappingItemType })}
                >
                  {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* GL Account */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tài khoản kế toán hạch toán <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  value={form.account_id ?? ""}
                  onChange={(e) => setForm({ ...form, account_id: Number(e.target.value) })}
                >
                  <option value="">-- Chọn tài khoản --</option>
                  {glAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} — {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                className="px-5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl hover:bg-white text-gray-700"
                onClick={() => setModalOpen(false)}
              >
                Hủy
              </button>
              <button
                className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 transition-all duration-200"
                onClick={handleSave}
              >
                Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
