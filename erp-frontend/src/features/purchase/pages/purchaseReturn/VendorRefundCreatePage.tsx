import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Banknote } from "lucide-react";
import { AppDispatch, RootState } from "../../../../store/store";
import { createVendorRefundThunk } from "../../store/purchaseReturn";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";

const METHOD_OPTIONS = [
  { value: "bank", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Transfer" },
];

export default function VendorRefundCreatePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();

  const partners = useSelector((s: RootState) => s.partners);
  const user = useSelector((s: RootState) => s.auth.user);

  const [supplierId, setSupplierId] = useState<number | "">(
    searchParams.get("supplier_id")
      ? Number(searchParams.get("supplier_id"))
      : "",
  );
  const [debitNoteId] = useState<number | "">(
    searchParams.get("debit_note_id")
      ? Number(searchParams.get("debit_note_id"))
      : "",
  );
  const [refundDate, setRefundDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState<"bank" | "cash" | "transfer">("bank");
  const [transactionReference, setTransactionReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(loadPartners({ type: "supplier" }));
  }, [dispatch]);

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error("Supplier is required");
      return;
    }
    if (!refundDate) {
      toast.error("Refund date is required");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Amount must be > 0");
      return;
    }

    setSubmitting(true);
    try {
      const refund = await dispatch(
        createVendorRefundThunk({
          supplier_id: supplierId as number,
          debit_note_id: debitNoteId || null,
          refund_date: refundDate,
          amount: Number(amount),
          method,
          transaction_reference: transactionReference.trim() || null,
          notes: notes.trim() || null,
        } as any),
      ).unwrap();
      toast.success(`Vendor Refund ${refund.refund_no} created`);
      navigate(`/purchase/vendor-refunds/${refund.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create Vendor Refund");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StandardFormLayout
      title="New Vendor Refund"
      actions={[
        {
          label: "Cancel",
          variant: "outline",
          onClick: () => navigate("/purchase/vendor-refunds"),
        },
        {
          label: "Create Refund",
          variant: "primary",
          onClick: handleSubmit,
          isLoading: submitting,
        },
      ]}
    >
      <FormSection
        title="Refund Details"
        icon={<Banknote className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              Refund Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={refundDate}
              onChange={(e) => setRefundDate(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="0"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Transaction Reference
            </label>
            <input
              type="text"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="Bank ref / cheque no..."
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
    </StandardFormLayout>
  );
}
