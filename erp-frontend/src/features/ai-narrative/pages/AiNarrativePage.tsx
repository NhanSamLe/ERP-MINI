import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearResult } from "../store/narrativeSlice";
import {
  generateNarrativeThunk,
  fetchNarrativeLogsThunk,
  fetchCacheStatsThunk,
  clearExpiredCacheThunk,
} from "../store/narrativeThunks";
import { NarrativeType } from "../types/narrative.types";
import PageHeader from "@/components/layout/PageHeader";
import {
  Sparkles,
  Clock,
  Database,
  TrendingUp,
  DollarSign,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

const NARRATIVE_TYPES: { value: NarrativeType; label: string; desc: string }[] =
  [
    {
      value: "monthly_report",
      label: "Báo Cáo Tháng",
      desc: "Tổng quan tài chính tháng",
    },
    {
      value: "sales_performance",
      label: "Hiệu Suất Bán Hàng",
      desc: "Phân tích doanh số & sản phẩm",
    },
    {
      value: "vendor_performance",
      label: "Hiệu Suất Nhà Cung Cấp",
      desc: "Đánh giá on-time & chất lượng",
    },
    {
      value: "cash_flow",
      label: "Dòng Tiền",
      desc: "Phân tích AR/AP & DSO/DPO",
    },
  ];

export default function AiNarrativePage() {
  const dispatch = useAppDispatch();
  const {
    result,
    generating,
    generateError,
    logs,
    logsTotal,
    logsLoading,
    cacheStats,
    cacheStatsLoading,
  } = useAppSelector((s) => s.narrative);

  const companyId = 1; // company_id không có trong User type, dùng default

  // Form state
  const [narrativeType, setNarrativeType] =
    useState<NarrativeType>("monthly_report");
  const [periodStart, setPeriodStart] = useState("2025-03-01");
  const [periodEnd, setPeriodEnd] = useState("2025-03-31");
  const [activeTab, setActiveTab] = useState<"generate" | "logs" | "cache">(
    "generate",
  );

  useEffect(() => {
    dispatch(fetchNarrativeLogsThunk({ companyId, limit: 20 }));
    dispatch(fetchCacheStatsThunk(companyId));
  }, [dispatch, companyId]);

  const handleGenerate = async () => {
    if (!periodStart || !periodEnd) {
      toast.error("Vui lòng chọn khoảng thời gian");
      return;
    }
    dispatch(clearResult());
    const res = await dispatch(
      generateNarrativeThunk({
        companyId,
        narrativeType,
        periodStart,
        periodEnd,
      }),
    );
    if (generateNarrativeThunk.fulfilled.match(res)) {
      const data = res.payload;
      if (data.cacheHit) {
        toast.success("✅ Lấy từ cache — phản hồi tức thì!");
      } else {
        toast.success("✅ Đã tạo narrative mới từ AI");
      }
      // Refresh logs & stats
      dispatch(fetchNarrativeLogsThunk({ companyId, limit: 20 }));
      dispatch(fetchCacheStatsThunk(companyId));
    } else {
      const errMsg = (res as any).payload ?? "Lỗi khi tạo narrative";
      toast.error(`❌ ${errMsg}`);
    }
  };

  const handleClearExpired = async () => {
    const res = await dispatch(clearExpiredCacheThunk());
    if (clearExpiredCacheThunk.fulfilled.match(res)) {
      toast.success(`Đã xóa ${res.payload.clearedCount} cache hết hạn`);
      dispatch(fetchCacheStatsThunk(companyId));
    }
  };

  const formatCost = (cost: number) =>
    cost === 0 ? "$0" : `$${cost.toFixed(5)}`;

  const formatMs = (ms: number) =>
    ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Báo cáo Phân tích AI"
        description="Tự động tạo nhận xét tài chính bằng AI · Cache 7 ngày"
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: "generate", label: "Tạo Narrative", icon: Sparkles },
          { key: "logs", label: `Lịch Sử (${logsTotal})`, icon: Clock },
          { key: "cache", label: "Cache Stats", icon: Database },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── TAB: GENERATE ─── */}
      {activeTab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h3 className="font-semibold text-gray-800">Cấu Hình</h3>

            {/* Narrative Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Loại Narrative
              </label>
              <div className="grid grid-cols-2 gap-2">
                {NARRATIVE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setNarrativeType(t.value)}
                    className={`text-left p-3 rounded-lg border text-sm transition-all ${
                      narrativeType === t.value
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <div className="font-medium">{t.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Period */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Tạo Narrative
                </>
              )}
            </button>

            {generateError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {generateError}
              </div>
            )}
          </div>

          {/* Result */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Kết Quả</h3>

            {!result && !generating && (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
                <Sparkles className="w-10 h-10 opacity-30" />
                <p className="text-sm">Chọn loại và nhấn "Tạo Narrative"</p>
              </div>
            )}

            {generating && (
              <div className="flex flex-col items-center justify-center h-48 text-orange-500 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <p className="text-sm">Đang gọi AI...</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Cache badge */}
                <div className="flex items-center gap-2">
                  {result.cacheHit ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <Zap className="w-3 h-3" />
                      Cache Hit — Tức thì
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <Sparkles className="w-3 h-3" />
                      Mới từ AI
                    </span>
                  )}
                </div>

                {/* Narrative text */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100">
                  {result.narrative}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Tokens</div>
                    <div className="font-semibold text-orange-600">
                      {result.tokensUsed}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Chi Phí</div>
                    <div className="font-semibold text-green-600">
                      {formatCost(result.costUSD)}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Nguồn</div>
                    <div className="font-semibold text-blue-600 text-xs">
                      {result.cacheHit ? "Database" : "OpenAI"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: LOGS ─── */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Lịch Sử Tạo Narrative
            </h3>
            <button
              onClick={() =>
                dispatch(fetchNarrativeLogsThunk({ companyId, limit: 20 }))
              }
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới
            </button>
          </div>

          {logsLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Đang tải...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-2">
              <Clock className="w-8 h-8 opacity-30" />
              <p className="text-sm">Chưa có lịch sử</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Loại</th>
                  <th className="px-6 py-3 text-left">Kỳ</th>
                  <th className="px-6 py-3 text-center">Cache</th>
                  <th className="px-6 py-3 text-right">Tokens</th>
                  <th className="px-6 py-3 text-right">Chi Phí</th>
                  <th className="px-6 py-3 text-right">Thời Gian</th>
                  <th className="px-6 py-3 text-center">Trạng Thái</th>
                  <th className="px-6 py-3 text-left">Tạo Lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  // Sequelize underscored:true trả camelCase, support cả 2
                  const narrativeType =
                    (log as any).narrativeType ?? log.narrative_type;
                  const periodStart =
                    (log as any).periodStart ?? log.period_start;
                  const periodEnd = (log as any).periodEnd ?? log.period_end;
                  const tokensUsed =
                    (log as any).tokensUsed ?? log.tokens_used ?? 0;
                  const costUsd = (log as any).costUsd ?? log.cost_usd ?? 0;
                  const generationTimeMs =
                    (log as any).generationTimeMs ?? log.generation_time_ms;
                  const createdAt = (log as any).createdAt ?? log.created_at;
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3 font-medium text-gray-700">
                        {NARRATIVE_TYPES.find((t) => t.value === narrativeType)
                          ?.label ?? narrativeType}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {periodStart?.slice(0, 10)} → {periodEnd?.slice(0, 10)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {log.cache_hit ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                            <Zap className="w-3 h-3" /> Hit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                            <Sparkles className="w-3 h-3" /> Miss
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600">
                        {tokensUsed}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600">
                        {formatCost(costUsd)}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600">
                        {generationTimeMs ? formatMs(generationTimeMs) : "—"}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {log.status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {new Date(createdAt).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ─── TAB: CACHE STATS ─── */}
      {activeTab === "cache" && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Tổng Cache",
                value: cacheStats?.totalCached ?? "—",
                icon: Database,
                color: "blue",
              },
              {
                label: "Cache Hit Rate",
                value: cacheStats ? `${cacheStats.hitRate}%` : "—",
                icon: TrendingUp,
                color: "green",
              },
              {
                label: "Chi Phí Tiết Kiệm",
                value: cacheStats ? formatCost(cacheStats.totalCostSaved) : "—",
                icon: DollarSign,
                color: "orange",
              },
              {
                label: "Phản hồi Trung bình",
                value: cacheStats
                  ? formatMs(cacheStats.averageResponseTime)
                  : "—",
                icon: Zap,
                color: "purple",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    color === "blue"
                      ? "bg-blue-100 text-blue-600"
                      : color === "green"
                        ? "bg-green-100 text-green-600"
                        : color === "orange"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-purple-100 text-purple-600"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-xl font-bold text-gray-800">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Chi Tiết Cache</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => dispatch(fetchCacheStatsThunk(companyId))}
                  disabled={cacheStatsLoading}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${cacheStatsLoading ? "animate-spin" : ""}`}
                  />
                  Làm mới
                </button>
                <button
                  onClick={handleClearExpired}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa Cache Hết Hạn
                </button>
              </div>
            </div>

            {cacheStats ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Cache Hits</span>
                    <span className="font-medium text-green-600">
                      {cacheStats.cacheHits}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Cache Misses</span>
                    <span className="font-medium text-blue-600">
                      {cacheStats.cacheMisses}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Hit Rate</span>
                    <span className="font-medium text-orange-600">
                      {cacheStats.hitRate}%
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Cache cũ nhất</span>
                    <span className="font-medium text-gray-700">
                      {cacheStats.oldestCacheEntry
                        ? new Date(
                            cacheStats.oldestCacheEntry,
                          ).toLocaleDateString("vi-VN")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Cache mới nhất</span>
                    <span className="font-medium text-gray-700">
                      {cacheStats.newestCacheEntry
                        ? new Date(
                            cacheStats.newestCacheEntry,
                          ).toLocaleDateString("vi-VN")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">TTL</span>
                    <span className="font-medium text-gray-700">7 ngày</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Đang tải...
              </div>
            )}

            {/* Hit rate bar */}
            {cacheStats && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Cache Hit Rate</span>
                  <span>{cacheStats.hitRate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${cacheStats.hitRate}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Mục tiêu: 80% · Tiết kiệm ~80% chi phí API
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
