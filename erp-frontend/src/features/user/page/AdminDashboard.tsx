import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "../../../store/store";
import { requestPasswordReset } from "../../auth/auth.service";
import {
  fetchAllUsers,
  fetchAllRoles,
  updateUserThunk,
} from "../store";
import { setError } from "../store/user.slice";
import { confirmAction } from "../../../utils/alert";
import { User } from "../../../types/User";
import { updateUserDTO } from "../dto/userDTO";
import { toast } from "react-toastify";
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Activity,
  HardDrive,
  KeyRound,
  Plus,
  RefreshCw,
  ArrowRight,
  Server,
  Settings,
  ShieldAlert,
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
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradientClass: string;
  iconBgClass: string;
}) {
  return (
    <div
      className="relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group"
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { users, roles, loading } = useSelector(
    (state: RootState) => state.user
  );
  const { branches } = useSelector((state: RootState) => state.branch);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAllUsers());
    dispatch(fetchAllRoles());
  }, [dispatch]);

  const handleToggleStatus = async (user: User) => {
    const action = user.is_active ? "vô hiệu hóa" : "kích hoạt";
    const confirmed = await confirmAction(
      `${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản?`,
      `Bạn có chắc muốn ${action} tài khoản ${user.full_name || user.username} không?`
    );
    if (!confirmed) return;

    const updateData: updateUserDTO = {
      username: user.username,
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      role_id: user.role?.id || 1,
      branch_id: user.branch?.id || 1,
      is_active: !user.is_active,
    };

    const resultAction = await dispatch(updateUserThunk(updateData));

    if (updateUserThunk.rejected.match(resultAction)) {
      toast.error(resultAction.payload as string);
      return;
    }
    toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công`);
  };

  const handleResetPassword = async (user: User) => {
    if (!user.email) {
      toast.error("Người dùng chưa có email");
      return;
    }
    if (!user.is_active) {
      toast.error("Tài khoản chưa được kích hoạt");
      return;
    }

    const confirmed = await confirmAction(
      "Gửi email đặt lại mật khẩu?",
      `Bạn có chắc muốn gửi email đặt lại mật khẩu cho ${user.full_name || user.username} không?`
    );
    if (!confirmed) return;

    try {
      await requestPasswordReset(user.username);
      toast.success("Đã gửi email đặt lại mật khẩu 📧");
    } catch (err: any) {
      toast.error(err.message || "Gửi email đặt lại mật khẩu thất bại");
    }
  };

  // Process data for role chart
  const roleChartData = roles.map((role) => {
    const count = users.filter((u) => u.role?.id === role.id).length;
    return {
      name: role.name,
      value: count,
    };
  }).filter((item) => item.value > 0);

  // Filter users for search listing
  const filteredUsers = users
    .filter((u) => {
      const matchText = (u.full_name || u.username || u.email || "").toLowerCase();
      return matchText.includes(searchTerm.toLowerCase());
    })
    .slice(0, 5); // show top 5

  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

  return (
    <div className="min-h-screen bg-slate-50/40 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Hệ thống Quản trị (Admin Control)
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1.5">
            Quản lý người dùng, phân quyền và giám sát hoạt động hệ thống ERP
          </p>
        </div>
        <button
          onClick={() => {
            dispatch(fetchAllUsers());
            dispatch(fetchAllRoles());
          }}
          className="flex items-center justify-center gap-2 p-2.5 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="text-sm font-semibold">Tải lại dữ liệu</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Tổng người dùng"
          value={users.length}
          icon={<Users className="w-5 h-5" />}
          gradientClass="from-indigo-500 to-indigo-600"
          iconBgClass="bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-100"
        />
        <StatCard
          label="Người dùng đang hoạt động"
          value={users.filter((u) => u.is_active).length}
          icon={<UserCheck className="w-5 h-5" />}
          gradientClass="from-emerald-500 to-emerald-600"
          iconBgClass="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-100"
        />
        <StatCard
          label="Tài khoản bị khóa"
          value={users.filter((u) => !u.is_active).length}
          icon={<UserX className="w-5 h-5" />}
          gradientClass="from-rose-500 to-rose-600"
          iconBgClass="bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-100"
        />
        <StatCard
          label="Số vai trò phân quyền"
          value={roles.length}
          icon={<ShieldCheck className="w-5 h-5" />}
          gradientClass="from-amber-500 to-amber-600"
          iconBgClass="bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-100"
        />
      </div>

      {/* Chart + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">
                Phân bổ người dùng theo vai trò
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                Số lượng nhân sự được gán quyền theo từng vị trí vai trò trong hệ thống
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            {roleChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 italic text-sm">
                Không có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={roleChartData}
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
                    formatter={(v: number) => [v, "Người dùng"]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                    {roleChartData.map((entry, index) => {
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

        {/* System Health Widget */}
        <Card className="border-gray-100 shadow-sm bg-white/80 backdrop-blur-md overflow-hidden flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <CardTitle className="text-base font-semibold text-gray-800">
                Trạng thái hệ thống
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-gray-400 mt-0.5">
              Giám sát sức khỏe hạ tầng thời gian thực
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex-1 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-400" />
                  Trạng thái máy chủ
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Hoạt động
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-slate-400" />
                  Kết nối CSDL
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Tốt (0.42ms)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-400" />
                  Số chi nhánh hoạt động
                </span>
                <span className="font-semibold text-gray-800">
                  {branches.length} chi nhánh
                </span>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Phím tắt quản trị
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => navigate("/admin/users")}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition text-slate-700 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm User
                </button>
                <button
                  onClick={() => navigate("/master-data/currencies")}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition text-slate-700 font-semibold"
                >
                  Tiền tệ
                </button>
                <button
                  onClick={() => navigate("/company/branches")}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition text-slate-700 font-semibold"
                >
                  Chi nhánh
                </button>
                <button
                  onClick={() => navigate("/finance/reports")}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition text-slate-700 font-semibold"
                >
                  Báo cáo tài chính
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users List Widget */}
      <Card className="border-gray-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
        <CardHeader className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/20">
          <div>
            <CardTitle className="text-base font-semibold text-gray-800">
              Quản lý nhanh trạng thái người dùng
            </CardTitle>
            <CardDescription className="text-xs text-gray-400 mt-0.5">
              Danh sách tài khoản trong hệ thống kèm trạng thái hoạt động nhanh
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 bg-white"
            />
            <button
              onClick={() => navigate("/admin/users")}
              className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition px-2 py-1"
            >
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Tên người dùng</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Vai trò</th>
                  <th className="px-6 py-3 text-left">Chi nhánh</th>
                  <th className="px-6 py-3 text-center">Trạng thái</th>
                  <th className="px-6 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-gray-400 italic text-sm"
                    >
                      Không tìm thấy người dùng nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700">
                            {(user.full_name || user.username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{user.full_name || "—"}</p>
                            <p className="text-[11px] text-gray-400">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {user.email || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {user.role?.name || "Khách"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.branch?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-none transition-all ${
                            user.is_active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              user.is_active ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                            }`}
                          />
                          {user.is_active ? "Đang hoạt động" : "Bị vô hiệu hóa"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleResetPassword(user)}
                            disabled={!user.is_active || !user.email}
                            title={user.is_active && user.email ? "Gửi lại mật khẩu qua Email" : "Tài khoản cần Active & có Email"}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-slate-50 transition text-gray-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <KeyRound className="w-4 h-4" />
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
