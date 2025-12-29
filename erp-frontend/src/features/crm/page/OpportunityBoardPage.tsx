// src/features/crm/pages/OpportunityBoardPage.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { RootState } from "../../../store/store";
import { fetchAllOpportunities } from "../store/opportunity/opportunity.thunks";
import { Opportunity } from "../dto/opportunity.dto";
import { OpportunityStage } from "../../../types/enum";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { formatVND } from "../../../utils/currency.helper";
import { Download } from "lucide-react";
import { exportExcelReport } from "../../../utils/excel/exportExcelReport";

const COLUMNS: { key: OpportunityStage; label: string; color: string }[] = [
  { key: "prospecting", label: "Prospecting", color: "bg-blue-50" },
  { key: "negotiation", label: "Negotiation/Review", color: "bg-yellow-50" },
  { key: "won", label: "Closed Won", color: "bg-green-50" },
  { key: "lost", label: "Closed Lost", color: "bg-red-50" },
];

export default function OpportunityBoardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { allOpportunities, loading, error } = useAppSelector(
    (s: RootState) => s.opportunity
  );
  const user = useAppSelector((s: RootState) => s.auth.user);

  useEffect(() => {
    dispatch(fetchAllOpportunities());
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
            header: "Xác suất (%)",
            key: "probability",
            width: 15,
            align: "center",
            formatter: (val) => val ? `${val}%` : "-"
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
      // Optional: Add simple alert logic here if needed, but Page uses redux error only
      alert("Lỗi xuất file excel");
    }
  };

  const grouped: Record<OpportunityStage, Opportunity[]> = {
    prospecting: [],
    negotiation: [],
    won: [],
    lost: [],
  };

  allOpportunities.forEach((opp: Opportunity) => {
    grouped[opp.stage].push(opp);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
            <p className="text-sm text-gray-500">
              Pipeline deals theo từng stage.
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

        {error && (
          <Alert type="error" message={error} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const list = grouped[col.key];
            const total = list.reduce(
              (sum, o) => sum + Number(o.expected_value || 0),
              0
            );

            return (
              <div key={col.key} className="bg-white rounded-xl shadow-sm flex flex-col h-[70vh]">
                <div
                  className={`px-4 py-3 border-b text-sm font-semibold flex justify-between items-center ${col.color}`}
                >
                  <span>
                    {col.label}{" "}
                    <span className="text-gray-500">({list.length})</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatVND(total)}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {loading && !list.length && (
                    <p className="text-xs text-gray-400">Loading...</p>
                  )}
                  {!loading && !list.length && (
                    <p className="text-xs text-gray-400">No deals found.</p>
                  )}
                  {list.map((opp) => (
                    <button
                      key={opp.id}
                      onClick={() =>
                        navigate(`/crm/opportunities/${opp.id}`)
                      }
                      className="w-full text-left bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md hover:border-orange-300 transition"
                    >
                      <p className="text-sm font-semibold text-gray-800">
                        {opp.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {opp.customer?.name || opp.lead?.name || "-"}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-medium text-gray-600">
                          {formatVND(opp.expected_value)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {opp.closing_date
                            ? new Date(opp.closing_date).toLocaleDateString(
                              "vi-VN"
                            )
                            : "—"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
