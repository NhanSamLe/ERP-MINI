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
} from "../../store/documentIntelligence/documentIntelligence.types";
import { documentIntelligenceApi } from "../../api/documentIntelligence.api";

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
          Hệ thống sẽ tạo hóa đơn mua hàng (AP Invoice) từ kết quả OCR. Bạn có
          chắc chắn muốn tiếp tục?
        </p>

        {hasDuplicate && (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">Phát hiện hóa đơn trùng lặp!</p>
              <p>Hóa đơn với số này đã tồn tại trong hệ thống.</p>
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

  // Load POs when vendor is matched
  useEffect(() => {
    if (result?.vendor_match?.matchedPartnerId) {
      documentIntelligenceApi
        .getPurchaseOrdersForVendor(result.vendor_match.matchedPartnerId)
        .then(setAvailablePOs)
        .catch(() => setAvailablePOs([]));
    } else {
      setAvailablePOs([]);
      setSelectedPoId(null);
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
      (status?.status === "processing" || status?.status === "pending")
    ) {
      stopPolling();
      pollRef.current = setInterval(async () => {
        const result = await dispatch(
          pollDocumentStatusThunk(currentDocumentId),
        ).unwrap();
        if (result.status === "done" || result.status === "failed") {
          stopPolling();
          if (result.status === "done") {
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
      return "Chỉ chấp nhận file PDF, JPG, JPEG, PNG";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File không được vượt quá 10MB";
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
        toast.error(err ?? "Lỗi tải lên tài liệu");
      }
    }
  };

  // ── Confirm ──
  const handleConfirm = async (overrideDuplicate: boolean) => {
    if (!currentDocumentId || !result) return;

    const vendorId = result.vendor_match?.matchedPartnerId ?? null;

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
        toast.error("Hóa đơn đã được xác nhận trước đó.");
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
    status?.status === "processing" || status?.status === "pending";
  const isDone = status?.status === "done";
  const isFailed = status?.status === "failed";

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">OCR Hóa Đơn</h1>
            <p className="text-gray-600 mt-1">
              Tải lên hóa đơn để trích xuất dữ liệu tự động
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
                Kéo thả tệp vào đây hoặc{" "}
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
            <p className="text-lg font-semibold text-red-700">Xử lý thất bại</p>
            <p className="text-sm text-gray-600">
              {status?.message ?? "Đã xảy ra lỗi trong quá trình OCR"}
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
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Nhà cung cấp
                </p>
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
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">
                      Không tìm thấy nhà cung cấp phù hợp
                    </span>
                  </div>
                )}
              </div>

              {/* PO selector */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Liên kết với Đơn mua hàng (PO)
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    (tùy chọn — cần để chạy 3-way matching)
                  </span>
                </p>
                {availablePOs.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    {result.vendor_match?.matchedPartnerId
                      ? "Không có PO nào đang mở cho nhà cung cấp này"
                      : "Cần match nhà cung cấp trước để xem PO"}
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
                    <option value="">-- Không liên kết PO --</option>
                    {availablePOs.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.po_no}
                        {po.order_date
                          ? ` — ${new Date(po.order_date).toLocaleDateString("vi-VN")}`
                          : ""}
                        {po.total_after_tax
                          ? ` — ${Number(po.total_after_tax).toLocaleString("vi-VN")} VNĐ`
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

            {/* Editable invoice fields */}
            <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">Thông tin hóa đơn</h3>
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
                    Tiền trước thuế
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
                    Tổng cộng
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
                <h3 className="font-semibold text-gray-800">
                  Chi tiết hàng hóa
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Tên hàng
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
                          Không có dòng hàng hóa
                        </td>
                      </tr>
                    )}
                    {editItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
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
            <div className="flex justify-end">
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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
