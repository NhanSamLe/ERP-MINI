import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CornerUpLeft, FileText, ArrowLeft } from "lucide-react";
import { AppDispatch, RootState } from "../../../../store/store";
import {
  fetchPraByIdThunk,
  clearSelectedPra,
} from "../../store/purchaseReturn";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import { fetchPurchaseOrdersThunk } from "../../store/purchaseOrder.thunks";
import { praApi } from "../../api/purchaseReturn.api";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";

const RETURN_TYPE_OPTIONS = [
  { value: "debit_note", label: "Debit Note (Trừ công nợ)" },
  { value: "refund", label: "Refund (NCC hoàn tiền)" },
  { value: "replacement", label: "Replacement (Đổi hàng)" },
];

export default function PraEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const partners = useSelector((s: RootState) => s.partners);
  const { items: purchaseOrders } = useSelector(
    (s: RootState) => s.purchaseOrder,
  );
  const { selectedPra: pra, loading } = useSelector(
    (s: RootState) => s.purchaseReturn,
  );
  const user = useSelector((s: RootState) => s.auth.user);

  // Form fields
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [purchaseOrderId, setPurchaseOrderId] = useState<number | "">("");
  const [returnType, setReturnType] = useState<
    "debit_note" | "refund" | "replacement"
  >("debit_note");
  const [reason, setReason] = useState("");
  const [totalReturnAmount, setTotalReturnAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Load PRA data
  useEffect(() => {
    const numId = Number(id);
    if (id && !isNaN(numId)) {
      dispatch(fetchPraByIdThunk(numId))
        .unwrap()
        .then((data) => {
          setSupplierId(data.supplier_id ?? "");
          setPurchaseOrderId(data.purchase_order_id ?? "");
          setReturnType(data.return_type ?? "debit_note");
          setReason(data.reason ?? "");
          setTotalReturnAmount(data.total_return_amount ?? "");
          setNotes(data.notes ?? "");
          setPageLoading(false);
        })
        .catch(() => {
          setPageLoading(false);
        });
    }
    return () => {
      dispatch(clearSelectedPra());
    };
  }, [id, dispatch]);

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
    if (!pra) return;
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
      // Call update endpoint
      await praApi.update(pra.id, {
        supplier_id: supplierId as number,
        purchase_order_id: purchaseOrderId as number,
        return_type: returnType,
        reason: reason.trim(),
        total_return_amount: Number(totalReturnAmount),
        notes: notes.trim() || null,
      });

      toast.success("PRA updated");
      navigate(`/purchase/return-authorizations/${pra.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update PRA");
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!pra) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <CornerUpLeft className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">Return Authorization not found</p>
        <button
          onClick={() => navigate("/purchase/return-authorizations")}
          className="text-sm text-orange-600 hover:underline"
        >
          Back to list
        </button>
      </div>
    );
  }

  // Check if PRA can be edited (only draft)
  if (pra.status !== "draft") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <ArrowLeft className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">Only draft PRAs can be edited</p>
        <button
          onClick={() => navigate(`/purchase/return-authorizations/${pra.id}`)}
          className="text-sm text-orange-600 hover:underline"
        >
          Back to PRA
        </button>
      </div>
    );
  }

  // Filter POs to confirmed/partially_received/completed only
  const eligiblePOs = purchaseOrders.filter((po) =>
    ["confirmed", "partially_received", "completed"].includes(po.status),
  );

  return (
    <StandardFormLayout
      title={`Edit Return Authorization: ${pra.pra_no}`}
      actions={[
        {
          label: "Cancel",
          variant: "outline",
          onClick: () => navigate(`/purchase/return-authorizations/${pra.id}`),
        },
        {
          label: "Save Changes",
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
    </StandardFormLayout>
  );
}
