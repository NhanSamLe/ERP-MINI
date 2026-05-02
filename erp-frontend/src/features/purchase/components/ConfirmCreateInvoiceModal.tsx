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
} from "lucide-react";
import { PurchaseOrder } from "../store/purchaseOrder.types";
import {
  purchaseOrderApi,
  PoInvoiceSummaryLine,
} from "../api/purchaseOrder.api";

/* ─── Types ─── */
interface SelectedLine {
  po_line_id: number;
  quantity: number;
  checked: boolean;
}

interface Props {
  open: boolean;
  po: PurchaseOrder | null;
  onCancel: () => void;
  /** Called with selected lines for partial invoice */
  onConfirmPartial: (
    lines: Array<{ po_line_id: number; quantity: number }>,
  ) => void;
  loading?: boolean;
}

const fmt = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 0 });

/* ─── Component ─── */
export default function ConfirmCreateInvoiceModal({
  open,
  po,
  onCancel,
  onConfirmPartial,
  loading = false,
}: Props) {
  const [summaryLines, setSummaryLines] = useState<PoInvoiceSummaryLine[]>([]);
  const [selectedLines, setSelectedLines] = useState<SelectedLine[]>([]);
  const [fetchingLines, setFetchingLines] = useState(false);
  const [showLines, setShowLines] = useState(true);

  // Fetch line summary when PO is selected
  useEffect(() => {
    if (!open || !po) return;
    setFetchingLines(true);
    purchaseOrderApi
      .getPoInvoiceSummary(po.id)
      .then((summary) => {
        setSummaryLines(summary.lines);
        // Pre-select all lines with remaining qty > 0, default qty = remaining
        setSelectedLines(
          summary.lines.map((l) => ({
            po_line_id: l.po_line_id,
            quantity: l.remaining_qty,
            checked: l.remaining_qty > 0,
          })),
        );
      })
      .catch(() => {
        // Fallback: use PO lines if available
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

  // Calculate this invoice total from selected lines
  const thisInvoiceTotal = selectedLines.reduce((sum, sel) => {
    if (!sel.checked || sel.quantity <= 0) return sum;
    const line = summaryLines.find((l) => l.po_line_id === sel.po_line_id);
    if (!line) return sum;
    const lineTotal = sel.quantity * line.unit_price;
    const taxRate = line.tax_rate_id ? 0.1 : 0; // simplified; backend recalculates
    return sum + lineTotal * (1 + taxRate);
  }, 0);

  const checkedCount = selectedLines.filter(
    (s) => s.checked && s.quantity > 0,
  ).length;
  const canSubmit = checkedCount > 0 && !loading && !fetchingLines;

  const handleToggleLine = (po_line_id: number) => {
    setSelectedLines((prev) =>
      prev.map((s) =>
        s.po_line_id === po_line_id ? { ...s, checked: !s.checked } : s,
      ),
    );
  };

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
    onConfirmPartial(lines);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-orange-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                Create AP Invoice
              </h3>
              <p className="text-xs text-gray-500">
                {po.po_no} · {po.supplier?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* PO amount summary */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>PO Total</span>
              <span className="font-semibold text-gray-900">
                {fmt(poTotal)} VND
              </span>
            </div>
            {isPartialHistory && (
              <>
                <div className="flex justify-between text-blue-600">
                  <span>
                    Already Invoiced ({invoiceCount} invoice
                    {invoiceCount > 1 ? "s" : ""})
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
              <span>This Invoice</span>
              <span>{fmt(thisInvoiceTotal)} VND</span>
            </div>
          </div>

          {/* Info banner */}
          {isPartialHistory ? (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Select the lines and quantities you want to invoice in this
                delivery.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-gray-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
              <span>
                You can invoice all lines at once or select specific lines for
                partial delivery.
              </span>
            </div>
          )}

          {/* Lines table */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            {/* Table header */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b cursor-pointer select-none"
              onClick={() => setShowLines((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-sm text-gray-700">
                  PO Lines
                </span>
                {!fetchingLines && (
                  <span className="text-xs text-gray-400">
                    ({checkedCount}/{summaryLines.length} selected)
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
                      ? "Deselect All"
                      : "Select All"}
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
                    <span className="text-sm">Loading lines...</span>
                  </div>
                ) : summaryLines.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    No lines available
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
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isFullyInvoiced}
                            onChange={() => handleToggleLine(line.po_line_id)}
                            className="w-4 h-4 accent-orange-500 cursor-pointer flex-shrink-0"
                          />

                          {/* Line info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {line.product_id
                                  ? `Product #${line.product_id}`
                                  : `Line #${line.po_line_id}`}
                              </span>
                              {isFullyInvoiced && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">
                                  Fully Invoiced
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
                              <span>
                                PO qty: <strong>{line.quantity}</strong>
                              </span>
                              {line.invoiced_qty > 0 && (
                                <span className="text-blue-600">
                                  Invoiced: <strong>{line.invoiced_qty}</strong>
                                </span>
                              )}
                              <span className="text-orange-600">
                                Remaining: <strong>{line.remaining_qty}</strong>
                              </span>
                              <span>@ {fmt(line.unit_price)} VND</span>
                            </div>
                          </div>

                          {/* Qty input */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <input
                              type="number"
                              min={0.001}
                              max={line.remaining_qty}
                              step="any"
                              value={qty || ""}
                              disabled={!isChecked || isFullyInvoiced}
                              onChange={(e) =>
                                handleQtyChange(line.po_line_id, e.target.value)
                              }
                              className="w-24 px-2 py-1.5 border rounded-lg text-sm text-right focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                              placeholder="Qty"
                            />
                            {/* Line amount preview */}
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
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            {checkedCount > 0 ? (
              <span>
                <strong className="text-orange-600">{checkedCount}</strong> line
                {checkedCount > 1 ? "s" : ""} ·{" "}
                <strong className="text-orange-600">
                  {fmt(thisInvoiceTotal)}
                </strong>{" "}
                VND
              </span>
            ) : (
              <span className="text-gray-400">No lines selected</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canSubmit}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition disabled:opacity-40 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
