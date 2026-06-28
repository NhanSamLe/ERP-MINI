import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BadgePercent,
  BanknoteArrowDown,
  Boxes,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";
import axiosClient from "../../api/axiosClient";
import {
  ChartPanel,
  ChartTooltip,
  DashboardHeader,
  DashboardLoading,
  MetricCard,
  type DashboardBranch,
  type DashboardPeriod,
} from "../../components/dashboard/ExecutiveDashboard";
import type { RootState } from "../../store/store";
import {
  downloadSalesDashboardExcel,
  fetchSalesDashboard,
} from "./service/salesDashboard.service";

interface RevenuePoint {
  date: string;
  revenue: number;
  collected: number;
}

interface AgingPoint {
  [key: string]: string | number;
  range: string;
  amount: number;
}

interface OverdueCustomer {
  invoiceId: number;
  invoiceNo: string;
  customerName: string;
  amount: number;
  days: number;
}

interface LowStockItem {
  productId: number;
  name: string;
  sku: string;
  stock: number;
  minStockQty: number;
}

interface SalesDashboardData {
  startDate: string;
  endDate: string;
  summary: {
    netSales: number;
    cashCollected: number;
    outstandingAr: number;
    returnRate: number;
  };
  charts: {
    revenueVsCollection: RevenuePoint[];
    arAging: AgingPoint[];
  };
  alerts: {
    overdueCustomers: OverdueCustomer[];
    lowStockItems: LowStockItem[];
  };
}

const AGING_COLORS = ["#38bdf8", "#fbbf24", "#fb923c", "#f43f5e"];

const compactCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const fullCurrency = (value: number) =>
  `${Math.round(value).toLocaleString("vi-VN")} ₫`;

const formatDate = (value: string) => {
  if (/^\d{4}-\d{2}$/.test(value)) return `T${value.slice(5)}`;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(value));
};

export default function SalesDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = user?.role?.code || "SALES";
  const [period, setPeriod] = useState<DashboardPeriod>("last_30_days");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<DashboardBranch[]>([]);
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== "CEO" && userRole !== "ADMIN") return;
    axiosClient
      .get<{ data: DashboardBranch[] }>("/branch")
      .then((response) => setBranches(response.data?.data || []))
      .catch((error) => console.error("Error loading branches:", error));
  }, [userRole]);

  useEffect(() => {
    const params: Record<string, string> = { period };
    if (period === "custom") {
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
    }
    if (branchId) params.branch_id = branchId;

    setLoading(true);
    fetchSalesDashboard(params)
      .then((response) => setData(response as SalesDashboardData))
      .catch((error) => {
        console.error(error);
        toast.error("Không thể tải dữ liệu Sales Dashboard");
      })
      .finally(() => setLoading(false));
  }, [period, dateFrom, dateTo, branchId]);

  const handleExport = async () => {
    try {
      const params: Record<string, string> = { period };
      if (period === "custom") {
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
      }
      if (branchId) params.branch_id = branchId;
      const blob = await downloadSalesDashboardExcel(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Bao_Cao_Kinh_Doanh_${period}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất báo cáo Sales");
    } catch {
      toast.error("Không thể xuất báo cáo Excel");
    }
  };

  if (loading || !data) {
    return <DashboardLoading label="Đang tổng hợp hiệu suất kinh doanh..." />;
  }

  const { summary, charts, alerts } = data;
  const collectionRate = summary.netSales
    ? Math.round((summary.cashCollected / summary.netSales) * 100)
    : 0;
  const totalAging = charts.arAging.reduce((sum, item) => sum + item.amount, 0);
  const overdueValue = alerts.overdueCustomers.reduce((sum, item) => sum + item.amount, 0);

  return (
    <main className="min-h-screen bg-[#f6f8fc] p-4 text-slate-800 sm:p-6 lg:p-7 print:bg-white print:p-0">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <DashboardHeader
          eyebrow="Sales performance"
          title="Trung tâm điều hành doanh số"
          description="Kết nối doanh thu, dòng tiền, công nợ và rủi ro vận hành thành một bức tranh kinh doanh liền mạch."
          period={period}
          onPeriodChange={setPeriod}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          branches={branches}
          branchId={branchId}
          onBranchChange={setBranchId}
          onExport={handleExport}
          onPrint={() => window.print()}
          highlights={[
            {
              label: "Hiệu suất thu tiền",
              value: `${collectionRate}%`,
              helper: `${compactCurrency(summary.cashCollected)} ₫ đã thực thu`,
            },
            {
              label: "Công nợ quá hạn",
              value: `${compactCurrency(overdueValue)} ₫`,
              helper: `${alerts.overdueCustomers.length} hóa đơn cần thu hồi`,
            },
            {
              label: "Cảnh báo cần xử lý",
              value: String(alerts.overdueCustomers.length + alerts.lowStockItems.length),
              helper: `${alerts.overdueCustomers.length} công nợ · ${alerts.lowStockItems.length} tồn kho`,
            },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Doanh số thuần"
            value={`${compactCurrency(summary.netSales)} ₫`}
            helper="Doanh thu đã xuất hóa đơn trong kỳ"
            icon={CircleDollarSign}
            tone="orange"
          />
          <MetricCard
            label="Tiền đã thu"
            value={`${compactCurrency(summary.cashCollected)} ₫`}
            helper={`Tỷ lệ thu tiền đạt ${collectionRate}% doanh số`}
            icon={BanknoteArrowDown}
            tone="emerald"
            progress={collectionRate}
          />
          <MetricCard
            label="Công nợ phải thu"
            value={`${compactCurrency(summary.outstandingAr)} ₫`}
            helper={`${alerts.overdueCustomers.length} hóa đơn đang quá hạn`}
            icon={Clock3}
            tone="amber"
          />
          <MetricCard
            label="Tỷ lệ hàng trả"
            value={`${summary.returnRate}%`}
            helper="Giá trị hàng trả trên doanh số trong kỳ"
            icon={BadgePercent}
            tone="rose"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <ChartPanel
            title="Doanh thu và dòng tiền"
            subtitle="So sánh giá trị xuất hóa đơn với tiền thực thu"
            className="xl:col-span-8"
            action={<LegendPills />}
          >
            <ResponsiveContainer width="100%" height={330}>
              <ComposedChart data={charts.revenueVsCollection} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.27} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e8edf5" strokeDasharray="4 6" />
                <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={10} />
                <YAxis tickFormatter={compactCurrency} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} width={52} />
                <Tooltip content={<ChartTooltip currency />} />
                <Area type="monotone" dataKey="revenue" name="Doanh số" stroke="#f97316" strokeWidth={3} fill="url(#salesRevenueGradient)" activeDot={{ r: 5, stroke: "#fff", strokeWidth: 3 }} />
                <Bar dataKey="collected" name="Thực thu" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={14} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel
            title="Hiệu suất thu tiền"
            subtitle="Tỷ lệ thực thu trên doanh số trong kỳ"
            className="xl:col-span-4"
          >
            <div className="relative">
              <ResponsiveContainer width="100%" height={235}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Đã thu", value: Math.min(collectionRate, 100) },
                      { name: "Chưa thu", value: Math.max(100 - collectionRate, 0) },
                    ]}
                    dataKey="value"
                    innerRadius={75}
                    outerRadius={96}
                    startAngle={210}
                    endAngle={-30}
                    cornerRadius={8}
                    paddingAngle={2}
                    stroke="transparent"
                  >
                    <Cell fill="#f97316" />
                    <Cell fill="#e8edf5" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-x-0 top-[86px] text-center">
                <p className="text-4xl font-semibold tracking-[-0.06em] text-slate-950">
                  {collectionRate}%
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  đã thu
                </p>
              </div>
            </div>
            <div className="-mt-2 grid grid-cols-2 gap-3">
              <MiniStat label="Thực thu" value={`${compactCurrency(summary.cashCollected)} ₫`} tone="text-orange-600" />
              <MiniStat label="Doanh số" value={`${compactCurrency(summary.netSales)} ₫`} tone="text-slate-700" />
            </div>
          </ChartPanel>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <ChartPanel
            title="Cấu trúc tuổi nợ"
            subtitle="Phân bổ công nợ theo thời gian quá hạn"
            className="xl:col-span-5"
          >
            <div className="grid items-center gap-3 sm:grid-cols-[210px_1fr] xl:grid-cols-1 2xl:grid-cols-[220px_1fr]">
              <div className="relative">
                <ResponsiveContainer width="100%" height={215}>
                  <PieChart>
                    <Pie data={charts.arAging} dataKey="amount" nameKey="range" innerRadius={61} outerRadius={87} paddingAngle={4} cornerRadius={5} stroke="transparent">
                      {charts.arAging.map((item, index) => (
                        <Cell key={item.range} fill={AGING_COLORS[index % AGING_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip currency />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-x-0 top-[77px] text-center">
                  <p className="text-xl font-semibold text-slate-950">{compactCurrency(totalAging)} ₫</p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Tổng dư nợ</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {charts.arAging.map((item, index) => (
                  <div key={item.range} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                    <i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: AGING_COLORS[index % AGING_COLORS.length] }} />
                    <span className="text-xs text-slate-500">{item.range}</span>
                    <strong className="ml-auto text-xs font-semibold text-slate-800">{compactCurrency(item.amount)} ₫</strong>
                  </div>
                ))}
              </div>
            </div>
          </ChartPanel>

          <ChartPanel
            title="Cảnh báo công nợ"
            subtitle={`${fullCurrency(overdueValue)} đang cần thu hồi`}
            className="xl:col-span-7"
            action={<ShieldAlert className="h-4 w-4 text-rose-500" />}
          >
            <div className="divide-y divide-slate-100">
              {alerts.overdueCustomers.length ? alerts.overdueCustomers.slice(0, 5).map((item) => (
                <div key={item.invoiceId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{item.customerName}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{item.invoiceNo} · quá hạn {item.days} ngày</p>
                  </div>
                  <strong className="ml-auto shrink-0 text-sm font-semibold text-rose-600">{compactCurrency(item.amount)} ₫</strong>
                </div>
              )) : <EmptyState icon={PackageCheck} text="Không có hóa đơn quá hạn" />}
            </div>
          </ChartPanel>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_45px_-30px_rgba(15,23,42,0.5)] print:hidden">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Tồn kho cần chú ý</h2>
              <p className="mt-1 text-xs text-slate-500">Sản phẩm dưới ngưỡng tồn kho an toàn</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-semibold text-amber-700">
              <Boxes className="h-3.5 w-3.5" />
              {alerts.lowStockItems.length} cảnh báo
            </div>
          </header>
          {alerts.lowStockItems.length ? (
            <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
              {alerts.lowStockItems.slice(0, 4).map((item) => (
                <div key={`${item.productId}-${item.sku}`} className="group p-5 transition hover:bg-amber-50/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-400">SKU: {item.sku || "—"}</p>
                    </div>
                    <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                      {item.stock}
                    </span>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(Math.max(item.stock / item.minStockQty, 0), 1) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-wide text-slate-400">
                    Ngưỡng đã cấu hình: {item.minStockQty.toLocaleString("vi-VN")}
                  </p>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={PackageCheck} text="Tồn kho đang ở mức an toàn" />}
        </section>
      </div>
    </main>
  );
}

function LegendPills() {
  return (
    <div className="hidden items-center gap-3 sm:flex">
      <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
        <i className="h-2 w-2 rounded-full bg-orange-500" /> Doanh số
      </span>
      <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
        <i className="h-2 w-2 rounded-full bg-amber-500" /> Thực thu
      </span>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: typeof TrendingUp;
  text: string;
}) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 p-6 text-slate-400">
      <Icon className="h-6 w-6" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
