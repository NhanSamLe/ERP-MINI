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
  FileCheck,
  Calendar,
  RefreshCw,
  Check,
  X,
  ChevronRight,
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
import { Button } from "@/components/ui/Button";

function StatCard({
  label,
  value,
  icon,
  gradientClass,
  iconBgClass,
  onClick,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradientClass: string;
  iconBgClass: string;
  onClick?: () => void;
  delay?: number;
}) {
  return (
    <div
      onClick={onClick}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
      className={`opacity-0 animate-fade-in-up relative overflow-hidden bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-orange-200 group ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className={`absolute inset-0 opacity-[0.01] group-hover:opacity-[0.03] transition-opacity duration-300 bg-gradient-to-br ${gradientClass}`} />
      
      <div
        className={`w-10 h-10 rounded-md flex items-center justify-center text-white shadow-sm transition-all duration-300 group-hover:scale-105 ${iconBgClass}`}
      >
        {icon}
      </div>
      <div className="z-10 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-1 tracking-tight truncate">{value}</p>
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
  const [, setAttendanceToday] = useState<AttendanceDTO[]>([]);
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

  const currentMonth = new Date().getMonth() + 1;
  const birthdayEmployees = employees.filter((emp) => {
    if (!emp.birth_date) return false;
    const bMonth = new Date(emp.birth_date).getMonth() + 1;
    return bMonth === currentMonth;
  });

  const deptChartData = departments.map((dept) => {
    const count = employees.filter((emp) => emp.department_id === dept.id).length;
    return {
      name: dept.name,
      value: count,
    };
  }).filter((item) => item.value > 0);

  const activeEmployees = employees.filter((emp) => emp.status === "active").length;
  const pendingLeaves = leaveRequests.filter((req) => req.status === "pending").length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg p-2.5 shadow-lg text-xs">
          <p className="font-semibold text-gray-900 mb-1 border-b border-gray-100 pb-1">{label}</p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="text-gray-500">Nhân sự:</span>
            <span className="font-semibold text-gray-900">{payload[0].value} người</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Đang tải bảng điều khiển nhân sự...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Standard ERP Page Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-orange-500" />
          </span>
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              Bảng điều khiển Nhân sự (HRM Portal)
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Tổng quan nhân sự, phòng ban, tình trạng chấm công và nghỉ phép
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={loadData}
          loading={loading}
        >
          Tải lại dữ liệu
        </Button>
      </div>

      {/* Stats row with staggered entry animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng nhân sự hoạt động"
          value={activeEmployees}
          icon={<Users className="w-4 h-4" />}
          gradientClass="from-indigo-500 to-indigo-600"
          iconBgClass="bg-indigo-500 shadow-sm"
          onClick={() => navigate("/hrm/employees")}
          delay={0}
        />
        <StatCard
          label="Số phòng ban"
          value={departments.length}
          icon={<Layers className="w-4 h-4" />}
          gradientClass="from-emerald-500 to-emerald-600"
          iconBgClass="bg-emerald-500 shadow-sm"
          onClick={() => navigate("/hrm/department")}
          delay={75}
        />
        <StatCard
          label="Chờ duyệt nghỉ phép"
          value={pendingLeaves}
          icon={<FileCheck className="w-4 h-4" />}
          gradientClass="from-amber-500 to-amber-600"
          iconBgClass="bg-amber-500 shadow-sm"
          onClick={() => navigate("/hrm/leave-requests")}
          delay={150}
        />
        <StatCard
          label="Chức vụ công việc"
          value={positions.length}
          icon={<Calendar className="w-4 h-4" />}
          gradientClass="from-sky-500 to-sky-600"
          iconBgClass="bg-sky-500 shadow-sm"
          onClick={() => navigate("/hrm/position")}
          delay={225}
        />
      </div>

      {/* Department Distribution Chart + Birthday and Shortcut list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Headcount by department chart */}
        <Card 
          className="lg:col-span-2 border-gray-200 shadow-sm overflow-hidden bg-white flex flex-col opacity-0 animate-fade-in-up"
          style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
        >
          <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/40">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-800">
                Phân bổ nhân viên theo Phòng ban
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                Quy mô nhân sự theo từng bộ phận phòng ban đang hoạt động
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-center">
            {deptChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 italic text-xs">
                Không có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={deptChartData}
                  margin={{ top: 10, right: 8, left: 8, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.85}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                    </linearGradient>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.85}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.15}/>
                    </linearGradient>
                    <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.85}/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.15}/>
                    </linearGradient>
                    <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.85}/>
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.15}/>
                    </linearGradient>
                    <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.85}/>
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.15}/>
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
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={true} animationDuration={1000}>
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
        <div className="flex flex-col gap-5">
          {/* Birthdays widget */}
          <Card 
            className="border-gray-200 shadow-sm bg-white overflow-hidden flex flex-col flex-1 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "225ms", animationFillMode: "forwards" }}
          >
            <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/40">
              <CardTitle className="text-sm font-semibold text-gray-800">
                Sinh nhật tháng {currentMonth} 🎂
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                Các thành viên có ngày sinh trong tháng này
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex-1 max-h-[160px] overflow-y-auto">
              {birthdayEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 text-gray-400 text-xs italic">
                  Không có sinh nhật trong tháng này
                </div>
              ) : (
                <div className="space-y-2">
                  {birthdayEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="group flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-orange-200 hover:bg-orange-50/20 transition-all duration-200"
                    >
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="inline-block transform group-hover:scale-125 transition-transform duration-300">🎂</span>
                        {emp.full_name}
                      </span>
                      <span className="text-slate-500 font-mono flex items-center gap-1.5">
                        {emp.birth_date ? new Date(emp.birth_date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : "—"}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-balloon-float">🎈</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick shortcuts widget */}
          <Card 
            className="border-gray-200 shadow-sm bg-white overflow-hidden opacity-0 animate-fade-in-up"
            style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
          >
            <CardHeader className="pb-2.5 border-b border-gray-100 bg-gray-50/40">
              <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Phím tắt nghiệp vụ HR
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1.5">
              <button
                onClick={() => navigate("/hrm/employees")}
                className="group w-full flex items-center justify-between text-xs p-2.5 rounded-md bg-slate-50 hover:bg-orange-50/50 hover:border-orange-200 transition-all border border-slate-100 text-left font-medium text-slate-700"
              >
                <span>Thêm/Quản lý nhân viên</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/hrm/attendance")}
                className="group w-full flex items-center justify-between text-xs p-2.5 rounded-md bg-slate-50 hover:bg-orange-50/50 hover:border-orange-200 transition-all border border-slate-100 text-left font-medium text-slate-700"
              >
                <span>Bảng chấm công tập trung</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/hrm/payroll")}
                className="group w-full flex items-center justify-between text-xs p-2.5 rounded-md bg-slate-50 hover:bg-orange-50/50 hover:border-orange-200 transition-all border border-slate-100 text-left font-medium text-slate-700"
              >
                <span>Tính lương & Kỳ lương</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/hrm/payroll-configs")}
                className="group w-full flex items-center justify-between text-xs p-2.5 rounded-md bg-slate-50 hover:bg-orange-50/50 hover:border-orange-200 transition-all border border-slate-100 text-left font-medium text-slate-700"
              >
                <span>Thiết lập công thức lương</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending Leave Requests list */}
      <Card 
        className="border-gray-200 shadow-sm overflow-hidden bg-white opacity-0 animate-fade-in-up"
        style={{ animationDelay: "375ms", animationFillMode: "forwards" }}
      >
        <CardHeader className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-800">
              Yêu cầu nghỉ phép chờ duyệt
            </CardTitle>
            <CardDescription className="text-xs text-gray-400 mt-0.5">
              Phê duyệt nhanh các đơn đăng ký nghỉ phép của nhân sự
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => navigate("/hrm/leave-requests")}
            rightIcon={<ChevronRight className="w-3 h-3" />}
          >
            Xem tất cả
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5 text-left">Nhân viên</th>
                  <th className="px-4 py-2.5 text-left">Từ ngày</th>
                  <th className="px-4 py-2.5 text-left">Đến ngày</th>
                  <th className="px-4 py-2.5 text-left">Loại phép</th>
                  <th className="px-4 py-2.5 text-left">Lý do</th>
                  <th className="px-4 py-2.5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaveRequests.filter((r) => r.status === "pending").length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400 italic text-xs"
                    >
                      Hiện không có yêu cầu nghỉ phép nào cần phê duyệt
                    </td>
                  </tr>
                ) : (
                  leaveRequests
                    .filter((r) => r.status === "pending")
                    .slice(0, 5)
                    .map((req) => (
                      <tr key={req.id} className="table-row-hover">
                        <td className="px-4 py-3 font-semibold text-gray-800 text-xs">
                          {req.employee?.full_name || "Nhân viên"}
                          <span className="block text-[10px] text-gray-400 font-mono font-normal">
                            {req.employee?.emp_code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                          {req.start_date}
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                          {req.end_date}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[10px] border ${
                            req.leave_type === "annual"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : req.leave_type === "sick"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : req.leave_type === "unpaid"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-teal-50 text-teal-700 border-teal-200"
                          }`}>
                            {req.leave_type === "annual"
                              ? "Nghỉ phép năm"
                              : req.leave_type === "sick"
                              ? "Nghỉ bệnh"
                              : req.leave_type === "unpaid"
                              ? "Nghỉ không lương"
                              : "Thai sản"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 italic text-xs max-w-xs truncate">
                          {req.reason || "Không có lý do"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleApproveLeave(req.id!, req.employee?.full_name || "")}
                              className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Duyệt"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRejectLeave(req.id!, req.employee?.full_name || "")}
                              className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Từ chối"
                            >
                              <X className="w-3.5 h-3.5" />
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
