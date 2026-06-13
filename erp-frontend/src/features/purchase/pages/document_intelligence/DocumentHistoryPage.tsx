// DocumentHistoryPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getDocumentHistoryThunk,
  setCurrentDocumentId,
  setStatus,
  setResult,
} from "../../store/documentIntelligence";
import { documentIntelligenceApi } from "../../api/documentIntelligence.api";
import { OcrStatus as OcrStatusType } from "../../store/documentIntelligence/documentIntelligence.types";
import { toast } from "react-toastify";
import { OcrStatus } from "../../constants/purchaseStatus.enum";

const STATUS_LABELS: Record<OcrStatusType, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  done: "Hoàn thành",
  failed: "Thất bại",
};

const STATUS_BADGE: Record<OcrStatusType, string> = {
  pending: "bg-gray-100 text-gray-700",
  processing: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const PAGE_SIZE = 20;

export default function DocumentHistoryPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { history, historyTotal, loading } = useAppSelector(
    (s) => s.documentIntelligence,
  );

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loadingResult, setLoadingResult] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(historyTotal / PAGE_SIZE));

  const fetchHistory = () => {
    dispatch(
      getDocumentHistoryThunk({
        page,
        limit: PAGE_SIZE,
        ocr_status: statusFilter === "all" ? undefined : statusFilter,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
    );
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, dateFrom, dateTo]);

  const handleViewResult = async (id: number) => {
    setLoadingResult(id);
    try {
      const [statusRes, resultRes] = await Promise.all([
        documentIntelligenceApi.getStatus(id),
        documentIntelligenceApi.getResult(id),
      ]);
      dispatch(setCurrentDocumentId(id));
      dispatch(setStatus(statusRes));
      dispatch(setResult(resultRes));
      navigate("/purchase/document-intelligence");
    } catch (err: any) {
      toast.error(err?.message ?? "Không thể tải kết quả OCR");
    } finally {
      setLoadingResult(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lịch Sử OCR</h1>
            <p className="text-gray-600 mt-1">
              Danh sách các hóa đơn đã tải lên và xử lý OCR
            </p>
          </div>
          <button
            onClick={() => navigate("/purchase/document-intelligence")}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tải lên mới
          </button>
          <button
            onClick={() =>
              navigate("/purchase/document-intelligence/anomalies")
            }
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
          >
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            Bảng phát hiện bất thường
          </button>
        </div>

        {/* ── Filter bar ── */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-orange-400 border p-5">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Status filter */}
            <div className="w-52">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái OCR
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
              >
                <option value="all">Tất cả</option>
                <option value={OcrStatus.PENDING}>Chờ xử lý</option>
                <option value={OcrStatus.PROCESSING}>Đang xử lý</option>
                <option value={OcrStatus.DONE}>Hoàn thành</option>
                <option value={OcrStatus.FAILED}>Thất bại</option>
              </select>
            </div>

            {/* Date from */}
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
              />
            </div>

            {/* Date to */}
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
              />
            </div>

            {/* Reset */}
            <button
              onClick={() => {
                setStatusFilter("all");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm transition-colors"
            >
              <Search className="w-4 h-4" />
              Đặt lại
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-orange-50/60 border-b border-orange-100">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Tên tệp
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Trạng thái OCR
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Độ tin cậy
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Ngày tạo
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <FileText className="w-8 h-8 animate-pulse" />
                      Đang tải...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    Không có dữ liệu
                  </td>
                </tr>
              )}

              {!loading &&
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-800 truncate max-w-xs">
                          {item.original_filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          STATUS_BADGE[item.ocr_status] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {STATUS_LABELS[item.ocr_status] ?? item.ocr_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.ocr_confidence != null ? (
                        <span
                          className={`font-medium ${
                            item.ocr_confidence >= 0.8
                              ? "text-green-600"
                              : item.ocr_confidence >= 0.6
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {Math.round(item.ocr_confidence * 100)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleViewResult(item.id)}
                          disabled={
                            loadingResult === item.id ||
                            item.ocr_status !== OcrStatus.DONE
                          }
                          title={
                            item.ocr_status !== OcrStatus.DONE
                              ? "Chỉ xem được kết quả khi OCR hoàn thành"
                              : "Xem kết quả"
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Eye className="w-4 h-4" />
                          Xem kết quả
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* ── Pagination ── */}
          <div className="px-6 py-4 border-t bg-orange-50/40 flex items-center justify-between text-sm text-gray-600">
            <span>
              Hiển thị{" "}
              <strong>
                {Math.min((page - 1) * PAGE_SIZE + 1, historyTotal)}–
                {Math.min(page * PAGE_SIZE, historyTotal)}
              </strong>{" "}
              / <strong>{historyTotal}</strong> bản ghi
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 rounded-lg border border-gray-300 bg-white font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
