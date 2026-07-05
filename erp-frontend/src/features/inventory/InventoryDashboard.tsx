import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  DashboardStats,
  StockSummaryItem,
  ExpiringLot,
  inventoryReportApi,
} from "../reports/api/inventoryReport.api";
import { formatMoney } from "@/utils/currency.helper";
import { AlertTriangle, Package, Clock, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";

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

export default function InventoryDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<StockSummaryItem[]>([]);
  const [lowStock, setLowStock] = useState<StockSummaryItem[]>([]);
  const [expiring, setExpiring] = useState<ExpiringLot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, summary, low, exp] = await Promise.all([
          inventoryReportApi.getDashboardStats(),
          inventoryReportApi.getStockSummary(),
          inventoryReportApi.getLowStock(),
          inventoryReportApi.getExpiringLots(30),
        ]);
        setStats(s);
        // Top 10 by total_value
        const sorted = [...summary]
          .filter((x) => Number(x.total_value ?? 0) > 0)
          .sort(
            (a, b) => Number(b.total_value ?? 0) - Number(a.total_value ?? 0),
          )
          .slice(0, 10);
        setTopProducts(sorted);
        setLowStock(low.slice(0, 10));
        setExpiring(exp);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  function daysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Đang tải bảng điều khiển kho...</p>
        </div>
      </div>
    );
  }

  const chartData = topProducts.map((p) => {
    const name = p.product?.name ?? "";
    return {
      name: name.length > 14 ? name.slice(0, 14) + "…" : name,
      value: Number(p.total_value ?? 0),
    };
  });

  return (
    <div className="min-h-screen bg-slate-50/40 p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Bảng điều khiển kho
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1.5">
          Tổng quan thời gian thực về hoạt động & định giá kho hàng
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Tổng giá trị tồn kho"
          value={formatMoney(stats?.total_stock_value ?? 0)}
          icon={<Package className="w-5 h-5" />}
          gradientClass="from-indigo-500 to-purple-600"
          iconBgClass="bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-100"
        />
        <StatCard
          label="Sản phẩm dưới mức tối thiểu"
          value={stats?.low_stock_count ?? 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          gradientClass="from-amber-500 to-orange-600"
          iconBgClass="bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-100"
          onClick={() => navigate("/inventory/stock")}
        />
        <StatCard
          label="Lô hàng sắp hết hạn (30 ngày)"
          value={stats?.expiring_lots_count ?? 0}
          icon={<Clock className="w-5 h-5" />}
          gradientClass="from-rose-500 to-red-600"
          iconBgClass="bg-gradient-to-br from-rose-500 to-red-600 shadow-red-100"
          onClick={() => navigate("/inventory/lots")}
        />
        <StatCard
          label="Yêu cầu chờ duyệt"
          value={stats?.pending_moves_count ?? 0}
          icon={<FileCheck className="w-5 h-5" />}
          gradientClass="from-sky-500 to-blue-600"
          iconBgClass="bg-gradient-to-br from-sky-500 to-blue-600 shadow-blue-100"
          onClick={() => navigate("/inventory/stock_move")}
        />
      </div>

      {/* Chart + Expiring lots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">
                Top 10 sản phẩm theo giá trị tồn kho
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                Các sản phẩm có giá trị tài sản tồn kho cao nhất
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 italic text-sm">
                Không có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 8, left: 8, bottom: 40 }}
                >
                  <defs>
                    <linearGradient id="chartBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
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
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
                    }}
                    formatter={(v: any) => [formatMoney(v), "Giá trị tồn kho"]} 
                  />
                  <Bar dataKey="value" fill="url(#chartBarGradient)" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expiring lots */}
        <Card className="border-gray-100 shadow-sm bg-white/80 backdrop-blur-md overflow-hidden flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
              <CardTitle className="text-base font-semibold text-gray-800">
                Lô hàng sắp hết hạn
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-gray-400 mt-0.5">
              Các lô hàng tồn kho sẽ hết hạn trong vòng 30 ngày
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex-1">
            {expiring.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                Không có lô hàng nào sắp hết hạn
              </p>
            ) : (
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {expiring.map((lot) => {
                  const days = daysUntil(lot.expiry_date);
                  const isCritical = days <= 7;
                  return (
                    <div
                      key={lot.id}
                      className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 hover:border-slate-100 transition duration-200"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-gray-800 line-clamp-1">
                          {lot.product?.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 font-semibold font-mono rounded bg-slate-200/60 text-slate-600">
                            Lô: {lot.lot_no}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            HSD: {new Date(lot.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Badge
                        className={`text-xs border px-2.5 py-0.5 rounded-full font-bold shadow-none ${
                          isCritical
                            ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"
                        }`}
                      >
                        Còn {days} ngày
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low stock table */}
      <Card className="border-gray-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
        <CardHeader className="px-6 py-4 border-b border-gray-100 flex flex-row items-center justify-between bg-gray-50/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">
                Cảnh báo tồn kho thấp
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                Các sản phẩm dưới mức tồn kho an toàn tối thiểu
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-50/50 text-amber-700 border-amber-200 font-bold px-3 py-1 text-xs">
            {lowStock.length} mặt hàng cảnh báo
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Sản phẩm</th>
                  <th className="px-6 py-3 text-left">SKU</th>
                  <th className="px-6 py-3 text-left">Kho hàng</th>
                  <th className="px-6 py-3 text-right">SL hiện tại</th>
                  <th className="px-6 py-3 text-right">SL tối thiểu</th>
                  <th className="px-6 py-3 text-right">SL thiếu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStock.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-gray-400 italic text-sm"
                    >
                      Tất cả sản phẩm đều đủ số lượng tồn kho
                    </td>
                  </tr>
                ) : (
                  lowStock.map((item, idx) => {
                    const qty = Number(item.quantity);
                    const min = Number(item.product?.min_stock_qty ?? 0);
                    const shortage = min - qty;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {item.product?.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                          {item.product?.sku}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.warehouse?.name}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-rose-600 font-bold">
                          {qty.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-gray-500">
                          {min.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-amber-600 font-bold bg-amber-50/10">
                          -{shortage.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
