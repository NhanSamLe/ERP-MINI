import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CornerUpLeft, FileText } from "lucide-react";
import { AppDispatch, RootState } from "../../../../store/store";
import { createPraThunk } from "../../store/purchaseReturn";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import { fetchPurchaseOrdersThunk } from "../../store/purchaseOrder.thunks";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";

const RETURN_TYPE_OPTIONS = [
  { value: "debit_note", label: "Debit Note (Trừ công nợ)" },
  { value: "refund", label: "Refund (NCC hoàn tiền)" },
  { value: "replacement", label: "Replacement (Đổi hàng)" },
];

export default function PraCreatePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();

  const partners = useSelector((s: RootState) => s.partners);
  const { items: purchaseOrders } = useSelector(
    (s: RootState) => s.purchaseOrder,
  );
  const user = useSelector((s: RootState) => s.auth.user);

  // Form fields
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [purchaseOrderId, setPurchaseOrderId] = useState<number | "">(
    searchParams.get("po_id") ? Number(searchParams.get("po_id")) : "",
  );
  const [apInvoiceId] = useState<number | "">("");
  const [returnType, setReturnType] = useState<
    "debit_note" | "refund" | "replacement"
  >("debit_note");
  const [reason, setReason] = useState("");
  const [totalReturnAmount, setTotalReturnAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(loadPartners({ type: "supplier" }));
    dispatch(fetchPurchaseOrdersThunk());
  }, [dispatch]);

  // Auto-fill supplier when PO is selected
  useEffect(() => {
    if (!purchaseOrderId) return;
    const po = purchaseOrders.find((p) => p.id === purchaseOrderId);
    if (po?.supplier_id) setSupplierId(po.supplier_id);
  }, [purchaseOrderId, purchaseOrders]);

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error("Supplier is required");
      return;
    }
    if (!purchaseOrderId) {
      toast.error("Purchase Order is required");
      return;
    }
    if (!reason.trim()) {
      toast.error("Return reason is required");
      return;
    }
    if (!totalReturnAmount || Number(totalReturnAmount) <= 0) {
      toast.error("Total return amount must be > 0");
      return;
    }

    setSubmitting(true);
    try {
      const pra = await dispatch(
        createPraThunk({
          supplier_id: supplierId as number,
          purchase_order_id: purchaseOrderId as number,
          ap_invoice_id: apInvoiceId || null,
          return_type: returnType,
          reason: reason.trim(),
          total_return_amount: Number(totalReturnAmount),
          notes: notes.trim() || null,
        } as any),
      ).unwrap();
      toast.success(`PRA ${pra.pra_no} created`);
      navigate(`/purchase/return-authorizations/${pra.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create PRA");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter POs to confirmed/partially_received/completed only
  const eligiblePOs = purchaseOrders.filter((po) =>
    ["confirmed", "partially_received", "completed"].includes(po.status),
  );

  return (
    <StandardFormLayout
      title="New Return Authorization (PRA)"
      actions={[
        {
          label: "Cancel",
          variant: "outline",
          onClick: () => navigate("/purchase/return-authorizations"),
        },
        {
          label: "Create PRA",
          variant: "primary",
          onClick: handleSubmit,
          isLoading: submitting,
        },
      ]}
    >
      <FormSection
        title="Return Authorization Details"
        icon={<CornerUpLeft className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Purchase Order */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Purchase Order <span className="text-red-500">*</span>
            </label>
            <select
              value={purchaseOrderId}
              onChange={(e) =>
                setPurchaseOrderId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— Select Purchase Order —</option>
              {eligiblePOs.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.po_no} — {po.status}
                </option>
              ))}
            </select>
            {purchaseOrders.length > 0 && eligiblePOs.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No confirmed POs available. PO must be
                confirmed/received/completed.
              </p>
            )}
          </div>

          {/* Supplier */}
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

          {/* Return Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Return Type <span className="text-red-500">*</span>
            </label>
            <select
              value={returnType}
              onChange={(e) => setReturnType(e.target.value as any)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {RETURN_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Total Return Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Total Return Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={totalReturnAmount}
              onChange={(e) =>
                setTotalReturnAmount(
                  e.target.value ? Number(e.target.value) : "",
                )
              }
              placeholder="0"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Branch (read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Branch
            </label>
            <div className="h-9 px-3 flex items-center text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-600">
              {user?.branch?.name ?? "—"}
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Return Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the reason for return..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Notes */}
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Notes <span className="text-gray-400">(optional)</span>
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

      {/* Info box */}
      <FormSection
        title="What happens next?"
        icon={<FileText className="w-4 h-4" />}
      >
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span>
              PRA created as <strong>Draft</strong> — you can review before
              submitting
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span>Submit for approval → Purchase Manager reviews</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span>
              Once approved → create Purchase Return to physically return goods
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              4
            </span>
            <span>Accountant creates AP Debit Note to adjust payables</span>
          </li>
        </ol>
      </FormSection>
    </StandardFormLayout>
  );
}
