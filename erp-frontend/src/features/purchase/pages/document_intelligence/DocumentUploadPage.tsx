// DocumentUploadPage.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  uploadDocumentThunk,
  pollDocumentStatusThunk,
  getDocumentResultThunk,
  confirmDocumentThunk,
  resetDocumentState,
} from "../../store/documentIntelligence";
import {
  OcrLineItem,
  ConfirmPayload,
  ConfirmLineItem,
  AnomalyResult,
  AnomalyFlag,
  AnomalySeverity,
  RiskLevel,
} from "../../store/documentIntelligence/documentIntelligence.types";
import { documentIntelligenceApi } from "../../api/documentIntelligence.api";
import { OcrStatus } from "../../constants/purchaseStatus.enum";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const POLL_INTERVAL_MS = 2000;

/* ─── Confidence Badge ─── */
function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  if (value >= 0.8)
    return (
      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
        Độ tin cậy: {pct}%
      </span>
    );
  if (value >= 0.6)
    return (
      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
        Độ tin cậy: {pct}%
      </span>
    );
  return (
    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
      Độ tin cậy: {pct}%
    </span>
  );
}

/* ─── Anomaly Result Panel ─── */
function formatFlagType(type: string): string {
  const map: Record<string, string> = {
    price_outlier_zscore: "Ngoại lệ giá (Z-Score)",
    price_outlier_iqr: "Ngoại lệ giá (IQR)",
    quantity_outlier_zscore: "Ngoại lệ số lượng (Z-Score)",
    quantity_outlier_5x: "Ngoại lệ số lượng (5×)",
    invalid_quantity: "Số lượng không hợp lệ",
    subtotal_mismatch: "Lệch tiền hàng",
    total_mismatch: "Lệch tổng tiền",
    line_amount_mismatch: "Lệch tiền dòng",
    approval_threshold_proximity: "Gần hạn mức phê duyệt",
    high_frequency_invoicing: "Tần suất hóa đơn cao",
    round_number_no_detail: "Số tròn, thiếu chi tiết",
    rejected_pattern_match: "Khớp mẫu đã bị từ chối",
    period_end_spike: "Đột biến cuối kỳ",
    new_vendor: "Nhà cung cấp mới",
    dormant_vendor_reactivation: "Nhà cung cấp hoạt động lại",
    weekend_high_value: "Giá trị cao cuối tuần",
    future_dated_invoice: "Hóa đơn ghi ngày tương lai",
    stale_invoice: "Hóa đơn quá cũ",
    vendor_tax_code_change: "Thay đổi mã số thuế",
    multivariate_outlier: "Ngoại lệ đa biến",
    insufficient_data: "Không đủ dữ liệu",
  };
  return map[type] ?? type;
}

function SeverityBadge({ severity }: { severity: AnomalySeverity }) {
  const config: Record<
    AnomalySeverity,
    { bg: string; text: string; label: string }
  > = {
    critical: { bg: "bg-red-100", text: "text-red-700", label: "Nghiêm trọng" },
    high: { bg: "bg-orange-100", text: "text-orange-700", label: "Cao" },
    medium: { bg: "bg-amber-100", text: "text-amber-700", label: "Trung bình" },
    low: { bg: "bg-gray-100", text: "text-gray-600", label: "Thấp" },
  };
  const c = config[severity];
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

function RiskLevelBadge({ level }: { level: RiskLevel }) {
  const config: Record<RiskLevel, { bg: string; text: string; label: string }> =
    {
      high_risk: { bg: "bg-red-100", text: "text-red-700", label: "Rủi ro cao" },
      medium_risk: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "Rủi ro trung bình",
      },
      low_risk: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Rủi ro thấp",
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

export interface AnomalyResultPanelProps {
  anomalyResult: AnomalyResult;
  _warnings?: string[];
}
export function AnomalyResultPanel({
  anomalyResult,
  _warnings,
}: AnomalyResultPanelProps) {
  const [flagsExpanded, setFlagsExpanded] = useState(false);
  const isHighRisk = anomalyResult.risk_level === "high_risk";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-gray-800">
            Phát hiện bất thường
          </span>
        </div>
        <div className="flex items-center gap-2">
          <RiskLevelBadge level={anomalyResult.risk_level} />
          <span className="text-xs text-gray-500">
            Điểm:{" "}
            <span className="font-semibold text-gray-700">
              {(anomalyResult.risk_score * 100).toFixed(0)}%
            </span>
          </span>
        </div>
      </div>

      {/* High risk warning banner */}
      {isHighRisk && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              Yêu cầu kiểm tra thủ công
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Hóa đơn này được đánh dấu rủi ro cao và yêu cầu kiểm tra thủ công trước khi phê duyệt.
            </p>
          </div>
        </div>
      )}

      {/* Math consistency */}
      <div className="flex items-center gap-2">
        {anomalyResult.math_consistent ? (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs text-green-700">
              Tính toán nhất quán — tổng tiền chính xác
            </span>
          </>
        ) : (
          <>
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-red-700">
              Phát hiện tính toán không nhất quán — tổng số tiền không khớp
            </span>
          </>
        )}
      </div>

      {/* Flags list */}
      {anomalyResult.flags.length > 0 && (
        <div>
          <button
            onClick={() => setFlagsExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-orange-600 transition-colors"
          >
            {flagsExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            Phát hiện {anomalyResult.flags.length} cảnh báo bất thường
          </button>

          {flagsExpanded && (
            <div className="mt-2 space-y-1.5">
              {anomalyResult.flags.map((flag: AnomalyFlag, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-100"
                >
                  <SeverityBadge severity={flag.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">
                      {formatFlagType(flag.type)}
                      {flag.lineItemIndex != null && (
                        <span className="ml-1 text-gray-400 font-normal">
                          (dòng {flag.lineItemIndex + 1})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {flag.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {anomalyResult.flags.length === 0 && (
        <p className="text-xs text-gray-500">Không phát hiện cảnh báo bất thường nào.</p>
      )}
    </div>
  );
}


/* ─── Confirm Modal ─── */
interface ConfirmModalProps {
  open: boolean;
  hasDuplicate: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (overrideDuplicate: boolean) => void;
}

function ConfirmModal({
  open,
  hasDuplicate,
  loading,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const [override, setOverride] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          Xác nhận tạo hóa đơn
        </h2>
        <p className="text-gray-600 text-sm">
          Hệ thống sẽ tạo Hóa đơn AP từ kết quả OCR. Bạn có chắc chắn muốn tiếp tục?
        </p>

        {hasDuplicate && (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">Phát hiện hóa đơn trùng lặp!</p>
              <p>Hóa đơn có mã số này đã tồn tại trong hệ thống.</p>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={override}
                  onChange={(e) => setOverride(e.target.checked)}
                  className="rounded"
                />
                <span>Ghi đè hóa đơn trùng lặp</span>
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(override)}
            disabled={loading || (hasDuplicate && !override)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function DocumentUploadPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { uploading, currentDocumentId, status, result, loading, error } =
    useAppSelector((s) => s.documentIntelligence);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Vendor manual selection ──
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [availableSuppliers, setAvailableSuppliers] = useState<
    Array<{ id: number; name: string }>
  >([]);

  // ── PO selection ──
  const [availablePOs, setAvailablePOs] = useState<
    Array<{
      id: number;
      po_no: string;
      total_after_tax: number;
      order_date: string;
    }>
  >([]);
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null);

  // ── Editable OCR fields ──
  const [editVendorName, setEditVendorName] = useState("");
  const [editInvoiceNo, setEditInvoiceNo] = useState("");
  const [editInvoiceDate, setEditInvoiceDate] = useState("");
  const [editSubtotal, setEditSubtotal] = useState<number>(0);
  const [editTaxAmount, setEditTaxAmount] = useState<number>(0);
  const [editTotal, setEditTotal] = useState<number>(0);
  const [editItems, setEditItems] = useState<OcrLineItem[]>([]);

  // Populate editable fields when result arrives
  useEffect(() => {
    if (result?.document?.ocr_result) {
      const ocr = result.document.ocr_result;
      setEditVendorName(ocr.vendor_name ?? "");
      setEditInvoiceNo(ocr.invoice_no ?? "");
      setEditInvoiceDate(ocr.invoice_date ?? "");
      setEditSubtotal(ocr.subtotal ?? 0);
      setEditTaxAmount(ocr.tax_amount ?? 0);
      setEditTotal(ocr.total ?? 0);
      setEditItems(ocr.items ?? []);
    }
  }, [result]);

  // Load POs when vendor is matched or manually selected
  const effectiveVendorId =
    result?.vendor_match?.matchedPartnerId ?? selectedVendorId ?? null;

  useEffect(() => {
    if (effectiveVendorId) {
      documentIntelligenceApi
        .getPurchaseOrdersForVendor(effectiveVendorId)
        .then(setAvailablePOs)
        .catch(() => setAvailablePOs([]));
    } else {
      setAvailablePOs([]);
      setSelectedPoId(null);
    }
  }, [effectiveVendorId]);

  // Load all suppliers when vendor is NOT matched (for manual selection)
  useEffect(() => {
    if (result && !result.vendor_match?.matchedPartnerId) {
      import("@/api/axiosClient").then(({ default: axiosClient }) => {
        axiosClient
          .get("partners", { params: { type: "supplier", limit: 200 } })
          .then((res) => {
            const data = res.data?.data ?? res.data ?? [];
            setAvailableSuppliers(
              data.map((p: any) => ({ id: p.id, name: p.name })),
            );
          })
          .catch(() => setAvailableSuppliers([]));
      });
    }
  }, [result?.vendor_match?.matchedPartnerId]);

  // ── Polling ──
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (
      currentDocumentId &&
      (status?.status === OcrStatus.PROCESSING ||
        status?.status === OcrStatus.PENDING)
    ) {
      stopPolling();
      pollRef.current = setInterval(async () => {
        const result = await dispatch(
          pollDocumentStatusThunk(currentDocumentId),
        ).unwrap();
        if (
          result.status === OcrStatus.DONE ||
          result.status === OcrStatus.FAILED
        ) {
          stopPolling();
          if (result.status === OcrStatus.DONE) {
            dispatch(getDocumentResultThunk(currentDocumentId));
          }
        }
      }, POLL_INTERVAL_MS);
    }
    return () => stopPolling();
  }, [currentDocumentId, status?.status, dispatch, stopPolling]);

  // Reset state khi mount — đảm bảo mỗi lần vào trang tạo mới là form trắng
  useEffect(() => {
    dispatch(resetDocumentState());
    setSelectedFile(null);
    setSelectedVendorId(null);
    setSelectedPoId(null);
    setEditVendorName("");
    setEditInvoiceNo("");
    setEditInvoiceDate("");
    setEditSubtotal(0);
    setEditTaxAmount(0);
    setEditTotal(0);
    setEditItems([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount — chỉ dừng polling
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [dispatch, stopPolling]);

  // ── File validation ──
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Chỉ chấp nhận các tệp PDF, JPG, JPEG, PNG";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Kích thước tệp không được vượt quá 10MB";
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const err = validateFile(file);
    if (err) {
      toast.error(err);
      return;
    }
    setSelectedFile(file);
    dispatch(resetDocumentState());
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await dispatch(uploadDocumentThunk(selectedFile)).unwrap();
      toast.success("Tải lên thành công, đang xử lý OCR...");
    } catch (err: any) {
      if (err?.includes?.("429") || String(err).includes("429")) {
        toast.error("Quá nhiều yêu cầu. Vui lòng thử lại sau.");
      } else {
        toast.error(err ?? "Lỗi tải tài liệu lên");
      }
    }
  };

  // ── Confirm ──
  const handleConfirm = async (overrideDuplicate: boolean) => {
    if (!currentDocumentId || !result) return;

    const vendorId =
      result.vendor_match?.matchedPartnerId ?? selectedVendorId ?? null;

    const items: ConfirmLineItem[] = editItems.map((item, idx) => ({
      product_id: result.product_matches?.[idx]?.matchedProductId ?? null,
      description: item.name,
      quantity: item.qty,
      unit_price: item.unit_price,
      tax_rate_id: null,
    }));

    const payload: ConfirmPayload = {
      vendor_id: vendorId,
      po_id: selectedPoId,
      overrideDuplicate,
      items,
    };

    try {
      const res = await dispatch(
        confirmDocumentThunk({ id: currentDocumentId, payload }),
      ).unwrap();
      toast.success("Tạo hóa đơn thành công!");
      setShowConfirmModal(false);
      navigate(`/purchase/invoices/${res.purchase_invoice_id}`);
    } catch (err: any) {
      if (String(err).includes("409")) {
        toast.error("Hóa đơn này đã được xác nhận trước đó.");
      } else if (String(err).includes("429")) {
        toast.error("Quá nhiều yêu cầu. Vui lòng thử lại sau.");
      } else {
        toast.error(err ?? "Lỗi xác nhận hóa đơn");
      }
    }
  };

  const updateItem = (idx: number, field: keyof OcrLineItem, value: any) => {
    setEditItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  const isProcessing =
    status?.status === OcrStatus.PROCESSING ||
    status?.status === OcrStatus.PENDING;
  const isDone = status?.status === OcrStatus.DONE;
  const isFailed = status?.status === OcrStatus.FAILED;

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">OCR Hóa đơn</h1>
            <p className="text-gray-600 mt-1">
              Tải hóa đơn lên để tự động trích xuất dữ liệu
            </p>
          </div>
          <button
            onClick={() => navigate("/purchase/document-intelligence/history")}
            className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Lịch sử OCR
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Step 1: Upload Zone ── */}
        {!isProcessing && !isDone && !isFailed && (
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Bước 1: Chọn tệp hóa đơn
            </h2>

            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-300 hover:border-orange-400 hover:bg-orange-50"
              }`}
            >
              <Upload className="w-10 h-10 text-orange-400 mb-3" />
              <p className="text-gray-700 font-medium">
                Kéo và thả tệp vào đây hoặc{" "}
                <span className="text-orange-500 underline">chọn tệp</span>
              </p>
              <p className="text-gray-400 text-sm mt-1">
                PDF, JPG, JPEG, PNG — tối đa 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>

            {/* Selected file info */}
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <FileText className="w-5 h-5 text-orange-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              Tải lên & Xử lý
            </button>

            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
        )}

        {/* ── Step 2: Processing ── */}
        {isProcessing && (
          <div className="bg-white rounded-xl shadow-sm border p-10 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            <p className="text-lg font-semibold text-gray-700">
              Đang xử lý OCR...
            </p>
            <p className="text-sm text-gray-500">
              Hệ thống đang trích xuất dữ liệu từ hóa đơn của bạn
            </p>
          </div>
        )}

        {/* ── Step 2: Failed ── */}
        {isFailed && (
          <div className="bg-white rounded-xl shadow-sm border p-8 flex flex-col items-center gap-4">
            <XCircle className="w-12 h-12 text-red-500" />
            <p className="text-lg font-semibold text-red-700">
              Xử lý thất bại
            </p>
            <p className="text-sm text-gray-600">
              {status?.message ?? "Có lỗi xảy ra trong quá trình xử lý OCR"}
            </p>
            <button
              onClick={() => {
                dispatch(resetDocumentState());
                setSelectedFile(null);
              }}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* ── Step 3: Review Result ── */}
        {isDone && result && (
          <div className="space-y-4">
            {/* Confidence + warnings */}
            <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  Kết quả OCR
                </h2>
                {result.document.ocr_result?.overall_confidence != null && (
                  <ConfidenceBadge
                    value={result.document.ocr_result.overall_confidence}
                  />
                )}
              </div>

              {/* Warnings */}
              {(result.document.ocr_result?.warnings?.length ?? 0) > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-1">
                  {result.document.ocr_result!.warnings.map(
                    (w: string, i: number) => (
                      <p
                        key={i}
                        className="text-sm text-yellow-800 flex items-start gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        {w}
                      </p>
                    ),
                  )}
                </div>
              )}

              {/* Vendor match */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</p>
                {result.vendor_match?.matchedPartnerId ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-800">
                      {result.vendor_match.partnerName ??
                        `Đối tác #${result.vendor_match.matchedPartnerId}`}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({Math.round(result.vendor_match.matchConfidence * 100)}%
                      — {result.vendor_match.matchMethod})
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span className="text-sm">
                        Không tìm thấy nhà cung cấp khớp — vui lòng chọn thủ công
                      </span>
                    </div>
                    <select
                      value={selectedVendorId ?? ""}
                      onChange={(e) =>
                        setSelectedVendorId(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white border-yellow-300"
                    >
                      <option value="">-- Chọn nhà cung cấp --</option>
                      {availableSuppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {!selectedVendorId && (
                      <p className="text-xs text-red-500">
                        ⚠️ Yêu cầu chọn nhà cung cấp trước khi xác nhận
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* PO selector */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Liên kết với Đơn mua hàng (PO)
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    (tùy chọn — bắt buộc đối với đối chiếu 3 bên)
                  </span>
                </p>
                {availablePOs.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    {effectiveVendorId
                      ? "Không có PO nào đang mở của nhà cung cấp này"
                      : "Chọn nhà cung cấp trước để xem các PO"}
                  </p>
                ) : (
                  <select
                    value={selectedPoId ?? ""}
                    onChange={(e) =>
                      setSelectedPoId(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white"
                  >
                    <option value="">-- No PO Link --</option>
                    {availablePOs.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.po_no}
                        {po.order_date
                          ? ` — ${new Date(po.order_date).toLocaleDateString("vi-VN")}`
                          : ""}
                        {po.total_after_tax
                          ? ` — ${Number(po.total_after_tax).toLocaleString("vi-VN")} VND`
                          : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Duplicate warning */}
              {result.duplicateWarning && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold">Cảnh báo trùng lặp!</p>
                    <p>
                      Hóa đơn{" "}
                      <strong>
                        {result.duplicateWarning.existingInvoiceNo}
                      </strong>{" "}
                      đã tồn tại trong hệ thống.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Anomaly Detection Panel */}
            {result.anomaly_result && (
              <AnomalyResultPanel anomalyResult={result.anomaly_result} />
            )}

            {/* Editable invoice fields */}
            <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">
                Thông tin hóa đơn
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên nhà cung cấp
                  </label>
                  <input
                    type="text"
                    value={editVendorName}
                    onChange={(e) => setEditVendorName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số hóa đơn
                  </label>
                  <input
                    type="text"
                    value={editInvoiceNo}
                    onChange={(e) => setEditInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày hóa đơn
                  </label>
                  <input
                    type="text"
                    value={editInvoiceDate}
                    onChange={(e) => setEditInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cộng tiền hàng
                  </label>
                  <input
                    type="number"
                    value={editSubtotal}
                    onChange={(e) => setEditSubtotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiền thuế
                  </label>
                  <input
                    type="number"
                    value={editTaxAmount}
                    onChange={(e) => setEditTaxAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tổng tiền
                  </label>
                  <input
                    type="number"
                    value={editTotal}
                    onChange={(e) => setEditTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h3 className="font-semibold text-gray-800">Danh sách mặt hàng</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-orange-50/60 border-b border-orange-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Tên mặt hàng
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">
                        Đơn giá
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {editItems.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          Không có mặt hàng nào
                        </td>
                      </tr>
                    )}
                    {editItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/40 transition-colors">
                        <td className="px-4 py-3 w-1/2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              updateItem(idx, "name", e.target.value)
                            }
                            className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-orange-500 outline-none text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-right w-28">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              updateItem(idx, "qty", Number(e.target.value))
                            }
                            className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-orange-500 outline-none text-sm text-right"
                          />
                        </td>
                        <td className="px-4 py-3 text-right w-40">
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                "unit_price",
                                Number(e.target.value),
                              )
                            }
                            className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-orange-500 outline-none text-sm text-right"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                          {(item.qty * item.unit_price).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Confirm button */}
            <div className="flex justify-end items-center gap-3">
              {!effectiveVendorId && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Chưa chọn nhà cung cấp
                </p>
              )}
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={!effectiveVendorId}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Xác nhận tạo hóa đơn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        open={showConfirmModal}
        hasDuplicate={!!result?.duplicateWarning}
        loading={loading}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
