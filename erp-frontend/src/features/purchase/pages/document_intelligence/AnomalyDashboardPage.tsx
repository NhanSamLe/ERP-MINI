// AnomalyDashboardPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  AlertTriangle,
  BarChart2,
  Settings,
  Inbox,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Save,
} from "lucide-react";
import { documentIntelligenceApi } from "../../api/documentIntelligence.api";
import {
  AnomalyListItem,
  AnomalyQueryFilters,
  AnomalyPaginatedResult,
  BranchAnomalyStats,
  AnomalyThresholdConfig,
  RiskLevel,
  AnomalyFlagType,
} from "../../store/documentIntelligence/documentIntelligence.types";
import { Button } from "@/components/ui/Button";
import { toast } from "react-toastify";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFlagType(type: AnomalyFlagType): string {
  const map: Record<AnomalyFlagType, string> = {
    price_outlier_zscore: "Price Outlier (Z-Score)",
    price_outlier_iqr: "Price Outlier (IQR)",
    quantity_outlier_zscore: "Quantity Outlier (Z-Score)",
    quantity_outlier_5x: "Quantity Outlier (5×)",
    invalid_quantity: "Invalid Quantity",
    subtotal_mismatch: "Subtotal Mismatch",
    total_mismatch: "Total Mismatch",
    line_amount_mismatch: "Line Amount Mismatch",
    approval_threshold_proximity: "Near Approval Threshold",
    high_frequency_invoicing: "High Frequency Invoicing",
    round_number_no_detail: "Round Number, No Detail",
    rejected_pattern_match: "Rejected Pattern Match",
    period_end_spike: "Period-End Spike",
    new_vendor: "New Vendor",
    dormant_vendor_reactivation: "Dormant Vendor",
    weekend_high_value: "Weekend High Value",
    future_dated_invoice: "Future-Dated Invoice",
    stale_invoice: "Stale Invoice",
    vendor_tax_code_change: "Tax Code Change",
    multivariate_outlier: "Multivariate Outlier",
    insufficient_data: "Insufficient Data",
  };
  return map[type] ?? type;
}

function RiskLevelBadge({ level }: { level: RiskLevel }) {
  const config: Record<RiskLevel, { bg: string; text: string; label: string }> =
    {
      high_risk: { bg: "bg-red-50", text: "text-red-700", label: "High Risk" },
      medium_risk: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        label: "Medium Risk",
      },
      low_risk: {
        bg: "bg-green-50",
        text: "text-green-700",
        label: "Low Risk",
      },
    };
  const c = config[level];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      <span className="text-sm">Loading...</span>
    </div>
  );
}

function EmptyState({ message = "No records found" }: { message?: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
      <Inbox className="w-10 h-10" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ── Tab: High Risk Invoices ───────────────────────────────────────────────────

const PAGE_SIZE = 20;

function HighRiskTab() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AnomalyQueryFilters>({
    risk_level: undefined,
    date_from: "",
    date_to: "",
    page: 1,
    limit: PAGE_SIZE,
  });
  const [pendingFilters, setPendingFilters] = useState<AnomalyQueryFilters>({
    risk_level: undefined,
    date_from: "",
    date_to: "",
  });
  const [data, setData] = useState<AnomalyPaginatedResult | null>(null);
  const [loading, setLoading] = useState(false);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const fetchData = async (f: AnomalyQueryFilters) => {
    setLoading(true);
    try {
      const result = await documentIntelligenceApi.getAnomalyResults(f);
      setData(result);
    } catch {
      toast.error("Failed to load anomaly results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleApply = () => {
    setFilters({ ...pendingFilters, page: 1, limit: PAGE_SIZE });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((f) => ({ ...f, page: newPage }));
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString("en-US");
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-0">
      {/* Filter bar */}
      <div className="px-5 py-3 border-b border-orange-100 bg-orange-50/30">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={pendingFilters.risk_level ?? ""}
            onChange={(e) =>
              setPendingFilters((f) => ({
                ...f,
                risk_level: (e.target.value as RiskLevel) || undefined,
              }))
            }
            className="h-8 pl-3 pr-8 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Risk Levels</option>
            <option value="high_risk">High Risk</option>
            <option value="medium_risk">Medium Risk</option>
            <option value="low_risk">Low Risk</option>
          </select>

          <input
            type="date"
            value={pendingFilters.date_from ?? ""}
            onChange={(e) =>
              setPendingFilters((f) => ({ ...f, date_from: e.target.value }))
            }
            className="h-8 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={pendingFilters.date_to ?? ""}
            onChange={(e) =>
              setPendingFilters((f) => ({ ...f, date_to: e.target.value }))
            }
            className="h-8 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <Button size="sm" variant="primary" onClick={handleApply}>
            Apply
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPendingFilters({
                risk_level: undefined,
                date_from: "",
                date_to: "",
              });
              setFilters({ page: 1, limit: PAGE_SIZE });
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <LoadingSpinner />
        ) : !data || data.data.length === 0 ? (
          <EmptyState message="No anomaly results found" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orange-100 bg-orange-50/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Filename
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Flags
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Math
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Analyzed At
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((item: AnomalyListItem) => (
                <tr
                  key={item.id}
                  className="hover:bg-orange-50/50 transition-colors duration-100"
                >
                  <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate">
                    {item.document?.original_filename ??
                      `Document #${item.document_id}`}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                    {(item.risk_score * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3">
                    <RiskLevelBadge level={item.risk_level} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.flags.length > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        {item.flags.length}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.math_consistent ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(item.analyzed_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() =>
                          navigate(
                            `/purchase/document-intelligence?doc=${item.document_id}`,
                          )
                        }
                        className="p-1.5 rounded text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                        title="View document"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-sm text-gray-600">
          <span>
            Showing{" "}
            <strong>
              {Math.min(((filters.page ?? 1) - 1) * PAGE_SIZE + 1, data.total)}–
              {Math.min((filters.page ?? 1) * PAGE_SIZE, data.total)}
            </strong>{" "}
            / <strong>{data.total}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handlePageChange(Math.max(1, (filters.page ?? 1) - 1))
              }
              disabled={(filters.page ?? 1) === 1}
              className="p-1.5 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded border border-gray-300 bg-white font-medium text-xs">
              {filters.page ?? 1} / {totalPages}
            </span>
            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, (filters.page ?? 1) + 1))
              }
              disabled={(filters.page ?? 1) === totalPages}
              className="p-1.5 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Statistics ───────────────────────────────────────────────────────────

function StatisticsTab() {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [stats, setStats] = useState<BranchAnomalyStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const result = await documentIntelligenceApi.getAnomalyStats(
        dateFrom,
        dateTo,
      );
      setStats(result);
    } catch {
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxFlagCount =
    stats?.topFlagTypes.reduce((m, f) => Math.max(m, f.count), 1) ?? 1;

  return (
    <div className="p-5 space-y-5">
      {/* Date range picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <Button
          size="sm"
          variant="primary"
          onClick={fetchStats}
          loading={loading}
        >
          Load
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : !stats ? (
        <EmptyState message="No statistics available" />
      ) : (
        <>
          {/* Risk level cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="erp-card px-5 py-4 space-y-1 border-l-4 border-l-orange-400">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                High Risk
              </p>
              <p className="text-2xl font-semibold text-red-700">
                {stats.totalByRiskLevel.high_risk ?? 0}
              </p>
              <p className="text-xs text-gray-400">invoices</p>
            </div>
            <div className="erp-card px-5 py-4 space-y-1 border-l-4 border-l-orange-400">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Medium Risk
              </p>
              <p className="text-2xl font-semibold text-amber-700">
                {stats.totalByRiskLevel.medium_risk ?? 0}
              </p>
              <p className="text-xs text-gray-400">invoices</p>
            </div>
            <div className="erp-card px-5 py-4 space-y-1 border-l-4 border-l-orange-400">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Low Risk
              </p>
              <p className="text-2xl font-semibold text-green-700">
                {stats.totalByRiskLevel.low_risk ?? 0}
              </p>
              <p className="text-xs text-gray-400">invoices</p>
            </div>
          </div>

          {/* Top flag types */}
          {stats.topFlagTypes.length > 0 && (
            <div className="erp-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800">
                  Top Flag Types
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-orange-100 bg-orange-50/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Flag Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                      Count
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Distribution
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topFlagTypes.map((f) => (
                    <tr
                      key={f.type}
                      className="hover:bg-orange-50/50 transition-colors duration-100"
                    >
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {formatFlagType(f.type)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800 text-right">
                        {f.count}
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-orange-400 h-2 rounded-full"
                            style={{
                              width: `${(f.count / maxFlagCount) * 100}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Weekly trend */}
          {stats.weeklyTrend.length > 0 && (
            <div className="erp-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800">
                  Weekly Trend
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-orange-100 bg-orange-50/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Week
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Avg Risk Score
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.weeklyTrend.map((w) => (
                    <tr
                      key={w.week}
                      className="hover:bg-orange-50/50 transition-colors duration-100"
                    >
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {w.week}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800 text-right">
                        {(w.avgRiskScore * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">
                        {w.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Tab: Config ───────────────────────────────────────────────────────────────

function ConfigTab() {
  const [config, setConfig] = useState<AnomalyThresholdConfig | null>(null);
  const [form, setForm] = useState<
    Partial<Omit<AnomalyThresholdConfig, "branchId">>
  >({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    documentIntelligenceApi
      .getThresholdConfig()
      .then((cfg) => {
        setConfig(cfg);
        setForm({
          zScoreThreshold: cfg.zScoreThreshold,
          iqrMultiplier: cfg.iqrMultiplier,
          frequencyThresholdPerHour: cfg.frequencyThresholdPerHour,
          approvalThresholdVnd: cfg.approvalThresholdVnd,
          highRiskScoreThreshold: cfg.highRiskScoreThreshold,
          mediumRiskScoreThreshold: cfg.mediumRiskScoreThreshold,
        });
      })
      .catch(() => toast.error("Failed to load threshold config"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await documentIntelligenceApi.updateThresholdConfig(form);
      setConfig(updated);
      toast.success("Threshold configuration saved");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: keyof Omit<AnomalyThresholdConfig, "branchId">,
    label: string,
    hint: string,
    min: number,
    max: number,
    step = 0.1,
  ) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={form[key] ?? ""}
        onChange={(e) =>
          setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) }))
        }
        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
      <p className="text-xs text-gray-500">{hint}</p>
    </div>
  );

  if (loading) return <LoadingSpinner />;
  if (!config) return <EmptyState message="Configuration not available" />;

  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {field(
          "zScoreThreshold",
          "Z-Score Threshold",
          "Values beyond this many standard deviations are flagged (1.0 – 10.0)",
          1.0,
          10.0,
          0.1,
        )}
        {field(
          "iqrMultiplier",
          "IQR Multiplier",
          "Multiplier for IQR-based outlier detection (0.5 – 5.0)",
          0.5,
          5.0,
          0.1,
        )}
        {field(
          "frequencyThresholdPerHour",
          "Frequency Threshold Per Hour",
          "Max invoices per hour before high-frequency flag triggers (1 – 100)",
          1,
          100,
          1,
        )}
        {field(
          "approvalThresholdVnd",
          "Approval Threshold (VND)",
          "Invoices near this amount trigger proximity flag. Set 0 to disable.",
          0,
          1_000_000_000_000,
          1_000_000,
        )}
        {field(
          "highRiskScoreThreshold",
          "High Risk Score Threshold",
          "Score at or above this value is classified as high risk (0.1 – 1.0)",
          0.1,
          1.0,
          0.05,
        )}
        {field(
          "mediumRiskScoreThreshold",
          "Medium Risk Score Threshold",
          "Score at or above this value is classified as medium risk (0.1 – 1.0)",
          0.1,
          1.0,
          0.05,
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          variant="primary"
          size="md"
          loading={saving}
          onClick={handleSave}
          leftIcon={<Save className="w-3.5 h-3.5" />}
        >
          Save Configuration
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "invoices" | "statistics" | "config";

export default function AnomalyDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("invoices");

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    {
      id: "invoices",
      label: "High Risk Invoices",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    {
      id: "statistics",
      label: "Statistics",
      icon: <BarChart2 className="w-3.5 h-3.5" />,
    },
    {
      id: "config",
      label: "Config",
      icon: <Settings className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                Anomaly Detection Dashboard
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Monitor and configure invoice anomaly detection
              </p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0 border-b border-gray-200 px-5 bg-orange-50/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "invoices" && <HighRiskTab />}
        {activeTab === "statistics" && <StatisticsTab />}
        {activeTab === "config" && <ConfigTab />}
      </div>
    </div>
  );
}
