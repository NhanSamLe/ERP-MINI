import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  Target,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import axiosClient from "../../../api/axiosClient";
import {
  ChartPanel,
  ChartTooltip,
  DashboardHeader,
  DashboardLoading,
  MetricCard,
  type DashboardBranch,
  type DashboardPeriod,
} from "../../../components/dashboard/ExecutiveDashboard";
import type { RootState } from "../../../store/store";
import { fetchDashboard } from "../service/activity.service";

interface TrendPoint {
  date: string;
  count?: number;
  total?: number;
}

interface PipelineItem {
  stage: string;
  count: number;
}

interface LeadSourceItem {
  [key: string]: string | number | null;
  sourceId: number | null;
  sourceName: string;
  count: number;
}

interface RankingItem {
  salespersonId: number;
  salespersonName: string;
  revenue: number;
  wonDeals: number;
}

interface BranchRankingItem {
  branchId: number;
  branchName: string;
  revenue: number;
}

interface RecentLead {
  id: number;
  name: string;
  source?: string;
  score_grade?: string;
  stage: string;
}

interface RecentOpportunity {
  id: number;
  name: string;
  expected_value: number | string;
  stage: string;
}

interface RecentActivity {
  id: number;
  subject?: string;
  activity_type: string;
  status: string;
  created_at: string;
}

interface CrmDashboardData {
  startDate: string;
  endDate: string;
  summary: {
    totalLeads: number;
    contactedLeads: number;
    newLeadsInPeriod: number;
    qualifiedLeads: number;
    totalOpp: number;
    wonOppInPeriod: number;
    lostOppInPeriod: number;
    winRateInPeriod: number;
    totalRevenueInPeriod: number;
    activitiesInPeriod: {
      totalActivitiesInPeriod: number;
      callsInPeriod: number;
      emailsInPeriod: number;
      meetingsInPeriod: number;
      tasksInPeriod: number;
    };
  };
  pipeline: PipelineItem[];
  charts: {
    activity7d: TrendPoint[];
    leads7d: TrendPoint[];
    revenue30d: TrendPoint[];
  };
  leaderboard: RankingItem[];
  leadSources: LeadSourceItem[];
  branchComparison: BranchRankingItem[];
  recent: {
    leads: RecentLead[];
    opportunities: RecentOpportunity[];
    activities: RecentActivity[];
  };
}

const SOURCE_COLORS = ["#f97316", "#f59e0b", "#fb923c", "#10b981", "#f43f5e", "#84cc16"];
const STAGE_LABELS: Record<string, string> = {
  prospecting: "Tiếp cận",
  negotiation: "Đàm phán",
  won: "Thắng",
  lost: "Thất bại",
};
const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  call: "Cuộc gọi",
  email: "Email",
  meeting: "Cuộc họp",
  task: "Công việc",
};
const STAGE_STYLES: Record<string, string> = {
  prospecting: "border-blue-200 bg-blue-50 text-blue-700",
  negotiation: "border-amber-200 bg-amber-50 text-amber-700",
  won: "border-emerald-200 bg-emerald-50 text-emerald-700",
  lost: "border-rose-200 bg-rose-50 text-rose-700",
};

const compactCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(value));

export default function CRMDashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = user?.role?.code || "SALES";
  const [period, setPeriod] = useState<DashboardPeriod>("last_30_days");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<DashboardBranch[]>([]);
  const [data, setData] = useState<CrmDashboardData | null>(null);
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
    fetchDashboard(params)
      .then((response) => setData(response as unknown as CrmDashboardData))
      .catch((error) => {
        console.error(error);
        toast.error("Không thể tải dữ liệu CRM Dashboard");
      })
      .finally(() => setLoading(false));
  }, [period, dateFrom, dateTo, branchId]);

  const handleExport = () => {
    if (!data) return;
    const rows = [
      ["Chỉ số", "Giá trị"],
      ["Tổng lead", data.summary.totalLeads],
      ["Lead mới trong kỳ", data.summary.newLeadsInPeriod],
      ["Tổng cơ hội", data.summary.totalOpp],
      ["Cơ hội thắng", data.summary.wonOppInPeriod],
      ["Tỷ lệ thắng", `${data.summary.winRateInPeriod}%`],
      ["Doanh thu chốt thắng", data.summary.totalRevenueInPeriod],
    ];
    const csv = `\uFEFF${rows.map((row) => row.join(",")).join("\n")}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `CRM_Dashboard_${period}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Đã xuất báo cáo CRM");
  };

  if (loading || !data) {
    return <DashboardLoading label="Đang tổng hợp dữ liệu CRM..." />;
  }

  const { summary, charts, pipeline, leadSources, leaderboard, branchComparison, recent } = data;
  const contactRate = summary.totalLeads
    ? Math.round((summary.contactedLeads / summary.totalLeads) * 100)
    : 0;
  const rankingData = userRole === "CEO" || userRole === "ADMIN"
    ? branchComparison.map((item) => ({ name: item.branchName, revenue: item.revenue }))
    : leaderboard.map((item) => ({ name: item.salespersonName, revenue: item.revenue }));
  const totalLeadSources = leadSources.reduce((sum, item) => sum + item.count, 0);

  return (
    <main className="min-h-screen bg-[#f6f8fc] p-4 text-slate-800 sm:p-6 lg:p-7 print:bg-white print:p-0">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <DashboardHeader
          eyebrow="CRM intelligence"
          title="Toàn cảnh quan hệ khách hàng"
          description="Theo dõi chất lượng lead, sức khỏe pipeline và hiệu suất chốt deal trong một góc nhìn điều hành."
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
              label: "Lead mới trong kỳ",
              value: summary.newLeadsInPeriod.toLocaleString("vi-VN"),
              helper: `${summary.totalLeads.toLocaleString("vi-VN")} lead đang quản lý`,
            },
            {
              label: "Tỷ lệ đã liên hệ",
              value: `${contactRate}%`,
              helper: `${summary.contactedLeads.toLocaleString("vi-VN")} lead đã được chăm sóc`,
            },
            {
              label: "Lead đủ tiêu chuẩn",
              value: summary.qualifiedLeads.toLocaleString("vi-VN"),
              helper: `${summary.activitiesInPeriod.totalActivitiesInPeriod} tương tác trong kỳ`,
            },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Tổng lead"
            value={summary.totalLeads.toLocaleString("vi-VN")}
            helper={`${summary.newLeadsInPeriod} lead mới trong kỳ · ${contactRate}% đã liên hệ`}
            icon={Users}
            tone="orange"
            progress={contactRate}
          />
          <MetricCard
            label="Cơ hội kinh doanh"
            value={summary.totalOpp.toLocaleString("vi-VN")}
            helper={`${summary.wonOppInPeriod} thắng · ${summary.lostOppInPeriod} thất bại trong kỳ`}
            icon={BriefcaseBusiness}
            tone="amber"
          />
          <MetricCard
            label="Tỷ lệ chốt thắng"
            value={`${summary.winRateInPeriod}%`}
            helper="Tỷ lệ trên tổng cơ hội đã có kết quả"
            icon={Target}
            tone="emerald"
            progress={summary.winRateInPeriod}
          />
          <MetricCard
            label="Doanh thu chốt thắng"
            value={`${compactCurrency(summary.totalRevenueInPeriod)} ₫`}
            helper={`${summary.activitiesInPeriod.totalActivitiesInPeriod} tương tác chăm sóc trong kỳ`}
            icon={CircleDollarSign}
            tone="orange"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <ChartPanel
            title="Động lực tăng trưởng"
            subtitle="Lead mới và cường độ chăm sóc theo thời gian"
            className="xl:col-span-8"
            action={<InsightBadge text={`${summary.activitiesInPeriod.totalActivitiesInPeriod} tương tác`} />}
          >
            <ResponsiveContainer width="100%" height={310}>
              <AreaChart data={charts.leads7d.map((item, index) => ({
                ...item,
                activities: charts.activity7d[index]?.count || 0,
              }))}>
                <defs>
                  <linearGradient id="crmLeadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="crmActivityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e8edf5" strokeDasharray="4 6" />
                <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} width={32} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="count" name="Lead mới" stroke="#f97316" strokeWidth={3} fill="url(#crmLeadGradient)" activeDot={{ r: 5, strokeWidth: 3, stroke: "#fff" }} />
                <Area type="monotone" dataKey="activities" name="Tương tác" stroke="#f59e0b" strokeWidth={2.5} fill="url(#crmActivityGradient)" activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel
            title="Cơ cấu nguồn lead"
            subtitle="Mức đóng góp theo kênh thu hút"
            className="xl:col-span-4"
          >
            {leadSources.length ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={leadSources} dataKey="count" nameKey="sourceName" innerRadius={68} outerRadius={91} paddingAngle={4} cornerRadius={5}>
                      {leadSources.map((item, index) => (
                        <Cell key={`${item.sourceId}-${item.sourceName}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-x-0 top-[82px] text-center">
                  <p className="text-2xl font-semibold text-slate-950">{totalLeadSources}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Lead trong kỳ</p>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {leadSources.slice(0, 6).map((item, index) => (
                    <div key={item.sourceName} className="flex min-w-0 items-center gap-2 text-xs">
                      <i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }} />
                      <span className="truncate text-slate-500">{item.sourceName}</span>
                      <strong className="ml-auto text-slate-800">{item.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : <EmptyState text="Chưa có dữ liệu nguồn lead" />}
          </ChartPanel>
        </div>

        <div className="bg-slate-900/[0.01] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.03] dark:ring-white/[0.05] p-2 rounded-[2rem]">
          <section className="overflow-hidden rounded-[calc(2rem-0.5rem)] border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 px-5 py-4">
              <div className="text-left">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Sức khỏe pipeline</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Phân bổ cơ hội theo từng giai đoạn bán hàng</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800 lg:grid-cols-4">
              {pipeline.map((item) => {
                const total = pipeline.reduce((sum, stage) => sum + stage.count, 0);
                const share = total ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.stage} className="bg-white dark:bg-slate-900 p-5 transition duration-300 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STAGE_STYLES[item.stage] || "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-350"}`}>
                        {STAGE_LABELS[item.stage] || item.stage}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{share}%</span>
                    </div>
                    <p className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{item.count}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">cơ hội đang ghi nhận</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <ChartPanel
            title="Doanh thu chốt thắng"
            subtitle="Giá trị deal won theo thời gian"
            className="xl:col-span-7"
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={charts.revenue30d}>
                <defs>
                  <linearGradient id="crmRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e8edf5" strokeDasharray="4 6" />
                <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={10} />
                <YAxis tickFormatter={compactCurrency} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} width={48} />
                <Tooltip content={<ChartTooltip currency />} />
                <Area type="monotone" dataKey="total" name="Doanh thu" stroke="#f97316" strokeWidth={3} fill="url(#crmRevenueGradient)" activeDot={{ r: 5, stroke: "#fff", strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel
            title={userRole === "CEO" || userRole === "ADMIN" ? "Hiệu suất chi nhánh" : "Bảng xếp hạng bán hàng"}
            subtitle="Xếp hạng theo doanh thu chốt thắng"
            className="xl:col-span-5"
          >
            {rankingData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={rankingData.slice(0, 6)} layout="vertical" margin={{ left: 8, right: 10 }}>
                  <CartesianGrid horizontal={false} stroke="#e8edf5" strokeDasharray="4 6" />
                  <XAxis type="number" tickFormatter={compactCurrency} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={95} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip currency />} />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#f97316" radius={[0, 7, 7, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState text="Chưa có dữ liệu xếp hạng" />}
          </ChartPanel>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 print:hidden">
          <RecentPanel
            title="Lead mới cập nhật"
            icon={<Users className="h-4 w-4 text-orange-500" />}
            rows={recent.leads.slice(0, 5).map((lead) => ({
              id: lead.id,
              title: lead.name,
              subtitle: `${lead.source || "Nguồn trực tiếp"} · ${lead.score_grade || "Chưa phân hạng"}`,
              badge: STAGE_LABELS[lead.stage] || lead.stage,
            }))}
          />
          <RecentPanel
            title={userRole === "SALES" ? "Hoạt động gần đây" : "Cơ hội mới nhất"}
            icon={userRole === "SALES" ? <Clock3 className="h-4 w-4 text-amber-500" /> : <Activity className="h-4 w-4 text-emerald-500" />}
            rows={userRole === "SALES"
              ? recent.activities.slice(0, 5).map((item) => ({
                  id: item.id,
                  title: item.subject || "Hoạt động chưa đặt tên",
                  subtitle: `${ACTIVITY_TYPE_LABELS[item.activity_type] || "Hoạt động"} · ${new Date(item.created_at).toLocaleDateString("vi-VN")}`,
                  badge: item.status,
                }))
              : recent.opportunities.slice(0, 5).map((item) => ({
                  id: item.id,
                  title: item.name,
                  subtitle: `${Number(item.expected_value).toLocaleString("vi-VN")} ₫`,
                  badge: STAGE_LABELS[item.stage] || item.stage,
                }))}
          />
        </div>
      </div>
    </main>
  );
}

function InsightBadge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-600">
      {text}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">{text}</div>;
}

function RecentPanel({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  rows: Array<{ id: number; title: string; subtitle: string; badge: string }>;
}) {
  return (
    <div className="bg-slate-900/[0.01] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.03] dark:ring-white/[0.05] p-2 rounded-[2rem] w-full text-left">
      <section className="overflow-hidden rounded-[calc(2rem-0.5rem)] border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
        <header className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 px-5 py-4 text-left">
          {icon}
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
        </header>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-left">
          {rows.length ? rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{row.title}</p>
                <p className="mt-1 truncate text-xs text-slate-450 dark:text-slate-400">{row.subtitle}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                {row.badge}
              </span>
            </div>
          )) : <p className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">Chưa có dữ liệu gần đây</p>}
        </div>
      </section>
    </div>
  );
}
