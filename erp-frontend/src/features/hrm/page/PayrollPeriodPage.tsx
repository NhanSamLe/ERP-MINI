import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchPayrollPeriods,
  createPayrollPeriodThunk,
  updatePayrollPeriodThunk,
  closePayrollPeriodThunk,
  deletePayrollPeriodThunk,
} from "../store/payrollPeriod/payrollPeriod.thunks";
import { clearPayrollError } from "../store/payrollPeriod/payrollPeriod.slice";
import {
  PayrollPeriodDTO,
  PayrollPeriodStatus,
} from "../dto/payrollPeriod.dto";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const emptyForm: PayrollPeriodDTO = {
  branch_id: 1,
  period_code: "",
  start_date: "",
  end_date: "",
  status: "open",
};

const PayrollPeriodPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector(
    (state) => state.payrollPeriod
  );
  const branches = useAppSelector((state) => state.branch.branches || []);

  const [statusFilter, setStatusFilter] = useState<PayrollPeriodStatus | "all">(
    "all"
  );
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<PayrollPeriodDTO>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    dispatch(
      fetchPayrollPeriods({
        status: statusFilter,
      }) as any
    );
  }, [dispatch, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const openCreateModal = () => {
    const defaultBranchId = branches[0]?.id ?? 1;
    dispatch(clearPayrollError());
    setEditingId(null);
    setForm({
      ...emptyForm,
      branch_id: defaultBranchId,
    });
    setShowModal(true);
  };

  const openEditModal = (row: PayrollPeriodDTO) => {
    dispatch(clearPayrollError());
    setEditingId(row.id!);
    setForm({
      branch_id: row.branch_id,
      period_code: row.period_code,
      start_date: row.start_date.slice(0, 10),
      end_date: row.end_date.slice(0, 10),
      status: row.status ?? "open",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert("Ngày không hợp lệ");
      return;
    }

    if (start > end) {
      alert("Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }

    const payload: PayrollPeriodDTO = {
      ...form,
      branch_id: Number(form.branch_id),
    };

    try {
      if (editingId) {
        await dispatch(
          updatePayrollPeriodThunk({ id: editingId, data: payload }) as any
        ).unwrap();
      } else {
        await dispatch(createPayrollPeriodThunk(payload) as any).unwrap();
      }
      setShowModal(false);
    } catch {
      // error đã được lưu trong redux
    }
  };

  const handleClosePeriod = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn đóng kỳ lương này?")) return;
    try {
      await dispatch(closePayrollPeriodThunk(id) as any).unwrap();
    } catch {
      // handle if needed
    }
  };

  const handleDeletePeriod = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa kỳ lương này?")) return;
    try {
      await dispatch(deletePayrollPeriodThunk(id) as any).unwrap();
    } catch {
      // handle if needed
    }
  };

  // Pagination calculations
  const totalItems = items.length;
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      if (currentPage <= 3) {
        end = 5;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
      }

      if (start > 2) {
        pages.push(-1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push(-2);
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: "bg-green-100 text-green-800 border-green-200",
      processed: "bg-blue-100 text-blue-800 border-blue-200",
      closed: "bg-gray-100 text-gray-800 border-gray-200",
    };
    const labels = {
      open: "Mở",
      processed: "Đã xử lý",
      closed: "Đã đóng",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          styles[status as keyof typeof styles] || styles.open
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          Quản lý kỳ lương
        </h1>

        <button
          onClick={openCreateModal}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" /> Tạo kỳ lương
        </button>
      </div>

      {/* Filter Section */}
      <div className="mb-6 bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">
            Trạng thái:
          </label>
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Tất cả</option>
            <option value="open">Mở</option>
            <option value="processed">Đã xử lý</option>
            <option value="closed">Đã đóng</option>
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
                  Mã kỳ
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Chi nhánh
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Từ ngày
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Đến ngày
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
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                      <span className="text-gray-500">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Calendar className="w-12 h-12 text-gray-300" />
                      <span className="text-gray-500">
                        Không có kỳ lương nào
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {row.period_code}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {branches.find((b) => b.id === row.branch_id)?.name ??
                        row.branch_id}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.start_date?.slice(0, 10)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.end_date?.slice(0, 10)}
                    </td>
                    <td className="px-6 py-4 text-center">
  {getStatusBadge(row.status ?? "open")}
</td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(row)}
                          disabled={row.status === "closed"}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {row.status !== "closed" && (
                          <button
                            onClick={() => handleClosePeriod(row.id!)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Đóng kỳ"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePeriod(row.id!)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-white">
            <div className="text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-gray-900">
                {startIndex + 1} -{" "}
                {Math.min(startIndex + pageSize, totalItems)}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-semibold text-gray-900">{totalItems}</span>{" "}
              kỳ lương
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm transition-all duration-200 bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Trước</span>
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((pNum, idx) => {
                  if (pNum < 0) {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 text-gray-400"
                      >
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={pNum}
                      onClick={() => goToPage(pNum)}
                      className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        pNum === currentPage
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm transition-all duration-200 bg-gray-50"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="border-b px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                {editingId ? "Cập nhật kỳ lương" : "Tạo kỳ lương mới"}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã kỳ lương <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={form.period_code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, period_code: e.target.value }))
                  }
                  placeholder="Ví dụ: KL-2024-01"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Từ ngày <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, start_date: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đến ngày <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, end_date: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={form.status ?? "open"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as PayrollPeriodStatus,
                    }))
                  }
                >
                  <option value="open">Mở</option>
                  <option value="processed">Đã xử lý</option>
                  <option value="closed">Đã đóng</option>
                </select>
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

export default PayrollPeriodPage;