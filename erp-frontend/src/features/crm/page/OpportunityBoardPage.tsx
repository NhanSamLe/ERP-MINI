// src/features/crm/pages/OpportunityBoardPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { RootState } from "../../../store/store";
import { fetchAllOpportunities, changePipelineStage } from "../store/opportunity/opportunity.thunks";
import { Opportunity } from "../dto/opportunity.dto";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { formatVND } from "../../../utils/currency.helper";
import { Download } from "lucide-react";
import { exportExcelReport } from "../../../utils/excel/exportExcelReport";
import * as pipelineApi from "../api/pipeline.api";

export default function OpportunityBoardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { allOpportunities, loading, error } = useAppSelector(
    (s: RootState) => s.opportunity
  );
  const user = useAppSelector((s: RootState) => s.auth.user);

  // Dynamic Pipeline Columns State
  const [columns, setColumns] = useState<any[]>([]);

  useEffect(() => {
    dispatch(fetchAllOpportunities());
    
    // Load dynamic pipeline stages from backend
    pipelineApi.getAllPipelines().then((res) => {
      const pipelines = res.data.data;
      if (pipelines && pipelines.length > 0) {
        // Just use the first pipeline for the board
        const stages = pipelines[0].stages;
        setColumns(stages);
      }
    }).catch(err => console.error("Failed to load pipelines", err));

  }, [dispatch]);

  const handleExport = async () => {
    try {
      await exportExcelReport({
        title: "BÁO CÁO CƠ HỘI BÁN HÀNG (DEALS PIPELINE)",
        columns: [
          { header: "Mã Deal", key: "id", width: 10 },
          { header: "Tên Cơ hội", key: "name", width: 30 },
          {
            header: "Khách hàng",
            key: "customer",
            width: 25,
            formatter: (_: any, row: Opportunity) => row.customer?.name || row.lead?.name || "-"
          },
          { header: "Giai đoạn", key: "stage", width: 15, formatter: (val) => String(val).toUpperCase() },
          {
            header: "Giá trị kỳ vọng",
            key: "expected_value",
            width: 20,
            format: "currency",
            align: "right"
          },
          {
            header: "Ngày chốt dự kiến",
            key: "closing_date",
            width: 15,
            formatter: (val) => val ? new Date(String(val)).toLocaleDateString('vi-VN') : ""
          },
          {
            header: "Người phụ trách",
            key: "owner",
            width: 20,
            formatter: (val: any) => val?.full_name || "-"
          }
        ],
        data: allOpportunities,
        fileName: `Bao_Cao_Co_Hoi_Ban_Hang_${new Date().getTime()}.xlsx`,
        footer: {
          creator: user?.full_name || "Admin"
        }
      });
    } catch (err) {
      console.error("Export Error:", err);
      alert("Lỗi xuất file excel");
    }
  };

  // Group deals into dynamic pipelines.
  // We use pipeline_stage_id instead of 'stage' enum now
  const grouped: Record<number, Opportunity[]> = {};
  columns.forEach(col => { grouped[col.id] = []; });
  
  // Create a bucket for unmapped stages (e.g. legacy deals with enum stage but no pipeline_stage_id)
  const legacyOrphanDeals: Opportunity[] = [];

  allOpportunities.forEach((opp: Opportunity) => {
    if (opp.pipeline_stage_id && grouped[opp.pipeline_stage_id]) {
      grouped[opp.pipeline_stage_id].push(opp);
    } else if (!opp.pipeline_stage_id && columns.length > 0) {
      // Map legacy "prospecting" to the first col, "won" to the last manually if desired,
      // or just put them temporarily on the first bucket so users can drag & drop them to clear legacy.
      grouped[columns[0].id].push(opp);
    } else {
      legacyOrphanDeals.push(opp);
    }
  });

  // DRAG AND DROP
  const onDragStart = (e: React.DragEvent, oppId: number) => {
    e.dataTransfer.setData("oppId", oppId.toString());
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, targetStageId: number) => {
    const oppId = Number(e.dataTransfer.getData("oppId"));
    if (!oppId) return;
    
    // Call API Thunk
    dispatch(changePipelineStage({ oppId, newStageId: targetStageId }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deals Pipeline</h1>
            <p className="text-sm text-gray-500">
              Kéo thả các Deal để chuyển đổi giai đoạn kinh doanh
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              title="Export Excel"
            >
              <Download className="w-5 h-5" />
              <span>Export Excel</span>
            </button>

            <Button
              variant="primary"
              onClick={() => navigate("/crm/opportunities/create")}
            >
              + New Deal
            </Button>
          </div>
        </div>

        {error && <Alert type="error" message={error} />}

        {columns.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border-dashed border-2 border-gray-300">
            <p className="text-gray-500 mb-4">Bạn chưa cấu hình Phễu (Pipeline) nào cho doanh nghiệp.</p>
            {/* Could add a shortcut button to Settings to configure Pipelines here */}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar" style={{ minHeight: '75vh' }}>
            {columns.map((col, idx) => {
              const list = grouped[col.id] || [];
              const total = list.reduce((sum, o) => sum + Number(o.expected_value || 0), 0);
              
              // Give some colors automatically based on index
              const colorBg = col.is_won ? 'bg-green-50/70 border-green-200' : col.is_lost ? 'bg-red-50/70 border-red-200' : 'bg-gray-50 border-gray-200';
              const headerColor = col.is_won ? 'text-green-800' : col.is_lost ? 'text-red-800' : 'text-blue-800';

              return (
                <div 
                  key={col.id} 
                  className={`min-w-[320px] max-w-[320px] rounded-xl flex flex-col border shadow-sm ${colorBg}`}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, col.id)}
                >
                  <div className={`px-4 py-3 border-b border-gray-200 text-sm font-semibold flex justify-between items-center`}>
                    <span className={headerColor}>
                      {col.name} <span className="text-gray-500 text-xs font-normal ml-1">({list.length})</span>
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {formatVND(total)}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {loading && !list.length && <p className="text-xs text-gray-400">Loading...</p>}
                    
                    {list.map((opp) => (
                      <div
                        key={opp.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, opp.id)}
                        className="w-full text-left bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md hover:border-blue-400 transition cursor-grab active:cursor-grabbing group relative"
                      >
                         <button 
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition"
                            onClick={() => navigate(`/crm/opportunities/${opp.id}`)}
                          >
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                         </button>

                        <p className="text-sm font-semibold text-gray-800 pr-6 truncate">
                          {opp.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {opp.customer?.name || opp.lead?.name || "-"}
                        </p>
                        
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                          <span className="text-sm font-medium text-blue-700">
                            {formatVND(opp.expected_value)}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {opp.closing_date ? new Date(opp.closing_date).toLocaleDateString("vi-VN").slice(0,5) : "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Ghost card area to help with dropping to empty columns */}
                    <div className="h-20 border-2 border-transparent border-dashed rounded-lg"></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
