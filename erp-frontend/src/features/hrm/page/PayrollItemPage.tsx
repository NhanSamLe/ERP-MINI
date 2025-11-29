import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchPayrollItems,
  createPayrollItemThunk,
  updatePayrollItemThunk,
  deletePayrollItemThunk,
} from "../store/payrollItem/payrollItem.thunks";
import { clearPayrollItemError } from "../store/payrollItem/payrollItem.slice";
import {
  PayrollItemDTO,
  PayrollItemType,
} from "../dto/payrollItem.dto";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Filter,
  AlertCircle,
} from "lucide-react";

const emptyForm: PayrollItemDTO = {
  branch_id: 1,
  item_code: "",
  name: "",
  type: "earning",
  is_taxable: true,
  is_active: true,
};

const PayrollItemPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const { items, loading, error } = useAppSelector(
    (state) => state.payrollItem
  );
  const branches = useAppSelector((state) => state.branch.branches || []);
  const authUser = useAppSelector((state) => state.auth.user);

  // Lấy role từ Redux (tùy theo bạn lưu như thế nào)
  const roleCode =
    (authUser as any)?.role?.code ?? (authUser as any)?.role ?? "UNKNOWN";

  const isHRStaff = roleCode === "HR_STAFF";
  const isChiefAcc = roleCode === "CHIEF_ACCOUNTANT";

  // Filter
  const [typeFilter, setTypeFilter] = useState<PayrollItemType | "all">("all");
  const [branchFilter, setBranchFilter] = useState<number | "all">("all");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<PayrollItemDTO>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Load danh sách items theo bộ lọc
  useEffect(() => {
    const filter: any = {};
    if (typeFilter !== "all") filter.type = typeFilter;
    if (branchFilter !== "all") filter.branch_id = Number(branchFilter);

    dispatch(fetchPayrollItems(filter) as any);
  }, [dispatch, typeFilter, branchFilter]);

  // Khi mở modal tạo mới
  const openCreateModal = () => {
    const defaultBranchId = branches[0]?.id ?? 1;
    dispatch(clearPayrollItemError());
    setEditingId(null);
    setForm({
      ...emptyForm,
      branch_id: defaultBranchId,
    });
    setShowModal(true);
  };

  // Khi mở modal edit
  const openEditModal = (row: PayrollItemDTO) => {
    dispatch(clearPayrollItemError());
    setEditingId(row.id!);
    setForm({
      id: row.id,
      branch_id: row.branch_id,
      item_code: row.item_code,
      name: row.name,
      type: row.type,
      is_taxable: row.is_taxable,
      is_active: row.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: PayrollItemDTO = {
      ...form,
      branch_id: Number(form.branch_id),
      is_taxable: !!form.is_taxable,
      is_active: !!form.is_active,
    };

    try {
      if (editingId) {
        await dispatch(
          updatePayrollItemThunk({ id: editingId, data: payload }) as any
        ).unwrap();
      } else {
        await dispatch(createPayrollItemThunk(payload) as any).unwrap();
      }
      setShowModal(false);
    } catch {
      // error đã lưu trong redux, hiển thị bên dưới form
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa khoản lương này?")) return;
    try {
      await dispatch(deletePayrollItemThunk(id) as any).unwrap();
    } catch {
      // error xử lý qua redux
    }
  };

  const getTypeBadge = (type: PayrollItemType) => {
    const isEarning = type === "earning";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          isEarning
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}
      >
        {isEarning ? "Thu nhập" : "Khấu trừ"}
      </span>
    );
  };

  const getActiveBadge = (is_active: boolean) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border ${
        is_active
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-gray-50 text-gray-600 border-gray-200"
      }`}
    >
      {is_active ? "Đang dùng" : "Ngưng dùng"}
    </span>
  );

  const getTaxableBadge = (is_taxable: boolean) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border ${
        is_taxable
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-gray-50 text-gray-600 border-gray-200"
      }`}
    >
      {is_taxable ? "Có tính thuế" : "Không tính thuế"}
    </span>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          Danh mục khoản lương
        </h1>

        {isHRStaff && (
          <button
            onClick={openCreateModal}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" /> Tạo khoản lương
          </button>
        )}
      </div>

      {/* Filter Section */}
      <div className="mb-6 bg-white border rounded-lg p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Bộ lọc:
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Chi nhánh:</span>
          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={branchFilter}
            onChange={(e) =>
              setBranchFilter(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
          >
            <option value="all">Tất cả</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Loại khoản:</span>
          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <option value="all">Tất cả</option>
            <option value="earning">Thu nhập</option>
            <option value="deduction">Khấu trừ</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && !showModal && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Mã khoản
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Tên khoản
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Chi nhánh
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700">
                  Loại
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700">
                  Thuế
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                      <span className="text-gray-500">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Calendar className="w-12 h-12 text-gray-300" />
                      <span className="text-gray-500">
                        Không có khoản lương nào
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {row.item_code}
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {row.name}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {branches.find((b) => b.id === row.branch_id)?.name ??
                        row.branch_id}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getTypeBadge(row.type)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getTaxableBadge(row.is_taxable)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getActiveBadge(row.is_active)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {isHRStaff && (
                          <>
                            <button
                              onClick={() => openEditModal(row)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(row.id!)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {isChiefAcc && (
                          <span className="text-xs text-gray-400 italic">
                            Chỉ xem
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="border-b px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                {editingId ? "Cập nhật khoản lương" : "Tạo khoản lương mới"}
              </h2>
            </div>

            {/* Modal Body */}
            <form className="p-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chi nhánh <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={form.branch_id}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      branch_id: Number(e.target.value),
                    }))
                  }
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã khoản <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={form.item_code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, item_code: e.target.value }))
                    }
                    placeholder="VD: LUONG_CB"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại khoản <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        type: e.target.value as PayrollItemType,
                      }))
                    }
                    required
                  >
                    <option value="earning">Thu nhập</option>
                    <option value="deduction">Khấu trừ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ví dụ: Lương cơ bản, Phụ cấp ăn trưa..."
                  required
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    checked={!!form.is_taxable}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        is_taxable: e.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm text-gray-700">
                    Khoản này có tính thuế
                  </span>
                </label>

                {editingId && (
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      checked={!!form.is_active}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          is_active: e.target.checked,
                        }))
                      }
                    />
                    <span className="text-sm text-gray-700">
                      Đang sử dụng
                    </span>
                  </label>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-md"
                >
                  {editingId ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollItemPage;
