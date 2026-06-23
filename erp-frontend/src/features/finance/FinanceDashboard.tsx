import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { glEntryApi } from "./api/glEntry.api";
import { financeConfigApi, FiscalPeriodDTO } from "./api/finance.api";
import { formatMoney } from "@/utils/currency.helper";
import { toast } from "react-toastify";
import {
  DollarSign,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Calendar,
  Lock,
  Unlock,
  RefreshCw,
  BookOpen,
  Settings,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

interface TrialBalanceRow {
  id: number;
  code: string;
  name: string;
  type: string;
  normal_side: "debit" | "credit";
  openingBalance: number;
  periodDebit: number;
  periodCredit: number;
  closingBalance: number;
}

interface GlEntryDTO {
  id: number;
  journal_id: number;
  entry_no: string;
  entry_date: string;
  memo?: string;
  status: "draft" | "posted";
}

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

export default function FinanceDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([]);
  const [recentEntries, setRecentEntries] = useState<GlEntryDTO[]>([]);
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriodDTO[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const d = new Date();
      // Current month range
      const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 10);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().substring(0, 10);

      const [tbRes, entriesRes, periodRes] = await Promise.all([
        glEntryApi.getTrialBalance({ from, to }),
        glEntryApi.listByJournal(1, { limit: 5 }), // Fetch top 5 GL entries
        financeConfigApi.getFiscalPeriods(),
      ]);

      setTrialBalance(tbRes.data?.data || tbRes.data || []);
      setRecentEntries(entriesRes.data || []);
      setFiscalPeriods(periodRes.data || []);
    } catch (e: any) {
      console.error(e);
      toast.error("Lỗi khi tải dữ liệu báo cáo tài chính");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metric cards from trial balance
  const cashBalance = trialBalance
    .filter((acc) => acc.code.startsWith("111") || acc.code.startsWith("112"))
    .reduce((sum, acc) => sum + Number(acc.closingBalance || 0), 0);

  const arBalance = trialBalance
    .filter((acc) => acc.code.startsWith("131"))
    .reduce((sum, acc) => sum + Number(acc.closingBalance || 0), 0);

  const apBalance = trialBalance
    .filter((acc) => acc.code.startsWith("331"))
    .reduce((sum, acc) => sum + Number(acc.closingBalance || 0), 0);

  const revenue = trialBalance
    .filter((acc) => acc.code.startsWith("511") || acc.code.startsWith("5"))
    .reduce((sum, acc) => {
      // Nominal accounts: closing balance or credits
      const balance = Number(acc.periodCredit || 0) - Number(acc.periodDebit || 0);
      return sum + balance;
    }, 0);

  const expenses = trialBalance
    .filter((acc) => acc.code.startsWith("6") || acc.code.startsWith("8"))
    .reduce((sum, acc) => {
      const balance = Number(acc.periodDebit || 0) - Number(acc.periodCredit || 0);
      return sum + balance;
    }, 0);

  // Recharts chart data (mock history for Jan-May and actual data for current month)
  const chartData = [
    { name: "Tháng 1", "Doanh thu": 185000000, "Chi phí": 124000000, "Lợi nhuận ròng": 61000000 },
    { name: "Tháng 2", "Doanh thu": 210000000, "Chi phí": 145000000, "Lợi nhuận ròng": 65000000 },
    { name: "Tháng 3", "Doanh thu": 195000000, "Chi phí": 138000000, "Lợi nhuận ròng": 57000000 },
    { name: "Tháng 4", "Doanh thu": 240000000, "Chi phí": 172000000, "Lợi nhuận ròng": 68000000 },
    { name: "Tháng 5", "Doanh thu": 285000000, "Chi phí": 198000000, "Lợi nhuận ròng": 87000000 },
    {
      name: "Tháng 6",
      "Doanh thu": revenue,
      "Chi phí": expenses,
      "Lợi nhuận ròng": revenue - expenses,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/40 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Trung tâm kiểm soát tài chính (Financial Control)
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1.5">
            Báo cáo sức khỏe tài chính, dòng tiền và kiểm soát kỳ kế toán trực quan
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
          label="Tài sản bằng tiền (Cash & Bank)"
          value={formatMoney(cashBalance)}
          icon={<DollarSign className="w-5 h-5" />}
          gradientClass="from-emerald-500 to-emerald-600"
          iconBgClass="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-100"
          onClick={() => navigate("/finance/accounts")}
        />
        <StatCard
          label="Phải thu khách hàng (AR)"
          value={formatMoney(arBalance)}
          icon={<ArrowUpRight className="w-5 h-5" />}
          gradientClass="from-indigo-500 to-indigo-600"
          iconBgClass="bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-100"
          onClick={() => navigate("/finance/reports")}
        />
        <StatCard
          label="Phải trả nhà cung cấp (AP)"
          value={formatMoney(apBalance)}
          icon={<ArrowDownRight className="w-5 h-5" />}
          gradientClass="from-rose-500 to-rose-600"
          iconBgClass="bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-100"
          onClick={() => navigate("/finance/reports")}
        />
        <StatCard
          label="Doanh thu thuần (Tháng này)"
          value={formatMoney(revenue)}
          icon={<TrendingUp className="w-5 h-5" />}
          gradientClass="from-amber-500 to-amber-600"
          iconBgClass="bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-100"
          onClick={() => navigate("/finance/reports")}
        />
      </div>

      {/* Chart + Period Locking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts chart */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">
                Hiệu quả kinh doanh (Doanh thu vs Chi phí)
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                So sánh tổng doanh thu phát sinh và chi phí trong kỳ hiện tại
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="h-48 flex items-center justify-center text-gray-400 italic text-sm">
                Đang tính toán dữ liệu tài chính...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 20, right: 8, left: 8, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => formatMoney(v)} tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.96)",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    }}
                    formatter={(v: number) => [formatMoney(v), ""]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Doanh thu" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" />
                  <Area type="monotone" dataKey="Chi phí" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
                  <Area type="monotone" dataKey="Lợi nhuận ròng" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#profitGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Right side: Period lock status & shortcuts */}
        <div className="flex flex-col gap-6">
          {/* Lock status widget */}
          <Card className="border-gray-100 shadow-sm bg-white/80 backdrop-blur-md overflow-hidden flex flex-col flex-1">
            <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/20">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <CardTitle className="text-base font-semibold text-gray-800">
                  Trạng thái kỳ kế toán
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                Xem tình trạng mở khóa để chốt sổ định kỳ
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 flex-1 space-y-4">
              {fiscalPeriods.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Chưa cấu hình kỳ kế toán nào</p>
              ) : (
                <div className="space-y-3">
                  {fiscalPeriods.slice(0, 3).map((period) => (
                    <div
                      key={period.id}
                      className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 border border-slate-100/50"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{period.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {period.start_date} - {period.end_date}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${
                          period.status === "open"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {period.status === "open" ? (
                          <>
                            <Unlock className="w-3 h-3" /> Mở
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> Đóng
                          </>
                        )}
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
                Phím tắt Tài chính
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <button
                onClick={() => navigate("/finance/journals")}
                className="w-full flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Nhập bút toán thủ công (JV)</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => navigate("/finance/reports")}
                className="w-full flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Chạy bút toán kết chuyển / Báo cáo</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => navigate("/finance/mappings")}
                className="w-full flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Thiết lập định khoản tự động</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent JVs list */}
      <Card className="border-gray-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
        <CardHeader className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
          <div>
            <CardTitle className="text-base font-semibold text-gray-800">
              Bút toán Nhật ký chung gần đây
            </CardTitle>
            <CardDescription className="text-xs text-gray-400 mt-0.5">
              Danh sách các chứng từ kế toán vừa cập nhật trên Sổ cái Nhật ký chung
            </CardDescription>
          </div>
          <button
            onClick={() => navigate("/finance/journals/1/entries")}
            className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition"
          >
            Xem toàn bộ sổ cái <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Số chứng từ</th>
                  <th className="px-6 py-3 text-left">Ngày hạch toán</th>
                  <th className="px-6 py-3 text-left">Diễn giải</th>
                  <th className="px-6 py-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-400 italic text-xs"
                    >
                      Không có bút toán nào trong kỳ kế toán hiện tại
                    </td>
                  </tr>
                ) : (
                  recentEntries.slice(0, 5).map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/finance/entries/${entry.id}`)}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {entry.entry_no}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        {new Date(entry.entry_date).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-sm truncate">
                        {entry.memo || "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            entry.status === "posted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {entry.status === "posted" ? "Đã ghi sổ" : "Nháp"}
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
  );
}
