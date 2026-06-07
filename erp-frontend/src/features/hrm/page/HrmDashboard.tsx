import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeeApi } from "../api/employee.api";
import { departmentApi } from "../api/department.api";
import { leaveRequestApi } from "../api/leaveRequest.api";
import { attendanceApi } from "../api/attendance.api";
import { positionApi } from "../api/position.api";
import { EmployeeDTO } from "../dto/employee.dto";
import { Department } from "../store/department/department.type";
import { LeaveRequestDTO } from "../dto/leaveRequest.dto";
import { AttendanceDTO } from "../dto/attendance.dto";
import { Position } from "../store/position/position.type";
import { toast } from "react-toastify";
import { confirmAction } from "../../../utils/alert";
import {
  Users,
  Layers,
  FileText,
  FileCheck,
  Calendar,
  Clock,
  Sparkles,
  Plus,
  RefreshCw,
  Check,
  X,
  ChevronRight,
  Smile,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

function StatCard({
  label,
  value,
  icon,
  gradientClass,
  iconBgClass,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradientClass: string;
  iconBgClass: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className={`absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 bg-gradient-to-br ${gradientClass}`} />
      
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm transition-all duration-300 group-hover:scale-110 ${iconBgClass}`}
      >
        {icon}
      </div>
      <div className="z-10">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900 mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

export default function HrmDashboard() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDTO[]>([]);
  const [attendanceToday, setAttendanceToday] = useState<AttendanceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().substring(0, 10);
      
      const [empRes, deptRes, posRes, leaveRes, attRes] = await Promise.all([
        employeeApi.getAll(),
        departmentApi.getAll(),
        positionApi.getAll(),
        leaveRequestApi.getAll(),
        attendanceApi.getAll({ work_date: todayStr }),
      ]);

      setEmployees(empRes.data || []);
      setDepartments(deptRes || []);
      setPositions(posRes || []);
      setLeaveRequests(leaveRes.data || []);
      setAttendanceToday(attRes.data || []);
    } catch (e: any) {
      console.error(e);
      toast.error("Lỗi khi tải dữ liệu HRM Dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveLeave = async (id: number, empName: string) => {
    const confirmed = await confirmAction(
      "Duyệt đơn nghỉ phép?",
      `Bạn có chắc muốn phê duyệt đơn nghỉ phép của ${empName}?`
    );
    if (!confirmed) return;

    try {
      await leaveRequestApi.approve(id);
      toast.success("Đã phê duyệt đơn nghỉ phép");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi duyệt đơn");
    }
  };

  const handleRejectLeave = async (id: number, empName: string) => {
    const confirmed = await confirmAction(
      "Từ chối đơn nghỉ phép?",
      `Bạn có chắc muốn từ chối đơn nghỉ phép của ${empName}?`
    );
    if (!confirmed) return;

    try {
      await leaveRequestApi.reject(id);
      toast.success("Đã từ chối đơn nghỉ phép");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi từ chối đơn");
    }
  };

  // Get current month birthdays
  const currentMonth = new Date().getMonth() + 1;
  const birthdayEmployees = employees.filter((emp) => {
    if (!emp.birth_date) return false;
    const bMonth = new Date(emp.birth_date).getMonth() + 1;
    return bMonth === currentMonth;
  });

  // Department chart data
  const deptChartData = departments.map((dept) => {
    const count = employees.filter((emp) => emp.department_id === dept.id).length;
    return {
      name: dept.name,
      value: count,
    };
  }).filter((item) => item.value > 0);

  // Status counters
  const activeEmployees = employees.filter((emp) => emp.status === "active").length;
  const pendingLeaves = leaveRequests.filter((req) => req.status === "pending").length;

  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Đang tải bảng điều khiển nhân sự...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/40 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Bảng điều khiển Nhân sự (HRM Portal)
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1.5">
            Tổng quan nhân sự, phòng ban, tình trạng chấm công và nghỉ phép
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center justify-center gap-2 p-2.5 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm font-semibold">Tải lại dữ liệu</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Tổng nhân sự hoạt động"
          value={activeEmployees}
          icon={<Users className="w-5 h-5" />}
          gradientClass="from-indigo-500 to-indigo-600"
          iconBgClass="bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-100"
          onClick={() => navigate("/hrm/employees")}
        />
        <StatCard
          label="Số phòng ban"
          value={departments.length}
          icon={<Layers className="w-5 h-5" />}
          gradientClass="from-emerald-500 to-emerald-600"
          iconBgClass="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-100"
          onClick={() => navigate("/hrm/department")}
        />
        <StatCard
          label="Chờ duyệt nghỉ phép"
          value={pendingLeaves}
          icon={<FileCheck className="w-5 h-5" />}
          gradientClass="from-amber-500 to-amber-600"
          iconBgClass="bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-100"
          onClick={() => navigate("/hrm/leave-requests")}
        />
        <StatCard
          label="Chức vụ công việc"
          value={positions.length}
          icon={<Calendar className="w-5 h-5" />}
          gradientClass="from-sky-500 to-sky-600"
          iconBgClass="bg-gradient-to-br from-sky-500 to-sky-600 shadow-sky-100"
          onClick={() => navigate("/hrm/position")}
        />
      </div>

      {/* Department Distribution Chart + Birthday and Shortcut list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Headcount by department chart */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">
                Phân bổ nhân viên theo Phòng ban
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                Quy mô nhân sự theo từng bộ phận phòng ban đang hoạt động
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            {deptChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 italic text-sm">
                Không có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={deptChartData}
                  margin={{ top: 20, right: 8, left: 8, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.96)",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    }}
                    formatter={(v: number) => [v, "Nhân sự"]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28}>
                    {deptChartData.map((entry, index) => {
                      const grads = [
                        "url(#purpleGrad)",
                        "url(#emeraldGrad)",
                        "url(#indigoGrad)",
                        "url(#amberGrad)",
                        "url(#roseGrad)",
                      ];
                      return <Cell key={`cell-${index}`} fill={grads[index % grads.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Right side: Birthdays & Shortcuts */}
        <div className="flex flex-col gap-6">
          {/* Birthdays widget */}
          <Card className="border-gray-100 shadow-sm bg-white/80 backdrop-blur-md overflow-hidden flex flex-col flex-1">
            <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-base font-semibold text-gray-800">
                  Sinh nhật tháng {currentMonth} 🎂
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                Các thành viên có ngày sinh trong tháng này
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 flex-1 max-h-[160px] overflow-y-auto">
              {birthdayEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 text-gray-400 text-xs italic">
                  <Smile className="w-6 h-6 text-gray-300 mb-1" />
                  Không có sinh nhật trong tháng này
                </div>
              ) : (
                <div className="space-y-3">
                  {birthdayEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <span className="font-semibold text-slate-800">{emp.full_name}</span>
                      <span className="text-slate-500 font-mono">
                        {emp.birth_date ? new Date(emp.birth_date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick shortcuts widget */}
          <Card className="border-gray-100 shadow-sm bg-white/80 backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/20">
              <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Phím tắt nghiệp vụ HR
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <button
                onClick={() => navigate("/hrm/employees")}
                className="w-full flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Thêm/Quản lý nhân viên</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => navigate("/hrm/attendance")}
                className="w-full flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Bảng chấm công tập trung</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => navigate("/hrm/payroll")}
                className="w-full flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Tính lương & Kỳ lương</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => navigate("/hrm/payroll-configs")}
                className="w-full flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Thiết lập công thức lương</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending Leave Requests list */}
      <Card className="border-gray-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
        <CardHeader className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
          <div>
            <CardTitle className="text-base font-semibold text-gray-800">
              Yêu cầu nghỉ phép chờ duyệt
            </CardTitle>
            <CardDescription className="text-xs text-gray-400 mt-0.5">
              Phê duyệt nhanh các đơn đăng ký nghỉ phép của nhân sự
            </CardDescription>
          </div>
          <button
            onClick={() => navigate("/hrm/leave-requests")}
            className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition"
          >
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Nhân viên</th>
                  <th className="px-6 py-3 text-left">Từ ngày</th>
                  <th className="px-6 py-3 text-left">Đến ngày</th>
                  <th className="px-6 py-3 text-left">Loại phép</th>
                  <th className="px-6 py-3 text-left">Lý do</th>
                  <th className="px-6 py-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaveRequests.filter((r) => r.status === "pending").length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-400 italic text-xs"
                    >
                      Hiện không có yêu cầu nghỉ phép nào cần phê duyệt
                    </td>
                  </tr>
                ) : (
                  leaveRequests
                    .filter((r) => r.status === "pending")
                    .slice(0, 5)
                    .map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {req.employee?.full_name || "Nhân viên"}
                          <span className="block text-[10px] text-gray-400 font-mono">
                            {req.employee?.emp_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                          {req.start_date}
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                          {req.end_date}
                        </td>
                        <td className="px-6 py-4 text-gray-600 capitalize">
                          {req.leave_type === "annual"
                            ? "Nghỉ phép năm"
                            : req.leave_type === "sick"
                            ? "Nghỉ bệnh"
                            : req.leave_type === "unpaid"
                            ? "Nghỉ không lương"
                            : "Thai sản"}
                        </td>
                        <td className="px-6 py-4 text-gray-500 italic max-w-xs truncate">
                          {req.reason || "Không có lý do"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApproveLeave(req.id!, req.employee?.full_name || "")}
                              className="p-1 text-emerald-600 hover:text-white hover:bg-emerald-500 rounded-lg border border-emerald-200 transition"
                              title="Duyệt"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectLeave(req.id!, req.employee?.full_name || "")}
                              className="p-1 text-rose-600 hover:text-white hover:bg-rose-500 rounded-lg border border-rose-200 transition"
                              title="Từ chối"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
