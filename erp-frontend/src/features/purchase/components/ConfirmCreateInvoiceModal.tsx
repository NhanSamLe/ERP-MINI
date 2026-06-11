import { useEffect, useState } from "react";
import {
  X,
  FileText,
  AlertTriangle,
  Info,
  Package,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Hash,
  Receipt,
} from "lucide-react";
import { PurchaseOrder } from "../store/purchaseOrder.types";
import {
  purchaseOrderApi,
  PoInvoiceSummaryLine,
} from "../api/purchaseOrder.api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectedLine {
  po_line_id: number;
  quantity: number;
  checked: boolean;
}

export interface InvoiceMetadata {
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  invoice_series?: string;
  invoice_template?: string;
  tax_code?: string;
}

interface Props {
  open: boolean;
  po: PurchaseOrder | null;
  onCancel: () => void;
  onConfirmPartial: (
    lines: Array<{ po_line_id: number; quantity: number }>,
    metadata: InvoiceMetadata,
  ) => void;
  loading?: boolean;
}

const fmt = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 0 });

const plusDays = (days: number, baseDateStr?: string) => {
  const d = baseDateStr ? new Date(baseDateStr) : new Date();
  if (isNaN(d.getTime())) return baseDateStr || "";
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};
const genInvoiceNo = () => `AP-${new Date().getFullYear()}-${Date.now()}`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConfirmCreateInvoiceModal({
  open,
  po,
  onCancel,
  onConfirmPartial,
  loading = false,
}: Props) {
  // Step 1 = chọn lines, Step 2 = nhập metadata
  const [step, setStep] = useState<1 | 2>(1);

  const [summaryLines, setSummaryLines] = useState<PoInvoiceSummaryLine[]>([]);
  const [selectedLines, setSelectedLines] = useState<SelectedLine[]>([]);
  const [fetchingLines, setFetchingLines] = useState(false);
  const [showLines, setShowLines] = useState(true);

  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const [meta, setMeta] = useState<InvoiceMetadata>({
    invoice_no: genInvoiceNo(),
    invoice_date: getTodayStr(),
    due_date: plusDays(30),
    invoice_series: "",
    invoice_template: "",
    tax_code: "",
  });

  // Reset khi mở lại hoặc PO thay đổi
  useEffect(() => {
    if (open) {
      setStep(1);
      const termDays = po?.paymentTerm?.days ?? 30;
      const todayStr = getTodayStr();
      setMeta({
        invoice_no: genInvoiceNo(),
        invoice_date: todayStr,
        due_date: plusDays(termDays, todayStr),
        invoice_series: "",
        invoice_template: "",
        tax_code: "",
      });
    }
  }, [open, po]);

  // Fetch line summary khi chọn PO
  useEffect(() => {
    if (!open || !po) return;
    setFetchingLines(true);
    purchaseOrderApi
      .getPoInvoiceSummary(po.id)
      .then((summary) => {
        setSummaryLines(summary.lines);
        setSelectedLines(
          summary.lines.map((l) => ({
            po_line_id: l.po_line_id,
            quantity: l.remaining_qty,
            checked: l.remaining_qty > 0,
          })),
        );
      })
      .catch(() => {
        setSummaryLines([]);
        setSelectedLines([]);
      })
      .finally(() => setFetchingLines(false));
  }, [open, po]);

  if (!open || !po) return null;

  const poTotal = Number(po.total_after_tax ?? 0);
  const invoiced = Number(po.invoiced_amount ?? 0);
  const invoiceCount = po.invoice_count ?? 0;
  const isPartialHistory = invoiceCount > 0;

  const thisInvoiceTotal = selectedLines.reduce((sum, sel) => {
    if (!sel.checked || sel.quantity <= 0) return sum;
    const line = summaryLines.find((l) => l.po_line_id === sel.po_line_id);
    if (!line) return sum;
    const lineTotal = sel.quantity * line.unit_price;
    const taxRate = line.tax_rate_id ? 0.1 : 0;
    return sum + lineTotal * (1 + taxRate);
  }, 0);

  const checkedCount = selectedLines.filter(
    (s) => s.checked && s.quantity > 0,
  ).length;
  const canGoNext = checkedCount > 0 && !fetchingLines;
  const canSubmit =
    meta.invoice_no.trim() !== "" && meta.invoice_date !== "" && !loading;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleToggleLine = (po_line_id: number) =>
    setSelectedLines((prev) =>
      prev.map((s) =>
        s.po_line_id === po_line_id ? { ...s, checked: !s.checked } : s,
      ),
    );

  const handleQtyChange = (po_line_id: number, val: string) => {
    const num = parseFloat(val);
    setSelectedLines((prev) =>
      prev.map((s) =>
        s.po_line_id === po_line_id
          ? { ...s, quantity: isNaN(num) ? 0 : num }
          : s,
      ),
    );
  };

  const handleSelectAll = () => {
    const allChecked = selectedLines.every((s) => s.checked);
    setSelectedLines((prev) =>
      prev.map((s) => ({ ...s, checked: !allChecked })),
    );
  };

  const handleConfirm = () => {
    const lines = selectedLines
      .filter((s) => s.checked && s.quantity > 0)
      .map((s) => ({ po_line_id: s.po_line_id, quantity: s.quantity }));
    onConfirmPartial(lines, meta);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-orange-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                Tạo hóa đơn AP
              </h3>
              <p className="text-xs text-gray-500">
                {po.po_no} · {po.supplier?.name}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mr-8">
            <StepDot
              active={step === 1}
              done={step === 2}
              label="1"
              text="Chọn dòng"
            />
            <div className="w-8 h-px bg-gray-300" />
            <StepDot
              active={step === 2}
              done={false}
              label="2"
              text="Thông tin"
            />
          </div>

          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* ══ STEP 1: Select Lines ══ */}
          {step === 1 && (
            <>
              {/* PO amount summary */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Tổng tiền PO</span>
                  <span className="font-semibold text-gray-900">
                    {fmt(poTotal)} VND
                  </span>
                </div>
                {isPartialHistory && (
                  <>
                    <div className="flex justify-between text-blue-600">
                      <span>
                        Đã xuất hóa đơn ({invoiceCount} hóa đơn)
                      </span>
                      <span className="font-semibold">{fmt(invoiced)} VND</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-orange-400"
                        style={{
                          width: `${Math.min(Math.round((invoiced / poTotal) * 100), 100)}%`,
                        }}
                      />
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-orange-600 text-base border-t pt-2">
                  <span>Hóa đơn này</span>
                  <span>{fmt(thisInvoiceTotal)} VND</span>
                </div>
              </div>

              {/* Info banner */}
              {isPartialHistory ? (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Chọn các dòng và số lượng bạn muốn xuất hóa đơn trong đợt giao hàng này.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-gray-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                  <span>
                    Bạn có thể xuất hóa đơn cho tất cả các dòng cùng một lúc hoặc chọn các dòng cụ thể cho đợt giao hàng một phần.
                  </span>
                </div>
              )}

              {/* Lines table */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b cursor-pointer select-none"
                  onClick={() => setShowLines((v) => !v)}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-sm text-gray-700">
                      Các dòng PO
                    </span>
                    {!fetchingLines && (
                      <span className="text-xs text-gray-400">
                        (đã chọn {checkedCount}/{summaryLines.length})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {!fetchingLines && summaryLines.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAll();
                        }}
                        className="text-xs text-orange-600 hover:underline font-medium"
                      >
                        {selectedLines.every((s) => s.checked)
                          ? "Bỏ chọn tất cả"
                          : "Chọn tất cả"}
                      </button>
                    )}
                    {showLines ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {showLines && (
                  <>
                    {fetchingLines ? (
                      <div className="flex items-center justify-center py-10 gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Đang tải dữ liệu dòng...</span>
                      </div>
                    ) : summaryLines.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-400">
                        Không có dòng nào khả dụng
                      </div>
                    ) : (
                      <div className="divide-y">
                        {summaryLines.map((line) => {
                          const sel = selectedLines.find(
                            (s) => s.po_line_id === line.po_line_id,
                          );
                          const isFullyInvoiced = line.remaining_qty <= 0;
                          const isChecked = sel?.checked ?? false;
                          const qty = sel?.quantity ?? 0;
                          const lineAmt = qty * line.unit_price;

                          return (
                            <div
                              key={line.po_line_id}
                              className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                                isFullyInvoiced
                                  ? "opacity-40 bg-gray-50"
                                  : isChecked
                                    ? "bg-orange-50/40"
                                    : "hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isFullyInvoiced}
                                onChange={() =>
                                  handleToggleLine(line.po_line_id)
                                }
                                className="w-4 h-4 accent-orange-500 cursor-pointer flex-shrink-0"
                              />
                              {/* Product image + info */}
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                {/* Thumbnail */}
                                {line.product_image ? (
                                  <img
                                    src={line.product_image}
                                    alt={line.product_name ?? ""}
                                    className="w-9 h-9 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                    <Package className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900 truncate">
                                      {line.product_name
                                        ? line.product_name
                                        : line.product_id
                                          ? `Sản phẩm #${line.product_id}`
                                          : `Dòng #${line.po_line_id}`}
                                    </span>
                                    {isFullyInvoiced && (
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 flex-shrink-0">
                                        Đã xuất hóa đơn hết
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
                                    <span>
                                      SL đặt: <strong>{line.quantity}</strong>
                                    </span>
                                    {line.invoiced_qty > 0 && (
                                      <span className="text-blue-600">
                                        Đã xuất:{" "}
                                        <strong>{line.invoiced_qty}</strong>
                                      </span>
                                    )}
                                    <span className="text-orange-600">
                                      Còn lại:{" "}
                                      <strong>{line.remaining_qty}</strong>
                                    </span>
                                    <span>@ {fmt(line.unit_price)} VND</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <input
                                  type="number"
                                  min={0.001}
                                  max={line.remaining_qty}
                                  step="any"
                                  value={qty || ""}
                                  disabled={!isChecked || isFullyInvoiced}
                                  onChange={(e) =>
                                    handleQtyChange(
                                      line.po_line_id,
                                      e.target.value,
                                    )
                                  }
                                  className="w-24 px-2 py-1.5 border rounded-lg text-sm text-right focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                  placeholder="SL"
                                />
                                <span className="text-xs text-gray-500 w-28 text-right">
                                  {isChecked && qty > 0
                                    ? `${fmt(lineAmt)} VND`
                                    : "—"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* ══ STEP 2: Invoice Details ══ */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Summary chip */}
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm">
                <span className="text-gray-600">
                  Đã chọn <strong className="text-orange-600">{checkedCount}</strong> dòng
                </span>
                <span className="font-bold text-orange-600">
                  {fmt(thisInvoiceTotal)} VND
                </span>
              </div>

              {/* Required fields */}
              <div className="space-y-4">
                <SectionLabel
                  icon={<Receipt className="w-4 h-4" />}
                  text="Thông tin hóa đơn"
                  required
                />

                <div className="grid grid-cols-1 gap-4">
                  {/* Invoice No */}
                  <FormField
                    label="Số hóa đơn"
                    required
                    hint="Mã hóa đơn duy nhất"
                  >
                    <input
                      type="text"
                      value={meta.invoice_no}
                      onChange={(e) =>
                        setMeta((p) => ({ ...p, invoice_no: e.target.value }))
                      }
                      placeholder="VD: AP-2026-001"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Invoice Date */}
                    <FormField
                      label="Ngày hóa đơn"
                      required
                      icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />}
                    >
                      <input
                        type="date"
                        value={meta.invoice_date}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          const termDays = po?.paymentTerm?.days ?? 30;
                          setMeta((p) => ({
                            ...p,
                            invoice_date: newDate,
                            due_date: plusDays(termDays, newDate),
                          }));
                        }}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                      />
                    </FormField>

                    {/* Due Date */}
                    <FormField
                      label="Hạn thanh toán"
                      icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />}
                    >
                      <input
                        type="date"
                        value={meta.due_date}
                        onChange={(e) =>
                          setMeta((p) => ({ ...p, due_date: e.target.value }))
                        }
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Optional fields */}
              <div className="space-y-4">
                <SectionLabel
                  icon={<Hash className="w-4 h-4" />}
                  text="Thuế & Tham chiếu (Tùy chọn)"
                />

                <div className="grid grid-cols-3 gap-4">
                  {/* Invoice Series */}
                  <FormField label="Ký hiệu hóa đơn" hint="VD: AA/24E">
                    <input
                      type="text"
                      value={meta.invoice_series ?? ""}
                      onChange={(e) =>
                        setMeta((p) => ({
                          ...p,
                          invoice_series: e.target.value,
                        }))
                      }
                      placeholder="AA/24E"
                      maxLength={20}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                    />
                  </FormField>

                  {/* Invoice Template */}
                  <FormField label="Mẫu số hóa đơn" hint="VD: 01GTKT">
                    <input
                      type="text"
                      value={meta.invoice_template ?? ""}
                      onChange={(e) =>
                        setMeta((p) => ({
                          ...p,
                          invoice_template: e.target.value,
                        }))
                      }
                      placeholder="01GTKT"
                      maxLength={20}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                    />
                  </FormField>

                  {/* Tax Code */}
                  <FormField label="Mã số thuế" hint="MST nhà cung cấp">
                    <input
                      type="text"
                      value={meta.tax_code ?? ""}
                      onChange={(e) =>
                        setMeta((p) => ({ ...p, tax_code: e.target.value }))
                      }
                      placeholder="0123456789"
                      maxLength={20}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                    />
                  </FormField>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50 flex-shrink-0">
          {step === 1 ? (
            <>
              <div className="text-sm text-gray-600">
                {checkedCount > 0 ? (
                  <span>
                    Đã chọn <strong className="text-orange-600">{checkedCount}</strong> dòng ·{" "}
                    <strong className="text-orange-600">
                      {fmt(thisInvoiceTotal)}
                    </strong>{" "}
                    VND
                  </span>
                ) : (
                  <span className="text-gray-400">Chưa chọn dòng nào</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-white transition"
                >
                  Hủy
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canGoNext}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition disabled:opacity-40 flex items-center gap-2"
                >
                  Tiếp theo: Chi tiết hóa đơn
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại chọn dòng
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-white transition disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!canSubmit}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition disabled:opacity-40 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Đang tạo..." : "Tạo hóa đơn"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function StepDot({
  active,
  done,
  label,
  text,
}: {
  active: boolean;
  done: boolean;
  label: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
          done
            ? "bg-green-500 text-white"
            : active
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-500"
        }`}
      >
        {done ? "✓" : label}
      </div>
      <span
        className={`text-[10px] font-medium ${active ? "text-orange-600" : "text-gray-400"}`}
      >
        {text}
      </span>
    </div>
  );
}

function SectionLabel({
  icon,
  text,
  required,
}: {
  icon: React.ReactNode;
  text: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
      <span className="text-gray-400">{icon}</span>
      <span className="text-sm font-semibold text-gray-700">{text}</span>
      {required && (
        <span className="text-xs text-red-400 ml-auto">* Required</span>
      )}
    </div>
  );
}

function FormField({
  label,
  required,
  hint,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {icon && <span className="inline mr-1">{icon}</span>}
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && (
          <span className="text-xs text-gray-400 font-normal ml-1.5">
            — {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
