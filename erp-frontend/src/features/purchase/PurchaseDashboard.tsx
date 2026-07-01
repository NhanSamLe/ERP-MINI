import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { purchaseReportApi, PurchaseDashboardStats } from "../reports/api/purchaseReport.api";
import { formatMoney } from "@/utils/currency.helper";
import {
  ShoppingBag,
  DollarSign,
  Clock,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8", // slate-400
  waiting_approval: "#f59e0b", // amber-500
  confirmed: "#3b82f6", // blue-500
  partially_received: "#6366f1", // indigo-500
  completed: "#10b981", // emerald-500
  cancelled: "#ef4444", // red-500
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  waiting_approval: "Chờ phê duyệt",
  confirmed: "Đã xác nhận",
  partially_received: "Đã nhận một phần",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

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
      {/* Background soft gradient layer */}
      <div className={`absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 bg-gradient-to-br ${gradientClass}`} />
      
      {/* Icon container */}
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

export default function PurchaseDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<PurchaseDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await purchaseReportApi.getDashboardStats();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Đang tải bảng điều khiển mua hàng...</p>
        </div>
      </div>
    );
  }

  const { stats, trends, statusDistribution, topSuppliers, recentOrders } = data;

  // Xử lý dữ liệu biểu đồ trạng thái
  const pieData = statusDistribution.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    statusKey: item.status,
  }));

  return (
    <div className="min-h-screen bg-slate-50/40 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Bảng điều khiển mua hàng
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1.5">
            Phân tích chi tiêu, quản lý nhà cung cấp & theo dõi đơn mua hàng
          </p>
        </div>
        <button
          onClick={() => navigate("/purchase-orders/create")}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition duration-200 text-sm whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-4.5 h-4.5" />
          Tạo đơn mua hàng mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Tổng chi tiêu mua hàng"
          value={formatMoney(stats.total_spend)}
          icon={<DollarSign className="w-5 h-5" />}
          gradientClass="from-emerald-500 to-teal-600"
          iconBgClass="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-100"
        />
        <StatCard
          label="Đơn chờ phê duyệt"
          value={stats.pending_approval_count}
          icon={<Clock className="w-5 h-5" />}
          gradientClass="from-amber-500 to-orange-600"
          iconBgClass="bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-100"
          onClick={() => navigate("/purchase/orders")}
        />
        <StatCard
          label="Tổng đơn mua hàng"
          value={stats.total_orders_count}
          icon={<ShoppingBag className="w-5 h-5" />}
          gradientClass="from-blue-500 to-indigo-600"
          iconBgClass="bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-100"
          onClick={() => navigate("/purchase/orders")}
        />
        <StatCard
          label="Nhà cung cấp hoạt động"
          value={stats.active_suppliers_count}
          icon={<Users className="w-5 h-5" />}
          gradientClass="from-purple-500 to-pink-600"
          iconBgClass="bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-100"
          onClick={() => navigate("/purchase/vendors")}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Xu hướng chi tiêu mua hàng
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                Thống kê chi tiêu mua hàng qua các tháng
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            {trends.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-gray-400 italic text-sm">
                Không có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={trends}
                  margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(v) => formatMoney(v)}
                    width={80}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    }}
                    formatter={(v: any) => [formatMoney(v), "Chi tiêu mua"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#f97316"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#spendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="border-gray-100 shadow-sm bg-white/80 backdrop-blur-md overflow-hidden flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
            <CardTitle className="text-base font-semibold text-gray-800">
              Trạng thái đơn hàng
            </CardTitle>
            <CardDescription className="text-xs text-gray-400 mt-0.5">
              Phân bố trạng thái của các đơn mua hàng
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col items-center justify-center">
            {pieData.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Không có dữ liệu</p>
            ) : (
              <div className="w-full flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.statusKey] || "#cbd5e1"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend list */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 w-full text-xs max-h-[100px] overflow-y-auto pr-1">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[item.statusKey] || "#cbd5e1" }}
                      />
                      <span className="text-gray-600 truncate">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom section: Top Suppliers & Recent POs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Suppliers spending */}
        <Card className="lg:col-span-1 border-gray-100 shadow-sm bg-white/80 backdrop-blur-md overflow-hidden flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">
                Top nhà cung cấp
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                Nhà cung cấp có lượng chi tiêu cao nhất
              </CardDescription>
            </div>
            <Badge className="bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-50 font-bold px-2 py-0.5 text-2xs">
              Chi tiêu nhiều nhất
            </Badge>
          </CardHeader>
          <CardContent className="p-5 flex-1">
            {topSuppliers.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Không có dữ liệu nhà cung cấp</p>
            ) : (
              <div className="space-y-4">
                {topSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex flex-col p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 hover:border-slate-100 transition duration-200 gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-800 text-sm truncate max-w-[150px]">
                        {supplier.name}
                      </p>
                      <p className="text-sm font-extrabold text-orange-600 font-mono">
                        {formatMoney(supplier.total_spend)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-2xs text-gray-400">
                      <span>{supplier.phone || supplier.email || "N/A"}</span>
                      <span className="font-medium bg-slate-200/50 text-slate-600 px-1.5 py-0.5 rounded">
                        {supplier.count} đơn hàng
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Purchase Orders */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm bg-white/80 backdrop-blur-md overflow-hidden flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">
                Đơn mua hàng gần đây
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                Các đơn mua hàng vừa được tạo trên hệ thống
              </CardDescription>
            </div>
            <button
              onClick={() => navigate("/purchase/orders")}
              className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 transition"
            >
              Xem tất cả
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left">Số PO</th>
                    <th className="px-5 py-3 text-left">Nhà cung cấp</th>
                    <th className="px-5 py-3 text-left">Ngày đặt</th>
                    <th className="px-5 py-3 text-right">Tổng tiền</th>
                    <th className="px-5 py-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-gray-400 italic">
                        Chưa có đơn mua hàng nào
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/purchase-orders/view/${order.id}`)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4 font-bold text-gray-900 font-mono text-xs">
                          {order.po_no}
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-700 truncate max-w-[150px]">
                          {order.supplier?.name ?? "N/A"}
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs">
                          {order.order_date
                            ? new Date(order.order_date).toLocaleDateString("vi-VN")
                            : "N/A"}
                        </td>
                        <td className="px-5 py-4 text-right font-bold font-mono text-gray-900 text-xs">
                          {formatMoney(order.total_after_tax ?? 0)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: `${STATUS_COLORS[order.status]}15`,
                              color: STATUS_COLORS[order.status],
                            }}
                          >
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
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
    </div>
  );
}
