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

function StatCard({
  label,
  value,
  icon,
  color,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 ${onClick ? "cursor-pointer hover:shadow-md transition" : ""}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  const chartData = topProducts.map((p) => ({
    name:
      p.product?.name?.length > 14
        ? p.product.name.slice(0, 14) + "…"
        : (p.product?.name ?? ""),
    value: Number(p.total_value ?? 0),
  }));

  const COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#a78bfa",
    "#c4b5fd",
    "#ddd6fe",
    "#818cf8",
    "#4f46e5",
    "#7c3aed",
    "#9333ea",
    "#a855f7",
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Inventory Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your warehouse operations
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Stock Value"
          value={formatMoney(stats?.total_stock_value ?? 0)}
          icon={<Package className="w-6 h-6 text-indigo-600" />}
          color="bg-indigo-50"
        />
        <StatCard
          label="Low Stock Products"
          value={stats?.low_stock_count ?? 0}
          icon={<AlertTriangle className="w-6 h-6 text-orange-500" />}
          color="bg-orange-50"
          onClick={() => navigate("/inventory/stock")}
        />
        <StatCard
          label="Expiring Lots (30d)"
          value={stats?.expiring_lots_count ?? 0}
          icon={<Clock className="w-6 h-6 text-red-500" />}
          color="bg-red-50"
          onClick={() => navigate("/inventory/lots")}
        />
        <StatCard
          label="Pending Approvals"
          value={stats?.pending_moves_count ?? 0}
          icon={<FileCheck className="w-6 h-6 text-blue-500" />}
          color="bg-blue-50"
          onClick={() => navigate("/inventory/stock_move")}
        />
      </div>

      {/* Chart + Expiring lots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Top 10 Products by Stock Value
          </h2>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 italic text-sm">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, left: 8, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => formatMoney(v)}
                  width={80}
                />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expiring lots */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            Expiring Lots (30 days)
          </h2>
          {expiring.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              No lots expiring soon
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {expiring.map((lot) => {
                const days = daysUntil(lot.expiry_date);
                return (
                  <div
                    key={lot.id}
                    className="flex items-center justify-between text-sm border-b border-gray-50 pb-2"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {lot.product?.name}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {lot.lot_no}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${days <= 7 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}
                    >
                      {days}d
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Low stock table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <h2 className="text-base font-semibold text-gray-800">
            Low Stock Alert
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">SKU</th>
                <th className="p-3 text-left">Warehouse</th>
                <th className="p-3 text-right">Current Qty</th>
                <th className="p-3 text-right">Min Qty</th>
                <th className="p-3 text-right">Shortage</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-gray-400 italic"
                  >
                    All products are sufficiently stocked
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
                      className={`border-t ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                      <td className="p-3 font-medium text-gray-800">
                        {item.product?.name}
                      </td>
                      <td className="p-3 font-mono text-xs text-gray-500">
                        {item.product?.sku}
                      </td>
                      <td className="p-3 text-gray-600">
                        {item.warehouse?.name}
                      </td>
                      <td className="p-3 text-right font-mono text-red-600 font-semibold">
                        {qty.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono text-gray-600">
                        {min.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono text-orange-600 font-semibold">
                        -{shortage.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
