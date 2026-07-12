import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { fetchAllOpportunities, changePipelineStage } from "../store/opportunity/opportunity.thunks";
import { Opportunity } from "../dto/opportunity.dto";
import { Pipeline, PipelineStage } from "../dto/pipeline.dto";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatVND } from "@/utils/currency.helper";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";
import * as pipelineApi from "../api/pipeline.api";
import { Plus, Download, GitBranch, ChevronDown, ExternalLink, Search, Filter, X } from "lucide-react";

type StatusFilter = "all" | "active" | "won" | "lost";

export default function OpportunityBoardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { allOpportunities, loading, error } = useAppSelector((s: RootState) => s.opportunity);
  const user = useAppSelector((s: RootState) => s.auth.user);

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);
  const [showPipelineMenu, setShowPipelineMenu] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchAllOpportunities());
    pipelineApi.getAllPipelines().then((res) => {
      const list: Pipeline[] = res.data.data || [];
      setPipelines(list);
      if (list.length > 0 && !selectedPipelineId) {
        const defaultP = list.find((p) => p.is_default) || list[0];
        setSelectedPipelineId(defaultP.id);
      }
    }).catch(() => setAlertMsg({ type: "error", message: "Không thể tải Pipelines" }));
  }, [dispatch]);

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const stages: PipelineStage[] = selectedPipeline?.stages || [];

  // Filter stages based on status filter
  const filteredStages = useMemo(() => {
    if (statusFilter === "won") {
      return stages.filter((s) => s.is_won);
    } else if (statusFilter === "lost") {
      return stages.filter((s) => s.is_lost);
    } else if (statusFilter === "active") {
      return stages.filter((s) => !s.is_won && !s.is_lost);
    }
    return stages; // "all" - show all stages
  }, [stages, statusFilter]);

  // Filter opportunities
  const filteredOpps = useMemo(() => {
    let result = [...allOpportunities];

    // Filter by pipeline — include opps without pipeline_id (legacy data)
    if (selectedPipelineId) {
      result = result.filter((o) => !o.pipeline_id || o.pipeline_id === selectedPipelineId);
    }

    // Search by name / customer / lead
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          (o.customer?.name || "").toLowerCase().includes(q) ||
          (o.lead?.name || "").toLowerCase().includes(q)
      );
    }

    // Filter by closing date range
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((o) => o.closing_date && new Date(o.closing_date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((o) => o.closing_date && new Date(o.closing_date) <= to);
    }

    // Filter by status
    if (statusFilter === "won") {
      result = result.filter((o) => {
        const stage = stages.find((s) => s.id === o.pipeline_stage_id);
        return stage?.is_won || o.stage === "won";
      });
    } else if (statusFilter === "lost") {
      result = result.filter((o) => {
        const stage = stages.find((s) => s.id === o.pipeline_stage_id);
        return stage?.is_lost || o.stage === "lost";
      });
    } else if (statusFilter === "active") {
      result = result.filter((o) => {
        const stage = stages.find((s) => s.id === o.pipeline_stage_id);
        return !stage?.is_won && !stage?.is_lost && o.stage !== "won" && o.stage !== "lost";
      });
    }

    return result;
  }, [allOpportunities, selectedPipelineId, searchText, dateFrom, dateTo, statusFilter, stages]);

  // Group opps by pipeline_stage_id
  const grouped: Record<number, Opportunity[]> = useMemo(() => {
    const map: Record<number, Opportunity[]> = {};
    filteredStages.forEach((s) => { map[s.id] = []; });
    filteredOpps.forEach((opp) => {
      if (opp.pipeline_stage_id && map[opp.pipeline_stage_id]) {
        map[opp.pipeline_stage_id].push(opp);
      } else if (!opp.pipeline_stage_id && filteredStages.length > 0) {
        map[filteredStages[0].id].push(opp);
      }
    });
    return map;
  }, [filteredOpps, filteredStages]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredOpps.length;
    const won = filteredOpps.filter((o) => {
      const s = stages.find((st) => st.id === o.pipeline_stage_id);
      return s?.is_won || o.stage === "won";
    }).length;
    const lost = filteredOpps.filter((o) => {
      const s = stages.find((st) => st.id === o.pipeline_stage_id);
      return s?.is_lost || o.stage === "lost";
    }).length;
    const active = total - won - lost;
    const totalValue = filteredOpps.reduce((sum, o) => sum + Number(o.expected_value || 0) * Number(o.exchange_rate || 1), 0);
    return { total, won, lost, active, totalValue };
  }, [filteredOpps, stages]);

  const hasActiveFilters = !!(searchText || dateFrom || dateTo || statusFilter !== "active");

  const clearFilters = () => {
    setSearchText("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("active");
  };

  const handleExport = async () => {
    try {
      await exportExcelReport({
        title: "BÁO CÁO CƠ HỘI BÁN HÀNG (DEALS PIPELINE)",
        columns: [
          { header: "Mã Deal", key: "id", width: 10 },
          { header: "Tên Cơ hội", key: "name", width: 30 },
          { header: "Khách hàng", key: "customer", width: 25, formatter: (_: any, row: Opportunity) => row.customer?.name || row.lead?.name || "-" },
          { header: "Giai đoạn", key: "stage", width: 15, formatter: (v: any) => String(v).toUpperCase() },
          { header: "Giá trị kỳ vọng", key: "expected_value", width: 20, format: "currency", align: "right" },
          { header: "Ngày chốt dự kiến", key: "closing_date", width: 15, formatter: (v: any) => v ? new Date(String(v)).toLocaleDateString("vi-VN") : "" },
          { header: "Người phụ trách", key: "owner", width: 20, formatter: (v: any) => v?.full_name || "-" },
        ],
        data: filteredOpps,
        fileName: `Bao_Cao_Co_Hoi_Ban_Hang_${new Date().getTime()}.xlsx`,
        footer: { creator: user?.full_name || "Admin" },
      });
    } catch {
      setAlertMsg({ type: "error", message: "Lỗi xuất file Excel" });
    }
  };

  const onDragStart = (e: React.DragEvent, oppId: number) => {
    e.dataTransfer.setData("oppId", oppId.toString());
  };

  const onDrop = async (e: React.DragEvent, targetStageId: number) => {
    const oppId = Number(e.dataTransfer.getData("oppId"));
    if (!oppId) return;
    
    try {
      await dispatch(changePipelineStage({ oppId, newStageId: targetStageId })).unwrap();
      setAlertMsg({ type: "success", message: "Đã chuyển giai đoạn thành công" });
    } catch (err: any) {
      const errorMsg = err?.message || "Không thể chuyển giai đoạn";
      setAlertMsg({ type: "error", message: errorMsg });
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="erp-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Quy trình cơ hội kinh doanh</h1>
              <p className="text-xs text-gray-400 mt-0.5">Kéo thả Deal để chuyển đổi giai đoạn kinh doanh</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {stats.total}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Pipeline selector */}
            <div className="relative">
              <button
                className="flex items-center gap-1.5 h-8 px-3 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700"
                onClick={() => setShowPipelineMenu(!showPipelineMenu)}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedPipeline?.stages?.[0]?.color || "#f97316" }} />
                <span className="max-w-[140px] truncate">{selectedPipeline?.name || "Chọn Pipeline"}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {showPipelineMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowPipelineMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-1">
                    {pipelines.map((p) => (
                      <button
                        key={p.id}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${p.id === selectedPipelineId ? "bg-orange-50 text-orange-600 font-medium" : "text-gray-700"}`}
                        onClick={() => { setSelectedPipelineId(p.id); setShowPipelineMenu(false); }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.stages?.[0]?.color || "#f97316" }} />
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="text-xs text-gray-400">({p.stages?.length || 0})</span>
                        {p.is_default && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">Mặc định</span>}
                      </button>
                    ))}
                    {pipelines.length === 0 && (
                      <p className="px-4 py-3 text-sm text-gray-400">Chưa có Pipeline nào</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={handleExport}>
              Export Excel
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => navigate("/crm/opportunities/create")}>
              New Deal
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            Đang hoạt động: <span className="font-semibold text-gray-700">{stats.active}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Đã thắng: <span className="font-semibold text-gray-700">{stats.won}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Đã thua: <span className="font-semibold text-gray-700">{stats.lost}</span>
          </div>
          <div className="text-xs text-gray-400 ml-auto">
            Tổng giá trị: <span className="font-semibold text-orange-600">{formatVND(stats.totalValue)}</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-2.5 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[320px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, khách hàng..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
              {searchText && (
                <button onClick={() => setSearchText("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Toggle advanced filters */}
            <button
              className={`flex items-center gap-1.5 h-8 px-2.5 text-xs border rounded-md transition-colors ${showFilters || hasActiveFilters ? "border-orange-300 bg-orange-50 text-orange-600" : "border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400"}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-3 h-3" />
              Bộ lọc
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
            </button>

            {/* Status quick filters */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
              {(["active", "won", "lost", "all"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${statusFilter === f ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f === "active" ? "Đang hoạt động" : f === "won" ? "Đã thắng" : f === "lost" ? "Đã thua" : "Tất cả"}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                <X className="w-3 h-3" />
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Advanced date filter */}
          {showFilters && (
            <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-gray-100">
              <span className="text-xs text-gray-500">Ngày chốt dự kiến:</span>
              <label className="text-xs text-gray-500">Từ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
              <label className="text-xs text-gray-500">Đến</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Alert */}
      {alertMsg && <Alert type={alertMsg.type} message={alertMsg.message} onClose={() => setAlertMsg(null)} />}
      {error && <Alert type="error" message={error} />}

      {/* Empty pipeline state */}
      {!loading && pipelines.length === 0 && (
        <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
          <GitBranch className="w-10 h-10" />
          <p className="text-sm font-medium">Chưa có Pipeline nào</p>
          <p className="text-xs text-gray-400">Tạo Pipeline đầu tiên trong CRM → Pipelines</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-sm">Đang tải...</span>
        </div>
      )}

      {/* No results after filter */}
      {!loading && filteredStages.length > 0 && filteredOpps.length === 0 && (
        <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
          <Search className="w-10 h-10" />
          <p className="text-sm font-medium">Không tìm thấy Deal nào</p>
          <p className="text-xs text-gray-400">Thử thay đổi bộ lọc hoặc Pipeline khác</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium">
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Kanban Board */}
      {!loading && filteredStages.length > 0 && filteredOpps.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4 mt-4" style={{ minHeight: "65vh" }}>
          {filteredStages.map((stage) => {
            const list = grouped[stage.id] || [];
            const total = list.reduce((sum, o) => sum + Number(o.expected_value || 0) * Number(o.exchange_rate || 1), 0);

            return (
              <div
                key={stage.id}
                className="min-w-[310px] max-w-[310px] rounded-lg flex flex-col border shadow-sm bg-gray-50"
                style={{ borderTopColor: stage.color || "#f97316", borderTopWidth: "3px" }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, stage.id)}
              >
                {/* Column header */}
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color || "#f97316" }} />
                    <span className="text-sm font-semibold text-gray-800">{stage.name}</span>
                    <span className="text-xs text-gray-400">({list.length})</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono whitespace-nowrap flex-shrink-0">{formatVND(total)}</span>
                </div>

                {/* Stage info badges */}
                {!!(stage.is_won || stage.is_lost) && (
                  <div className="px-4 py-1.5 flex items-center gap-2">
                    {stage.is_won && <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">THẮNG</span>}
                    {stage.is_lost && <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">THUA</span>}
                  </div>
                )}

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5" style={{ maxHeight: "55vh" }}>
                  {list.map((opp) => {
                    const isWon = stage.is_won || opp.stage === "won";
                    return (
                    <div
                      key={opp.id}
                      draggable={!isWon}
                      onDragStart={(e) => !isWon && onDragStart(e, opp.id)}
                      className={`w-full text-left bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md hover:border-orange-300 transition group relative ${!isWon ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-75"}`}
                    >
                      <button
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-orange-600 transition"
                        onClick={() => navigate(`/crm/opportunities/${opp.id}`)}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <p className="text-sm font-semibold text-gray-800 pr-6 truncate flex items-center gap-1.5">
                        {opp.name}
                        {isWon && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded">ĐÃ KHÓA</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{opp.customer?.name || opp.lead?.name || "-"}</p>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                        <div className="flex flex-col gap-0.5">
                          {opp.currency?.code && opp.currency.code !== "VND" ? (
                            <>
                              <span className="text-xs font-medium text-gray-700">
                                {opp.expected_value?.toLocaleString('vi-VN')} {opp.currency.symbol}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                ≈ {formatVND((opp.expected_value ?? 0) * (opp.exchange_rate || 1))}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-medium text-orange-700">
                              {formatVND(opp.expected_value)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {opp.owner && (
                            <span className="text-[10px] text-gray-400 truncate max-w-[80px]" title={opp.owner.full_name}>
                              {opp.owner.full_name}
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                            {opp.closing_date ? new Date(opp.closing_date).toLocaleDateString("vi-VN") : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )})}

                  <div className="h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-300">
                    Kéo thả Deal vào đây
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
