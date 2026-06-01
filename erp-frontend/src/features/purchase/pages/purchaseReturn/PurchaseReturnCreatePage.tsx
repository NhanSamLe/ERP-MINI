import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CornerUpLeft, Package, Plus, Search, Trash2 } from "lucide-react";
import { AppDispatch, RootState } from "../../../../store/store";
import { createReturnThunk } from "../../store/purchaseReturn";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import { fetchPurchaseOrderByIdThunk } from "../../store/purchaseOrder.thunks";
import { fetchPurchaseOrdersThunk } from "../../store/purchaseOrder.thunks";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";
import { PurchaseOrderLine } from "../../store";

interface ReturnLine {
  tempId: number;
  product_id: number;
  product_name: string;
  po_line_id: number | null;
  quantity_returned: number;
  uom_id: number | null;
  uom_name: string;
  qty_in_stock_uom: number;
  unit_price: number;
  line_total: number;
  reason: string;
  condition: "good" | "damaged" | "defective";
}

const CONDITION_OPTIONS = [
  { value: "good", label: "Good" },
  { value: "damaged", label: "Damaged" },
  { value: "defective", label: "Defective" },
];

export default function PurchaseReturnCreatePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();

  const partners = useSelector((s: RootState) => s.partners);
  const { items: purchaseOrders, selectedPO } = useSelector(
    (s: RootState) => s.purchaseOrder,
  );
  const user = useSelector((s: RootState) => s.auth.user);

  const praId = searchParams.get("pra_id")
    ? Number(searchParams.get("pra_id"))
    : null;

  const [supplierId, setSupplierId] = useState<number | "">("");
  const [purchaseOrderId, setPurchaseOrderId] = useState<number | "">("");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<ReturnLine[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // For adding lines from PO
  const [showPoLines, setShowPoLines] = useState(false);

  useEffect(() => {
    dispatch(loadPartners({ type: "supplier" }));
    dispatch(fetchPurchaseOrdersThunk());
  }, [dispatch]);

  // Load PO lines when PO is selected
  useEffect(() => {
    if (!purchaseOrderId) return;
    dispatch(fetchPurchaseOrderByIdThunk(purchaseOrderId as number));
    const po = purchaseOrders.find((p) => p.id === purchaseOrderId);
    if (po?.supplier_id) setSupplierId(po.supplier_id);
  }, [purchaseOrderId, dispatch, purchaseOrders]);

  const addLineFromPO = (poLine: PurchaseOrderLine) => {
    if (lines.some((l) => l.po_line_id === poLine.id)) {
      toast.warning("Line already added");
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        tempId: Date.now(),
        product_id: poLine.product_id ?? 0,
        product_name: `Product #${poLine.product_id}`,
        po_line_id: poLine.id ?? null,
        quantity_returned: 1,
        uom_id: poLine.uom_id ?? null,
        uom_name: poLine.uom?.name ?? "—",
        qty_in_stock_uom: Number(poLine.qty_in_stock_uom ?? 0),
        unit_price: Number(poLine.unit_price ?? 0),
        line_total: Number(poLine.unit_price ?? 0),
        reason: "",
        condition: "good",
      },
    ]);
  };

  const updateLine = (tempId: number, field: string, value: any) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.tempId !== tempId) return l;
        const updated = { ...l, [field]: value };
        updated.line_total = updated.quantity_returned * updated.unit_price;
        return updated;
      }),
    );
  };

  const removeLine = (tempId: number) =>
    setLines((prev) => prev.filter((l) => l.tempId !== tempId));

  const totalAmount = lines.reduce((s, l) => s + l.line_total, 0);

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error("Supplier is required");
      return;
    }
    if (!returnDate) {
      toast.error("Return date is required");
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one product line");
      return;
    }
    for (const l of lines) {
      if (l.quantity_returned <= 0) {
        toast.error(`Quantity must be > 0`);
        return;
      }
      if (l.unit_price <= 0) {
        toast.error(`Unit price must be > 0`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const ret = await dispatch(
        createReturnThunk({
          supplier_id: supplierId as number,
          pra_id: praId,
          purchase_order_id: purchaseOrderId || null,
          return_date: returnDate,
          notes: notes.trim() || null,
          lines: lines.map((l) => ({
            product_id: l.product_id,
            po_line_id: l.po_line_id,
            quantity_returned: l.quantity_returned,
            uom_id: l.uom_id,
            unit_price: l.unit_price,
            reason: l.reason || null,
            condition: l.condition,
          })),
        } as any),
      ).unwrap();
      toast.success(`Purchase Return ${ret.return_no} created`);
      navigate(`/purchase/returns/${ret.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create Purchase Return");
    } finally {
      setSubmitting(false);
    }
  };

  const eligiblePOs = purchaseOrders.filter((po) =>
    ["confirmed", "partially_received", "completed"].includes(po.status),
  );

  const poLines: PurchaseOrderLine[] = (selectedPO as any)?.lines ?? [];

  return (
    <StandardFormLayout
      title="New Purchase Return"
      actions={[
        { label: "Cancel", variant: "outline", onClick: () => navigate(-1) },
        {
          label: "Create Return",
          variant: "primary",
          onClick: handleSubmit,
          isLoading: submitting,
        },
      ]}
    >
      {/* Header */}
      <FormSection
        title="Return Details"
        icon={<CornerUpLeft className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Purchase Order
            </label>
            <select
              value={purchaseOrderId}
              onChange={(e) =>
                setPurchaseOrderId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— Select PO (optional) —</option>
              {eligiblePOs.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.po_no}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) =>
                setSupplierId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— Select Supplier —</option>
              {partners.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Return Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Branch
            </label>
            <div className="h-9 px-3 flex items-center text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-600">
              {user?.branch?.name ?? "—"}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </FormSection>

      {/* Lines */}
      <FormSection
        title="Return Items"
        icon={<Package className="w-4 h-4" />}
        noPadding
        action={
          purchaseOrderId && poLines.length > 0 ? (
            <div className="px-5 py-3">
              <button
                type="button"
                onClick={() => setShowPoLines(!showPoLines)}
                className="inline-flex items-center gap-1 h-8 px-3 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add from PO
              </button>
            </div>
          ) : undefined
        }
      >
        {/* PO lines picker */}
        {showPoLines && poLines.length > 0 && (
          <div className="px-5 py-3 border-b border-gray-100 bg-blue-50/40">
            <p className="text-xs font-medium text-blue-700 mb-2">
              Select lines from PO to return:
            </p>
            <div className="space-y-1">
              {poLines.map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => addLineFromPO(pl)}
                  disabled={lines.some((l) => l.po_line_id === pl.id)}
                  className="w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Product #{pl.product_id} — Qty: {pl.quantity} {(pl as any).uom?.name || (pl as any).product?.uom?.name || ""} ×{" "}
                  {Number(pl.unit_price).toLocaleString("vi-VN")}
                </button>
              ))}
            </div>
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-orange-100 bg-orange-50/60">
              {[
                "#",
                "Product",
                "Qty Returned",
                "UOM",
                "Unit Price",
                "Condition",
                "Reason",
                "Line Total",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${h === "Line Total" ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  {purchaseOrderId
                    ? 'Click "Add from PO" to add lines'
                    : "Select a PO first, then add lines"}
                </td>
              </tr>
            ) : (
              lines.map((line, i) => (
                <tr key={line.tempId} className="hover:bg-gray-50/60">
                  <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {line.product_name}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={1}
                      value={line.quantity_returned}
                      onChange={(e) =>
                        updateLine(
                          line.tempId,
                          "quantity_returned",
                          Math.max(1, Number(e.target.value)),
                        )
                      }
                      className="w-20 h-7 px-2 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {line.uom_name}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      value={line.unit_price}
                      onChange={(e) =>
                        updateLine(
                          line.tempId,
                          "unit_price",
                          Number(e.target.value),
                        )
                      }
                      className="w-28 h-7 px-2 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={line.condition}
                      onChange={(e) =>
                        updateLine(line.tempId, "condition", e.target.value)
                      }
                      className="h-7 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {CONDITION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={line.reason}
                      onChange={(e) =>
                        updateLine(line.tempId, "reason", e.target.value)
                      }
                      placeholder="Reason..."
                      className="w-32 h-7 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    {line.line_total.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(line.tempId)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {lines.length > 0 && (
            <tfoot className="border-t border-gray-200 bg-gray-50/50">
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-2 text-right text-sm font-bold text-gray-800"
                >
                  Total Return Amount
                </td>
                <td className="px-4 py-2 text-right text-base font-bold text-orange-600">
                  {totalAmount.toLocaleString("vi-VN")}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </FormSection>
    </StandardFormLayout>
  );
}
