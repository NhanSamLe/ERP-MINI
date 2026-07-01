import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { ArrowLeft, History } from "lucide-react";
import { fetchPurchaseOrderAuditLogsThunk } from "../store/purchaseOrder.thunks";
import { AuditLogCard } from "../components/Common";

export default function AuditLogPage() {
  const { po_id } = useParams<{ po_id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const poIdNum = Number(po_id ?? 0);

  useEffect(() => {
    if (!poIdNum) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await dispatch(
          fetchPurchaseOrderAuditLogsThunk(poIdNum),
        ).unwrap();
        setLogs(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [poIdNum, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Spacer */}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <History className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Lịch sử thay đổi
            </h1>
            <p className="text-sm text-gray-500">Đơn đặt hàng #{po_id}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 mt-6">
        {/* Audit Log Card */}
        <AuditLogCard
          title="Tất cả thay đổi"
          logs={logs}
          loading={loading}
          variant="po"
        />
      </div>
    </div>
  );
}
