import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from "../store/leaveRequest/leaveRequest.thunks";
import { fetchAllBranchesThunk } from "../../company/store/branch.thunks";
import { Calendar, Filter, Check, X, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";

const LeaveRequestPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list: requests, loading, error } = useAppSelector((state) => state.leaveRequest);
  const branches = useAppSelector((state) => state.branch.branches || []);
  const authUser = useAppSelector((state) => state.auth.user);

  const userRole = authUser?.role?.code || "";
  const canApproveReject = ["HRMANAGER", "ADMIN"].includes(userRole);

  // Filters State
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    dispatch(fetchLeaveRequests({}));
    dispatch(fetchAllBranchesThunk());
  }, [dispatch]);

  const handleFilterChange = (branchId: string, status: string) => {
    const filter: any = {};
    if (branchId !== "all") {
      filter.branch_id = Number(branchId);
    }
    if (status !== "all") {
      filter.status = status;
    }
    dispatch(fetchLeaveRequests(filter));
  };

  const handleApprove = async (id?: number) => {
    if (!id) return;
    if (window.confirm("Bạn có chắc chắn muốn phê duyệt yêu cầu xin nghỉ này không?")) {
      try {
        await dispatch(approveLeaveRequest(id)).unwrap();
      } catch (err: any) {
        alert(err.message || "Phê duyệt thất bại.");
      }
    }
  };

  const handleReject = async (id?: number) => {
    if (!id) return;
    if (window.confirm("Bạn có chắc chắn muốn từ chối yêu cầu xin nghỉ này không?")) {
      try {
        await dispatch(rejectLeaveRequest(id)).unwrap();
      } catch (err: any) {
        alert(err.message || "Từ chối thất bại.");
      }
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const types: any = {
      annual: { label: "Nghỉ phép năm", color: "bg-blue-50 text-blue-700 border-blue-100" },
      sick: { label: "Nghỉ ốm", color: "bg-purple-50 text-purple-700 border-purple-100" },
      unpaid: { label: "Nghỉ không lương", color: "bg-gray-50 text-gray-700 border-gray-100" },
      maternity: { label: "Nghỉ thai sản", color: "bg-pink-50 text-pink-700 border-pink-100" },
    };
    const t = types[type] || { label: type, color: "bg-gray-50 text-gray-700 border-gray-100" };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${t.color}`}>
        {t.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statuses: any = {
      pending: { label: "Chờ duyệt", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
      approved: { label: "Đã phê duyệt", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
      rejected: { label: "Đã từ chối", color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
    };
    const s = statuses[status] || { label: status, color: "bg-gray-50 text-gray-700 border-gray-100", icon: Clock };
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.color}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {s.label}
      </span>
    );
  };

  const getHalfDayLabel = (halfDay: string) => {
    if (halfDay === "morning") return "Buổi sáng";
    if (halfDay === "afternoon") return "Buổi chiều";
    return "Cả ngày";
  };

  const showBranchFilter = ["ADMIN", "CEO"].includes(authUser?.role?.code || "");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Phê duyệt yêu cầu xin nghỉ</h1>
          <p className="text-gray-500 text-sm mt-1">
            Xem xét và phê duyệt các yêu cầu xin nghỉ của nhân viên trong toàn hệ thống.
          </p>
        </div>
      </div>

      {/* Filters Bar with modern borderless layout */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
          <Filter className="w-4 h-4 text-orange-500" />
          Bộ lọc:
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Branch Filter (Only for Admin/CEO) */}
          {showBranchFilter && (
            <select
              value={selectedBranch}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedBranch(val);
                handleFilterChange(val, selectedStatus);
              }}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-white"
            >
              <option value="all">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedStatus(val);
              handleFilterChange(selectedBranch, val);
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã phê duyệt</option>
            <option value="rejected">Đã từ chối</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {error && (
          <div className="p-6">
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm font-medium">Đang tải danh sách yêu cầu...</p>
          </div>
        ) : !requests || requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-900">Không tìm thấy yêu cầu xin nghỉ nào</p>
            <p className="text-xs text-gray-400">Không có yêu cầu xin nghỉ nào phù hợp với bộ lọc của bạn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Chi nhánh</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4">Thời lượng</th>
                  <th className="px-6 py-4">Loại nghỉ</th>
                  <th className="px-6 py-4">Lý do</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {requests.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">
                        {row.employee?.full_name || `Nhân viên #${row.employee_id}`}
                      </div>
                      <div className="text-xs text-gray-400">{row.employee?.emp_code || ""}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {row.branch?.name || row.branch?.code || `Chi nhánh #${row.branch_id}`}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                      {row.start_date === row.end_date
                        ? row.start_date
                        : `${row.start_date} ~ ${row.end_date}`}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {getHalfDayLabel(row.half_day)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getLeaveTypeBadge(row.leave_type)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={row.reason || ""}>
                      {row.reason || <span className="text-gray-300 italic">Không cung cấp lý do</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(row.status || "pending")}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {row.status === "pending" ? (
                        canApproveReject ? (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleApprove(row.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-sm hover:shadow active:scale-95 transition-all duration-150"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Phê duyệt
                            </button>
                            <button
                              onClick={() => handleReject(row.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg shadow-sm hover:shadow active:scale-95 transition-all duration-150"
                            >
                              <X className="w-3.5 h-3.5" />
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Chờ duyệt (Chỉ Quản lý/Admin có quyền duyệt)</span>
                        )
                      ) : (
                        <span className="text-xs text-gray-400 italic">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequestPage;
