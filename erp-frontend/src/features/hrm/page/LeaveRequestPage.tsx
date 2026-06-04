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
    if (window.confirm("Are you sure you want to approve this leave request?")) {
      try {
        await dispatch(approveLeaveRequest(id)).unwrap();
      } catch (err: any) {
        alert(err.message || "Failed to approve.");
      }
    }
  };

  const handleReject = async (id?: number) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to reject this leave request?")) {
      try {
        await dispatch(rejectLeaveRequest(id)).unwrap();
      } catch (err: any) {
        alert(err.message || "Failed to reject.");
      }
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const types: any = {
      annual: { label: "Annual Leave", color: "bg-blue-50 text-blue-700 border-blue-100" },
      sick: { label: "Sick Leave", color: "bg-purple-50 text-purple-700 border-purple-100" },
      unpaid: { label: "Unpaid Leave", color: "bg-gray-50 text-gray-700 border-gray-100" },
      maternity: { label: "Maternity Leave", color: "bg-pink-50 text-pink-700 border-pink-100" },
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
      pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
      approved: { label: "Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
      rejected: { label: "Rejected", color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
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
    if (halfDay === "morning") return "Morning";
    if (halfDay === "afternoon") return "Afternoon";
    return "Full Day";
  };

  const showBranchFilter = ["ADMIN", "CEO"].includes(authUser?.role?.code || "");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Approve Leave Requests</h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and approve employee leave requests across the system.
          </p>
        </div>
      </div>

      {/* Filters Bar with modern borderless layout */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
          <Filter className="w-4 h-4 text-orange-500" />
          Filters:
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
              <option value="all">All Branches</option>
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
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
            <p className="text-sm font-medium">Loading requests...</p>
          </div>
        ) : !requests || requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-900">No leave requests found</p>
            <p className="text-xs text-gray-400">There are no leave requests matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Date Range</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {requests.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">
                        {row.employee?.full_name || `Employee #${row.employee_id}`}
                      </div>
                      <div className="text-xs text-gray-400">{row.employee?.emp_code || ""}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {row.branch?.name || row.branch?.code || `Branch #${row.branch_id}`}
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
                      {row.reason || <span className="text-gray-300 italic">No reason provided</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(row.status || "pending")}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {row.status === "pending" ? (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleApprove(row.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-sm hover:shadow active:scale-95 transition-all duration-150"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(row.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg shadow-sm hover:shadow active:scale-95 transition-all duration-150"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Processed</span>
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
