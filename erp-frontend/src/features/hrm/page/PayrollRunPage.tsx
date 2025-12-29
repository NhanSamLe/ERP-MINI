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
import { clearCurrentRun } from "../store/payrollRun/payrollRun.slice";
import apiClient from "../../../api/axiosClient";

import {
  Plus,
  Filter,
  AlertCircle,
  FileText,
  Trash2,
  Upload,
  Users,
  X,
  Pencil,
  Search,
  Calendar,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  Clock,
  Building2,
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
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleCalculate = async () => {
    if (!currentRun) return;
    if (!window.confirm("Tính lương tự động theo chấm công cho kỳ này?")) return;

    try {
      await apiClient.post(`/hrm/payroll-runs/${currentRun.id}/calculate`, {});
      await dispatch(fetchPayrollRunDetail(currentRun.id!) as any).unwrap();
      alert("Đã tính lương xong!");
    } catch (e: any) {
      alert(e?.response?.data?.message || "Tính lương lỗi");
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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
          isDraft
            ? "bg-amber-100 text-amber-700 border border-amber-200"
            : "bg-emerald-100 text-emerald-700 border border-emerald-200"
        }`}
      >
        {isDraft ? (
          <>
            <Clock className="w-3.5 h-3.5" />
            Nháp
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã post
          </>
        )}
      </span>
    );
  };

  // Filter items by search
  const filteredItems = items.filter((item: PayrollRunDTO) => {
    const matchesSearch =
      searchTerm === "" ||
      item.run_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.period?.period_code?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: items.length,
    draft: items.filter((i: PayrollRunDTO) => i.status === "draft").length,
    posted: items.filter((i: PayrollRunDTO) => i.status === "posted").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                Quản lý Bảng lương
              </h1>
              <p className="text-sm text-gray-600">
                Theo dõi và quản lý bảng lương của tất cả nhân viên
              </p>
            </div>

            {isHRStaff && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                <Plus className="w-5 h-5" />
                Lập bảng lương mới
              </button>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    Tổng bảng lương
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    Bảng nháp
                  </p>
                  <p className="text-2xl font-bold text-amber-600">{stats.draft}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    Đã post
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.posted}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã bảng lương hoặc kỳ lương..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  className="bg-transparent border-none focus:outline-none text-sm font-medium text-gray-700 cursor-pointer"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as PayrollRunStatus | "all")
                  }
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="draft">Nháp</option>
                  <option value="posted">Đã post</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  className="bg-transparent border-none focus:outline-none text-sm font-medium text-gray-700 cursor-pointer"
                  value={periodFilter}
                  onChange={(e) =>
                    setPeriodFilter(
                      e.target.value === "all" ? "all" : Number(e.target.value)
                    )
                  }
                >
                  <option value="all">Tất cả kỳ lương</option>
                  {periods.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.period_code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800 mb-1">
                  Có lỗi xảy ra
                </h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Mã bảng lương
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Kỳ lương
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Chi nhánh
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Ngày lập
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-sm text-gray-500 font-medium">
                          Đang tải dữ liệu...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <FileText className="w-12 h-12 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Không tìm thấy bảng lương
                          </p>
                          <p className="text-sm text-gray-500">
                            {searchTerm
                              ? "Thử thay đổi từ khóa tìm kiếm"
                              : "Chưa có bảng lương nào được tạo"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((row: PayrollRunDTO) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="font-semibold text-gray-900">
                            {row.run_no}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {row.period
                              ? `${row.period.period_code} (${row.period.start_date?.slice(
                                  0,
                                  10
                                )} - ${row.period.end_date?.slice(0, 10)})`
                              : row.period_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {row.period?.branch?.name ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(row.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {row.created_at?.slice(0, 10)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {isHRStaff && row.status === "draft" && (
                            <button
                              onClick={() => openLinesModal(row.id!)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
                              title="Quản lý dòng lương"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                          )}

                          {isAccountant && row.status === "draft" && (
                            <button
                              onClick={() => handlePostRun(row.id!)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all hover:scale-110"
                              title="Post bảng lương"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                          )}

                          {isHRStaff && row.status === "draft" && (
                            <button
                              onClick={() => handleCancelRun(row.id!)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                              title="Hủy bảng lương"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {!isHRStaff && !isAccountant && (
                            <span className="text-xs text-gray-400 italic px-2 py-1 bg-gray-50 rounded">
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
      </div>

      {/* Modal lập bảng lương */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  Lập bảng lương mới
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form className="p-6 space-y-6" onSubmit={handleCreateRun}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kỳ lương <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
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
                        {p.period_code} ({p.start_date?.slice(0, 10)} -{" "}
                        {p.end_date?.slice(0, 10)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mã bảng lương <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={runNo}
                    onChange={(e) => setRunNo(e.target.value)}
                    placeholder="VD: RUN-2024-01"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-lg border-2 border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                    Quản lý dòng lương - {currentRun.run_no}
                  </h2>
                  <div className="flex items-center gap-2 text-blue-100 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Kỳ:{" "}
                      {currentRun.period
                        ? `${currentRun.period.period_code} (${currentRun.period.start_date?.slice(
                            0,
                            10
                          )} - ${currentRun.period.end_date?.slice(0, 10)})`
                        : currentRun.period_id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowLinesModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail && (
                <div className="flex justify-center py-8">
                  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              )}

              {/* Form line */}
              {isHRStaff && currentRun.status === "draft" && !loadingDetail && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-600" />
                    {editingLineId ? "Cập nhật dòng lương" : "Thêm dòng lương mới"}
                  </h3>
                  <form
                    className="flex flex-wrap gap-4 items-end"
                    onSubmit={handleSubmitLine}
                  >
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        ID Nhân viên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Số tiền (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          className="w-full pl-10 border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      {editingLineId ? (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Cập nhật
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Thêm
                        </>
                      )}
                    </button>

                    {editingLineId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLineId(null);
                          setLineEmployeeId("");
                          setLineAmount("");
                        }}
                        className="px-4 py-2.5 rounded-lg border-2 border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Hủy sửa
                      </button>
                    )}
                  </form>
                </div>
              )}

              {/* Table lines */}
              <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b-2 border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    Danh sách dòng lương
                    {currentRun.lines && currentRun.lines.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {currentRun.lines.length}
                      </span>
                    )}
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Nhân viên
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Số tiền
                        </th>
                        <th className="px-5 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {!currentRun.lines || currentRun.lines.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-5 py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-3 bg-gray-100 rounded-full">
                                <Users className="w-8 h-8 text-gray-400" />
                              </div>
                              <p className="text-sm font-medium text-gray-500">
                                Chưa có dòng lương nào
                              </p>
                              {isHRStaff && currentRun.status === "draft" && (
                                <p className="text-xs text-gray-400">
                                  Sử dụng form bên trên để thêm dòng lương
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentRun.lines.map((line: PayrollRunLineDTO, index: number) => (
                          <tr
                            key={line.id}
                            className={`hover:bg-gray-50 transition-colors ${
                              editingLineId === line.id ? "bg-blue-50" : ""
                            }`}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {line.employee?.full_name || `Nhân viên #${line.employee_id}`}
                                  </p>
                                  {line.employee?.code && (
                                    <p className="text-xs text-gray-500">
                                      Mã: {line.employee.code}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-gray-900">
                                  {Number(line.amount).toLocaleString("vi-VN")}
                                </span>
                                <span className="text-xs text-gray-500">VNĐ</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {isHRStaff && currentRun.status === "draft" ? (
                                  <>
                                    <button
                                      onClick={() => handleEditLine(line)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
                                      title="Sửa"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLine(line)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                                      title="Xóa"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400 italic px-2 py-1 bg-gray-50 rounded">
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

                {/* Total summary */}
                {currentRun.lines && currentRun.lines.length > 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">
                        Tổng cộng:
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-gray-900">
                          {currentRun.lines
                            .reduce((sum: number, line: PayrollRunLineDTO) => 
                              sum + Number(line.amount), 0
                            )
                            .toLocaleString("vi-VN")}
                        </span>
                        <span className="text-xs text-gray-500">VNĐ</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t-2 border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-between items-center">
              <div>
                {isHRStaff && currentRun.status === "draft" && (
                  <button
                    onClick={handleCalculate}
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tính lương tự động
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowLinesModal(false)}
                className="px-6 py-2.5 rounded-lg border-2 border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
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