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
        Confidence: {pct}%
      </span>
    );
  if (value >= 0.6)
    return (
      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
        Confidence: {pct}%
      </span>
    );
  return (
    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
      Confidence: {pct}%
    </span>
  );
}

/* ─── Anomaly Result Panel ─── */
function formatFlagType(type: string): string {
  const map: Record<string, string> = {
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

function SeverityBadge({ severity }: { severity: AnomalySeverity }) {
  const config: Record<
    AnomalySeverity,
    { bg: string; text: string; label: string }
  > = {
    critical: { bg: "bg-red-100", text: "text-red-700", label: "Critical" },
    high: { bg: "bg-orange-100", text: "text-orange-700", label: "High" },
    medium: { bg: "bg-amber-100", text: "text-amber-700", label: "Medium" },
    low: { bg: "bg-gray-100", text: "text-gray-600", label: "Low" },
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
      high_risk: { bg: "bg-red-100", text: "text-red-700", label: "High Risk" },
      medium_risk: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "Medium Risk",
      },
      low_risk: {
        bg: "bg-green-100",
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

interface AnomalyResultPanelProps {
  anomalyResult: AnomalyResult;
  warnings?: string[];
}

function AnomalyResultPanel({
  anomalyResult,
  warnings,
}: AnomalyResultPanelProps) {
  const [flagsExpanded, setFlagsExpanded] = useState(false);
  const isHighRisk =
    anomalyResult.risk_level === "high_risk" ||
    warnings?.includes("high_risk_anomaly");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-gray-800">
            Anomaly Detection
          </span>
        </div>
        <div className="flex items-center gap-2">
          <RiskLevelBadge level={anomalyResult.risk_level} />
          <span className="text-xs text-gray-500">
            Score:{" "}
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
              Manual Review Required
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              This invoice has been flagged as high risk and requires manual
              review before approval.
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
              Math consistent — totals verified
            </span>
          </>
        ) : (
          <>
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-red-700">
              Math inconsistency detected — totals do not match
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
            {anomalyResult.flags.length} anomaly flag
            {anomalyResult.flags.length !== 1 ? "s" : ""} detected
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
                          (line {flag.lineItemIndex + 1})
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
        <p className="text-xs text-gray-500">No anomaly flags detected.</p>
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
          Confirm Invoice Creation
        </h2>
        <p className="text-gray-600 text-sm">
          The system will create an AP Invoice from the OCR result. Are you sure
          you want to continue?
        </p>

        {hasDuplicate && (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">Duplicate Invoice Detected!</p>
              <p>An invoice with this number already exists in the system.</p>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={override}
                  onChange={(e) => setOverride(e.target.checked)}
                  className="rounded"
                />
                <span>Override duplicate invoice</span>
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
            Cancel
          </button>
          <button
            onClick={() => onConfirm(override)}
            disabled={loading || (hasDuplicate && !override)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm
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

  // Cleanup on unmount — chỉ dừng polling, không reset state
  // (để "Xem kết quả" từ trang lịch sử vẫn hiển thị được)
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [dispatch, stopPolling]);

  // ── File validation ──
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only PDF, JPG, JPEG, PNG files are accepted";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size cannot exceed 10MB";
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
      toast.success("Upload successful, processing OCR...");
    } catch (err: any) {
      if (err?.includes?.("429") || String(err).includes("429")) {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error(err ?? "Error uploading document");
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
      toast.success("Invoice created successfully!");
      setShowConfirmModal(false);
      navigate(`/purchase/invoices/${res.purchase_invoice_id}`);
    } catch (err: any) {
      if (String(err).includes("409")) {
        toast.error("Invoice has already been confirmed.");
      } else if (String(err).includes("429")) {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error(err ?? "Error confirming invoice");
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
            <h1 className="text-3xl font-bold text-gray-900">Invoice OCR</h1>
            <p className="text-gray-600 mt-1">
              Upload invoices to automatically extract data
            </p>
          </div>
          <button
            onClick={() => navigate("/purchase/document-intelligence/history")}
            className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            OCR History
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Step 1: Upload Zone ── */}
        {!isProcessing && !isDone && !isFailed && (
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Step 1: Select Invoice File
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
                Drag and drop file here or{" "}
                <span className="text-orange-500 underline">select file</span>
              </p>
              <p className="text-gray-400 text-sm mt-1">
                PDF, JPG, JPEG, PNG — max 10MB
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
              Upload & Process
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
              Processing OCR...
            </p>
            <p className="text-sm text-gray-500">
              The system is extracting data from your invoice
            </p>
          </div>
        )}

        {/* ── Step 2: Failed ── */}
        {isFailed && (
          <div className="bg-white rounded-xl shadow-sm border p-8 flex flex-col items-center gap-4">
            <XCircle className="w-12 h-12 text-red-500" />
            <p className="text-lg font-semibold text-red-700">
              Processing Failed
            </p>
            <p className="text-sm text-gray-600">
              {status?.message ?? "An error occurred during OCR processing"}
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
                  OCR Result
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
                <p className="text-sm font-medium text-gray-700 mb-1">Vendor</p>
                {result.vendor_match?.matchedPartnerId ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-800">
                      {result.vendor_match.partnerName ??
                        `Partner #${result.vendor_match.matchedPartnerId}`}
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
                        No matching vendor found — please select manually
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
                      <option value="">-- Select Vendor --</option>
                      {availableSuppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {!selectedVendorId && (
                      <p className="text-xs text-red-500">
                        ⚠️ Vendor selection is required before confirming
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* PO selector */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Link to Purchase Order (PO)
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    (optional — required for 3-way matching)
                  </span>
                </p>
                {availablePOs.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    {effectiveVendorId
                      ? "No open POs for this vendor"
                      : "Select vendor first to view POs"}
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
                          ? ` — ${new Date(po.order_date).toLocaleDateString("en-US")}`
                          : ""}
                        {po.total_after_tax
                          ? ` — ${Number(po.total_after_tax).toLocaleString("en-US")} VND`
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
              <AnomalyResultPanel
                anomalyResult={result.anomaly_result}
                warnings={result.warnings}
              />
            )}

            {/* Editable invoice fields */}
            <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">
                Invoice Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Name
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
                    Invoice Number
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
                    Invoice Date
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
                    Subtotal
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
                    Tax Amount
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
                    Total
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
                <h3 className="font-semibold text-gray-800">Line Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-orange-50/60 border-b border-orange-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">
                        Amount
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
                          No line items
                        </td>
                      </tr>
                    )}
                    {editItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/40 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              updateItem(idx, "name", e.target.value)
                            }
                            className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-orange-500 outline-none text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              updateItem(idx, "qty", Number(e.target.value))
                            }
                            className="w-24 px-2 py-1 border rounded focus:ring-1 focus:ring-orange-500 outline-none text-sm text-right"
                          />
                        </td>
                        <td className="px-4 py-3">
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
                            className="w-32 px-2 py-1 border rounded focus:ring-1 focus:ring-orange-500 outline-none text-sm text-right"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
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
