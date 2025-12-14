import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchApPostedSummaryThunk,
  fetchPostedSuppliersThunk,
} from "../store/apInvoice/apInvoice.thunks";
import { createApPaymentThunk } from "../store/apPayment/apPayment.thunks";
import { Partner } from "@/features/partner/store/partner.types";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
type PaymentMethod = "cash" | "bank" | "transfer";

export default function ApPaymentCreateModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  const dispatch = useAppDispatch();
  const [postedSuppliers, setPostedSuppliers] = useState<Partner[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const { postedSummary } = useAppSelector((s) => s.apInvoice);
  const loading = useAppSelector((s) => s.apPayment.loading);

  const [supplierId, setSupplierId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;

    setLoadingSuppliers(true);

    dispatch(fetchPostedSuppliersThunk())
      .unwrap()
      .then((data) => {
        setPostedSuppliers(data);
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        setLoadingSuppliers(false);
      });
  }, [open, dispatch]);

  useEffect(() => {
    if (open && supplierId !== null) {
      dispatch(fetchApPostedSummaryThunk(supplierId));
    }
  }, [open, supplierId, dispatch]);

  const totalPayable = postedSummary?.total_amount ?? 0;

  const [form, setForm] = useState<{
    payment_date: string;
    amount: string;
    method: PaymentMethod;
  }>({
    payment_date: "",
    amount: "",
    method: "bank",
  });
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (value: string) => {
    const clean = value.replace(/\D/g, "");
    const num = Number(clean);

    if (num > totalPayable) {
      setError("Payment amount cannot exceed total payable");
      return;
    }

    setError(null);
    setForm((prev) => ({ ...prev, amount: clean }));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!supplierId) {
      toast.error("Please select supplier");
      return;
    }

    if (!postedSummary) {
      toast.error("Payable summary not loaded");
      return;
    }

    if (!form.payment_date) {
      toast.error("Payment date is required");
      return;
    }

    const amountNum = Number(form.amount);
    if (amountNum <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (amountNum > totalPayable) {
      toast.error("Amount exceeds payable total");
      return;
    }

    try {
      await dispatch(
        createApPaymentThunk({
          supplier_id: supplierId,
          payment_date: form.payment_date,
          amount: amountNum.toString(),
          method: form.method,
        })
      ).unwrap();

      toast.success("AP Payment created successfully 🎉");
      onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-xl rounded shadow p-6 space-y-5">
        <h2 className="text-xl font-bold">Create AP Payment</h2>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        {/* ================= SUPPLIER ================= */}
        <div>
          <label className="font-semibold">Supplier</label>
          <select
            value={supplierId ?? ""}
            disabled={loadingSuppliers}
            onChange={(e) =>
              setSupplierId(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Select supplier</option>
            {postedSuppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* ================= TOTAL PAYABLE ================= */}
        <div className="text-sm">
          Total payable (posted invoices):{" "}
          <span className="font-semibold text-red-600">
            {totalPayable.toLocaleString()}₫
          </span>
        </div>

        {/* ================= PAYMENT DATE ================= */}
        <div>
          <label className="font-semibold">Payment Date</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={form.payment_date}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                payment_date: e.target.value,
              }))
            }
          />
        </div>

        {/* ================= AMOUNT ================= */}
        <div>
          <label className="font-semibold">Amount</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Enter payment amount"
            value={form.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
          />

          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              className="px-3 py-1 bg-gray-200 rounded"
              onClick={() =>
                handleAmountChange(Math.min(1_000_000, totalPayable).toString())
              }
            >
              +1,000,000
            </button>

            <button
              type="button"
              className="px-3 py-1 bg-blue-500 text-white rounded"
              onClick={() => handleAmountChange(totalPayable.toString())}
            >
              Pay Full ({totalPayable.toLocaleString()}₫)
            </button>
          </div>
        </div>

        {/* ================= METHOD ================= */}
        <div>
          <label className="font-semibold">Method</label>
          <select
            className="w-full border p-2 rounded"
            value={form.method}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                method: e.target.value as PaymentMethod,
              }))
            }
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>

        {/* ================= ACTION ================= */}
        <div className="flex justify-end gap-3 pt-4">
          <button className="px-4 py-2 border rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
