import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchPayrollRuns,
  fetchPayrollRunDetail,
  createPayrollRunThunk,
  cancelPayrollRunThunk,
  postPayrollRunThunk,
  createPayrollRunLineThunk,
  updatePayrollRunLineThunk,
  deletePayrollRunLineThunk,
} from "../store/payrollRun/payrollRun.thunks";
import {
  PayrollRunDTO,
  PayrollRunLineDTO,
  PayrollRunStatus,
} from "../dto/payrollRun.dto";
import { clearPayrollRunError, clearCurrentRun } from "../store/payrollRun/payrollRun.slice";

import {
  Calendar,
  Plus,
  Filter,
  AlertCircle,
  FileText,
  Trash2,
  Upload,
  Users,
  X,
  Pencil,
} from "lucide-react";

const PayrollRunPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, currentRun, loading, loadingDetail, error } = useAppSelector(
    (state) => state.payrollRun
  );
  const periods = useAppSelector((state) => state.payrollPeriod.items || []);
  const authUser = useAppSelector((state) => state.auth.user);

  const roleCode =
    (authUser as any)?.role?.code ?? (authUser as any)?.role ?? "UNKNOWN";
  const isHRStaff = roleCode === "HR_STAFF";
  const isAccountant = roleCode === "ACCOUNT";

  // filter
  const [statusFilter, setStatusFilter] = useState<PayrollRunStatus | "all">(
    "all"
  );
  const [periodFilter, setPeriodFilter] = useState<number | "all">("all");

  // modal create run
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPeriodId, setCreatePeriodId] = useState<number | "">("");
  const [runNo, setRunNo] = useState("");

  // modal manage lines
  const [showLinesModal, setShowLinesModal] = useState(false);
  const [lineEmployeeId, setLineEmployeeId] = useState<number | "">("");
  const [lineAmount, setLineAmount] = useState<number | "">("");
  const [editingLineId, setEditingLineId] = useState<number | null>(null);

  // load list
  useEffect(() => {
    const filter: any = {};
    if (statusFilter !== "all") filter.status = statusFilter;
    if (periodFilter !== "all") filter.period_id = Number(periodFilter);
    dispatch(fetchPayrollRuns(filter) as any);
  }, [dispatch, statusFilter, periodFilter]);

  // clear currentRun when đóng modal
  useEffect(() => {
    if (!showLinesModal) {
      dispatch(clearCurrentRun());
      setEditingLineId(null);
      setLineEmployeeId("");
      setLineAmount("");
    }
  }, [showLinesModal, dispatch]);

  const openCreateModal = () => {
    setRunNo("");
    setCreatePeriodId(periods[0]?.id ?? "");
    setShowCreateModal(true);
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createPeriodId || !runNo.trim()) {
      alert("Vui lòng chọn kỳ lương và nhập mã bảng lương");
      return;
    }
    try {
      await dispatch(
        createPayrollRunThunk({
          period_id: Number(createPeriodId),
          run_no: runNo.trim(),
        }) as any
      ).unwrap();
      setShowCreateModal(false);
    } catch {
      // error hiển thị bên ngoài
    }
  };

  const handleCancelRun = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn hủy bảng lương này?")) return;
    try {
      await dispatch(cancelPayrollRunThunk(id) as any).unwrap();
    } catch {
      //
    }
  };

  const handlePostRun = async (id: number) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn POST bảng lương này vào sổ cái? Hành động này không thể hoàn tác."
      )
    )
      return;
    try {
      await dispatch(postPayrollRunThunk(id) as any).unwrap();
    } catch {
      //
    }
  };

  const openLinesModal = async (runId: number) => {
    setEditingLineId(null);
    setLineEmployeeId("");
    setLineAmount("");
    try {
      await dispatch(fetchPayrollRunDetail(runId) as any).unwrap();
      setShowLinesModal(true);
    } catch {
      //
    }
  };

  const handleSubmitLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRun) return;
    if (!lineEmployeeId || !lineAmount) {
      alert("Vui lòng nhập nhân viên và số tiền");
      return;
    }
    const employee_id = Number(lineEmployeeId);
    const amount = Number(lineAmount);

    try {
      if (editingLineId) {
        await dispatch(
          updatePayrollRunLineThunk({
            runId: currentRun.id!,
            lineId: editingLineId,
            data: { employee_id, amount },
          }) as any
        ).unwrap();
      } else {
        await dispatch(
          createPayrollRunLineThunk({
            runId: currentRun.id!,
            employee_id,
            amount,
          }) as any
        ).unwrap();
      }
      setEditingLineId(null);
      setLineEmployeeId("");
      setLineAmount("");
    } catch {
      //
    }
  };

  const handleEditLine = (line: PayrollRunLineDTO) => {
    setEditingLineId(line.id!);
    setLineEmployeeId(line.employee_id);
    setLineAmount(Number(line.amount));
  };

  const handleDeleteLine = async (line: PayrollRunLineDTO) => {
    if (!currentRun) return;
    if (!window.confirm("Xóa dòng lương này?")) return;
    try {
      await dispatch(
        deletePayrollRunLineThunk({
          runId: currentRun.id!,
          lineId: line.id!,
        }) as any
      ).unwrap();
    } catch {
      //
    }
  };

  const getStatusBadge = (status: PayrollRunStatus) => {
    const isDraft = status === "draft";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          isDraft
            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
            : "bg-green-50 text-green-700 border-green-200"
        }`}
      >
        {isDraft ? "Nháp" : "Đã post"}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          Bảng lương (Payroll Run)
        </h1>

        {isHRStaff && (
          <button
            onClick={openCreateModal}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" /> Lập bảng lương
          </button>
        )}
      </div>

      {/* Filter Section */}
      <div className="mb-6 bg-white border rounded-lg p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Bộ lọc:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Trạng thái:</span>
          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as PayrollRunStatus | "all")
            }
          >
            <option value="all">Tất cả</option>
            <option value="draft">Nháp</option>
            <option value="posted">Đã post</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Kỳ lương:</span>
          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={periodFilter}
            onChange={(e) =>
              setPeriodFilter(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
          >
            <option value="all">Tất cả</option>
            {periods.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.period_code} (
                {p.start_date?.slice(0, 10)} - {p.end_date?.slice(0, 10)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
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
                  Mã bảng lương
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Kỳ lương
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Chi nhánh
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Ngày lập
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
                      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                      <span className="text-gray-500">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-12 h-12 text-gray-300" />
                      <span className="text-gray-500">
                        Chưa có bảng lương nào
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((row: PayrollRunDTO) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {row.run_no}
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      {row.period
                        ? `${row.period.period_code} (${row.period.start_date?.slice(
                            0,
                            10
                          )} - ${row.period.end_date?.slice(0, 10)})`
                        : row.period_id}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.period?.branch?.name ?? ""}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.created_at?.slice(0, 10)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {isHRStaff && row.status === "draft" && (
                          <button
                            onClick={() => openLinesModal(row.id!)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Quản lý dòng lương"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        )}

                        {isAccountant && row.status === "draft" && (
                          <button
                            onClick={() => handlePostRun(row.id!)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Post bảng lương"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        )}

                        {isHRStaff && row.status === "draft" && (
                          <button
                            onClick={() => handleCancelRun(row.id!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hủy bảng lương"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {!isHRStaff && !isAccountant && (
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

      {/* Modal lập bảng lương */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="border-b px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Lập bảng lương mới
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="p-6 space-y-5" onSubmit={handleCreateRun}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kỳ lương <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={createPeriodId}
                  onChange={(e) =>
                    setCreatePeriodId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  required
                >
                  <option value="">-- Chọn kỳ lương --</option>
                  {periods.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.period_code} (
                      {p.start_date?.slice(0, 10)} -{" "}
                      {p.end_date?.slice(0, 10)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã bảng lương <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={runNo}
                  onChange={(e) => setRunNo(e.target.value)}
                  placeholder="VD: RUN-2024-01"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-md"
                >
                  Tạo bảng lương
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal dòng lương */}
      {showLinesModal && currentRun && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="border-b px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Dòng lương - {currentRun.run_no}
                </h2>
                <p className="text-xs text-blue-100 mt-1">
                  Kỳ:{" "}
                  {currentRun.period
                    ? `${currentRun.period.period_code} (${currentRun.period.start_date?.slice(
                        0,
                        10
                      )} - ${currentRun.period.end_date?.slice(0, 10)})`
                    : currentRun.period_id}
                </p>
              </div>
              <button
                onClick={() => setShowLinesModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail && (
                <div className="flex justify-center py-4">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              )}

              {/* Form line */}
              {isHRStaff && currentRun.status === "draft" && (
                <form
                  className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-wrap gap-4 items-end"
                  onSubmit={handleSubmitLine}
                >
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      ID Nhân viên
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={lineEmployeeId}
                      onChange={(e) =>
                        setLineEmployeeId(
                          e.target.value
                            ? Number(e.target.value)
                            : ("" as any)
                        )
                      }
                      placeholder="VD: 101"
                    />
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Số tiền
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={lineAmount}
                      onChange={(e) =>
                        setLineAmount(
                          e.target.value
                            ? Number(e.target.value)
                            : ("" as any)
                        )
                      }
                      placeholder="VD: 15000000"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all shadow"
                  >
                    {editingLineId ? "Cập nhật dòng" : "Thêm dòng"}
                  </button>
                </form>
              )}

              {/* Table lines */}
              <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Nhân viên
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Số tiền
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!currentRun.lines || currentRun.lines.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center py-6 text-gray-500"
                        >
                          Chưa có dòng lương nào
                        </td>
                      </tr>
                    ) : (
                      currentRun.lines.map((line: PayrollRunLineDTO) => (
                        <tr
                          key={line.id}
                          className="border-b last:border-b-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-gray-800">
                            {line.employee?.full_name ||
                              line.employee?.code ||
                              `Employee #${line.employee_id}`}
                          </td>
                          <td className="px-4 py-3 text-gray-800">
                            {Number(line.amount).toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isHRStaff && currentRun.status === "draft" ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditLine(line)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLine(line)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                Chỉ xem
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t px-6 py-3 flex justify-end">
              <button
                onClick={() => setShowLinesModal(false)}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollRunPage;
