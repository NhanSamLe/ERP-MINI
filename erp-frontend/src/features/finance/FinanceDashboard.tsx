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
  Calendar,
  Lock,
  Unlock,
  RefreshCw,
  ChevronRight,
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
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/common";

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
      const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 10);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().substring(0, 10);

      const [tbRes, entriesRes, periodRes] = await Promise.all([
        glEntryApi.getTrialBalance({ from, to }),
        glEntryApi.listByJournal(1, { limit: 5 }),
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
      const balance = Number(acc.periodCredit || 0) - Number(acc.periodDebit || 0);
      return sum + balance;
    }, 0);

  const expenses = trialBalance
    .filter((acc) => acc.code.startsWith("6") || acc.code.startsWith("8"))
    .reduce((sum, acc) => {
      const balance = Number(acc.periodDebit || 0) - Number(acc.periodCredit || 0);
      return sum + balance;
    }, 0);

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border border-gray-255/10 rounded-lg p-3 shadow-lg text-xs border-gray-200">
          <p className="font-semibold text-gray-900 border-b border-gray-100 pb-1 mb-1.5">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }} />
                  {entry.name}:
                </span>
                <span className="font-semibold text-gray-900">{formatMoney(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container">
      {/* Standard ERP Page Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </span>
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              Trung tâm kiểm soát tài chính (Financial Control)
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Báo cáo sức khỏe tài chính, dòng tiền và kiểm soát kỳ kế toán trực quan
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
          label="Tài sản bằng tiền (Cash & Bank)"
          value={formatMoney(cashBalance)}
          icon={<DollarSign className="w-4 h-4" />}
          gradientClass="from-emerald-500 to-emerald-600"
          iconBgClass="bg-emerald-500 shadow-sm"
          onClick={() => navigate("/finance/accounts")}
          delay={0}
        />
        <StatCard
          label="Phải thu khách hàng (AR)"
          value={formatMoney(arBalance)}
          icon={<ArrowUpRight className="w-4 h-4" />}
          gradientClass="from-indigo-500 to-indigo-600"
          iconBgClass="bg-indigo-500 shadow-sm"
          onClick={() => navigate("/finance/reports")}
          delay={75}
        />
        <StatCard
          label="Phải trả nhà cung cấp (AP)"
          value={formatMoney(apBalance)}
          icon={<ArrowDownRight className="w-4 h-4" />}
          gradientClass="from-rose-500 to-rose-600"
          iconBgClass="bg-rose-500 shadow-sm"
          onClick={() => navigate("/finance/reports")}
          delay={150}
        />
        <StatCard
          label="Doanh thu thuần (Tháng này)"
          value={formatMoney(revenue)}
          icon={<TrendingUp className="w-4 h-4" />}
          gradientClass="from-amber-500 to-amber-600"
          iconBgClass="bg-amber-500 shadow-sm"
          onClick={() => navigate("/finance/reports")}
          delay={225}
        />
      </div>

      {/* Chart + Period Locking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recharts chart */}
        <Card 
          className="lg:col-span-2 border-gray-200 shadow-sm overflow-hidden bg-white flex flex-col opacity-0 animate-fade-in-up"
          style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
        >
          <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/40">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-800">
                Hiệu quả kinh doanh (Doanh thu vs Chi phí)
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                So sánh tổng doanh thu phát sinh và chi phí trong kỳ hiện tại
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="h-48 flex items-center justify-center text-gray-400 italic text-xs">
                Đang tính toán dữ liệu tài chính...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 8, left: 8, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => formatMoney(v)} tickLine={false} axisLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Doanh thu" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#revenueGrad)" isAnimationActive={true} animationDuration={1000} />
                  <Area type="monotone" dataKey="Chi phí" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#expenseGrad)" isAnimationActive={true} animationDuration={1000} />
                  <Area type="monotone" dataKey="Lợi nhuận ròng" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" isAnimationActive={true} animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Right side: Period lock status & shortcuts */}
        <div className="flex flex-col gap-5">
          {/* Lock status widget */}
          <Card 
            className="border-gray-200 shadow-sm bg-white overflow-hidden flex flex-col flex-1 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "225ms", animationFillMode: "forwards" }}
          >
            <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/40">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <CardTitle className="text-sm font-semibold text-gray-800">
                  Trạng thái kỳ kế toán
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-400 mt-0.5">
                Xem tình trạng mở khóa để chốt sổ định kỳ
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex-1 space-y-3">
              {fiscalPeriods.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Chưa cấu hình kỳ kế toán nào</p>
              ) : (
                <div className="space-y-2">
                  {fiscalPeriods.slice(0, 3).map((period) => (
                    <div
                      key={period.id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        {period.status === "open" ? (
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-gray-300 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{period.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {period.start_date} - {period.end_date}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border text-[10px] ${
                          period.status === "open"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {period.status === "open" ? (
                          <>
                            <Unlock className="w-2.5 h-2.5" /> Mở
                          </>
                        ) : (
                          <>
                            <Lock className="w-2.5 h-2.5" /> Đóng
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
          <Card 
            className="border-gray-200 shadow-sm bg-white overflow-hidden opacity-0 animate-fade-in-up"
            style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
          >
            <CardHeader className="pb-2.5 border-b border-gray-100 bg-gray-50/40">
              <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Phím tắt Tài chính
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1.5">
              <button
                onClick={() => navigate("/finance/journals")}
                className="group w-full flex items-center justify-between text-xs p-2.5 rounded-md bg-slate-50 hover:bg-orange-50/50 hover:border-orange-200 transition-all border border-slate-100 text-left font-medium text-slate-700"
              >
                <span>Nhập bút toán thủ công (JV)</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/finance/reports")}
                className="group w-full flex items-center justify-between text-xs p-2.5 rounded-md bg-slate-50 hover:bg-orange-50/50 hover:border-orange-200 transition-all border border-slate-100 text-left font-medium text-slate-700"
              >
                <span>Chạy bút toán kết chuyển / Báo cáo</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/finance/mappings")}
                className="group w-full flex items-center justify-between text-xs p-2.5 rounded-md bg-slate-50 hover:bg-orange-50/50 hover:border-orange-200 transition-all border border-slate-100 text-left font-medium text-slate-700"
              >
                <span>Thiết lập định khoản tự động</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent JVs list */}
      <Card 
        className="border-gray-200 shadow-sm overflow-hidden bg-white opacity-0 animate-fade-in-up"
        style={{ animationDelay: "375ms", animationFillMode: "forwards" }}
      >
        <CardHeader className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-800">
              Bút toán Nhật ký chung gần đây
            </CardTitle>
            <CardDescription className="text-xs text-gray-400 mt-0.5">
              Danh sách các chứng từ kế toán vừa cập nhật trên Sổ cái Nhật ký chung
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => navigate("/finance/journals/1/entries")}
            rightIcon={<ChevronRight className="w-3 h-3" />}
          >
            Xem toàn bộ sổ cái
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5 text-left">Số chứng từ</th>
                  <th className="px-4 py-2.5 text-left">Ngày hạch toán</th>
                  <th className="px-4 py-2.5 text-left">Diễn giải</th>
                  <th className="px-4 py-2.5 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-gray-400 italic text-xs"
                    >
                      Không có bút toán nào trong kỳ kế toán hiện tại
                    </td>
                  </tr>
                ) : (
                  recentEntries.slice(0, 5).map((entry) => (
                    <tr
                      key={entry.id}
                      className="table-row-hover cursor-pointer"
                      onClick={() => navigate(`/finance/entries/${entry.id}`)}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900 text-xs">
                        {entry.entry_no}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                        {new Date(entry.entry_date).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-sm truncate">
                        {entry.memo || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={entry.status} />
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
