import React, { useEffect, useState } from "react";
import { Calendar, FileText, Plus, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchEmployeeLeaveRequests, createLeaveRequest } from "../store/leaveRequest/leaveRequest.thunks";
import { LeaveRequestDTO } from "../dto/leaveRequest.dto";
import apiClient from "../../../api/axiosClient";

const MyLeaveRequestPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list: requests, loading, error } = useAppSelector((state) => state.leaveRequest);

  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [employeeName, setEmployeeName] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [leaveType, setLeaveType] = useState<"annual" | "sick" | "unpaid" | "maternity">("annual");
  const [halfDay, setHalfDay] = useState<"none" | "morning" | "afternoon">("none");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch employee profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get("/auth/me-attendance");
        const profile = res.data;
        if (profile.employee_id) {
          setEmployeeId(profile.employee_id);
        }
        if (profile.branch_id) {
          setBranchId(profile.branch_id);
        }
        setEmployeeName(profile.employee?.full_name || profile.full_name || "");
      } catch (e) {
        console.error("Error loading employee profile", e);
      }
    };
    fetchProfile();
  }, []);

  // Fetch leave requests once employeeId is loaded
  useEffect(() => {
    if (employeeId) {
      dispatch(fetchEmployeeLeaveRequests(employeeId));
    }
  }, [employeeId, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !branchId) {
      setSubmitError("Your account is not linked to any employee profile.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setSubmitError("Start date cannot be after the end date.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      const payload: LeaveRequestDTO = {
        employee_id: employeeId,
        branch_id: branchId,
        start_date: startDate,
        end_date: endDate,
        leave_type: leaveType,
        half_day: halfDay,
        reason: reason,
      };

      await dispatch(createLeaveRequest(payload)).unwrap();
      setIsModalOpen(false);
      // Reset form
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate(new Date().toISOString().split("T")[0]);
      setLeaveType("annual");
      setHalfDay("none");
      setReason("");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
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
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${t.color}`}>
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
    if (halfDay === "morning") return "Morning Only";
    if (halfDay === "afternoon") return "Afternoon Only";
    return "Full Day";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section with modern gradient background card */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 rounded-2xl p-6 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome, {employeeName || "Employee"}</h1>
          <p className="text-orange-100 text-sm mt-1">
            Submit leave requests and view your approval history here.
          </p>
        </div>
        <button
          onClick={() => {
            setSubmitError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-orange-600 font-semibold rounded-xl shadow-lg hover:bg-orange-50 active:scale-95 transition-all duration-150 text-sm"
        >
          <Plus className="w-5 h-5" />
          Request Leave
        </button>
      </div>

      {/* Leave Requests History Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Your Leave History
          </h2>
        </div>

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
            <p className="text-sm font-medium">Loading leave requests...</p>
          </div>
        ) : !requests || requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <FileText className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-900">No leave requests found</p>
            <p className="text-xs text-gray-400">You haven't submitted any leave requests yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Date Range</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {requests.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
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
                    <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString("en-US") : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form Gửi Đơn Xin Nghỉ Phép */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform scale-100 transition-all">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">New Leave Request</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-xl font-bold p-1 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Duration (If Single Date)
                </label>
                <select
                  value={halfDay}
                  onChange={(e) => setHalfDay(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                >
                  <option value="none">Full Day</option>
                  <option value="morning">Morning Only</option>
                  <option value="afternoon">Afternoon Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                  <option value="maternity">Maternity Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Reason
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter detailed reason..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 font-semibold rounded-xl hover:bg-gray-50 text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 disabled:bg-gray-300 text-sm shadow-md hover:shadow-lg transition-all"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeaveRequestPage;
