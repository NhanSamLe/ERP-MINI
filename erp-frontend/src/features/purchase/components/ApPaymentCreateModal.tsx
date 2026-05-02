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
import {
  CreditCard,
  X,
  Building2,
  Calendar,
  Banknote,
  Loader2,
  ChevronDown,
  Zap,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type PaymentMethod = "cash" | "bank" | "transfer";

const METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] =
  [
    { value: "bank", label: "Bank Transfer", icon: "🏦" },
    { value: "cash", label: "Cash", icon: "💵" },
    { value: "transfer", label: "Wire Transfer", icon: "⚡" },
  ];

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
  const [form, setForm] = useState<{
    payment_date: string;
    amount: string;
    method: PaymentMethod;
  }>({
    payment_date: new Date().toISOString().split("T")[0],
    amount: "",
    method: "bank",
  });
  const [amountError, setAmountError] = useState<string | null>(null);

  const totalPayable = postedSummary?.total_amount ?? 0;
  const amountNum = Number(form.amount.replace(/,/g, "")) || 0;
  const isOverLimit = amountNum > totalPayable;
  const canSubmit =
    supplierId !== null &&
    form.payment_date &&
    amountNum > 0 &&
    !isOverLimit &&
    !loading;

  /* ─── Load suppliers on open ─────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    setLoadingSuppliers(true);
    dispatch(fetchPostedSuppliersThunk())
      .unwrap()
      .then(setPostedSuppliers)
      .catch(console.error)
      .finally(() => setLoadingSuppliers(false));
  }, [open, dispatch]);

  /* ─── Load posted summary when supplier changes ──────────────────────── */
  useEffect(() => {
    if (open && supplierId !== null) {
      dispatch(fetchApPostedSummaryThunk(supplierId));
      setForm((prev) => ({ ...prev, amount: "" }));
      setAmountError(null);
    }
  }, [open, supplierId, dispatch]);

  /* ─── Reset on close ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) {
      setSupplierId(null);
      setForm({
        payment_date: new Date().toISOString().split("T")[0],
        amount: "",
        method: "bank",
      });
      setAmountError(null);
    }
  }, [open]);

  /* ─── Handlers ───────────────────────────────────────────────────────── */
  const handleAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const num = Number(digits);
    if (num > totalPayable) {
      setAmountError(
        `Cannot exceed total payable (${totalPayable.toLocaleString("en-US")})`,
      );
    } else {
      setAmountError(null);
    }
    setForm((prev) => ({ ...prev, amount: digits }));
  };

  const handleFillFull = () => {
    setAmountError(null);
    setForm((prev) => ({ ...prev, amount: String(totalPayable) }));
  };

  const handleSubmit = async () => {
    if (!supplierId) return toast.error("Please select a supplier");
    if (!form.payment_date) return toast.error("Payment date is required");
    if (amountNum <= 0) return toast.error("Amount must be greater than 0");
    if (isOverLimit) return toast.error("Amount exceeds payable total");

    try {
      await dispatch(
        createApPaymentThunk({
          supplier_id: supplierId,
          payment_date: form.payment_date,
          amount: amountNum.toString(),
          method: form.method,
        }),
      ).unwrap();

      toast.success("AP Payment created successfully");
      onSuccess?.();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  if (!open) return null;

  const selectedSupplier = postedSuppliers.find((s) => s.id === supplierId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">New AP Payment</h2>
                <p className="text-orange-100 text-xs">
                  Create a supplier payment
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-5">
          {/* Supplier */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <Building2 className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
              Supplier <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={supplierId ?? ""}
                disabled={loadingSuppliers}
                onChange={(e) =>
                  setSupplierId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400 transition"
              >
                <option value="">
                  {loadingSuppliers ? "Loading..." : "Select supplier..."}
                </option>
                {postedSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Payable summary — shown when supplier selected */}
          {supplierId !== null && (
            <div
              className={`rounded-xl border-2 px-4 py-3 transition-all ${
                totalPayable > 0
                  ? "bg-orange-50 border-orange-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              {totalPayable > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Outstanding Balance
                    </p>
                    <span className="text-xs text-gray-400">
                      {postedSummary?.invoices?.length ?? 0} invoice
                      {(postedSummary?.invoices?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 mb-2">
                    {totalPayable.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    <span className="text-sm font-normal text-orange-400">
                      VND
                    </span>
                  </p>
                  {/* Invoice breakdown */}
                  <div className="space-y-1 mt-2 border-t border-orange-100 pt-2">
                    {(postedSummary?.invoices ?? []).map((inv: any) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-gray-600 font-medium">
                          {inv.invoice_no}
                        </span>
                        <div className="flex items-center gap-2">
                          {Number(inv.outstanding_amount) <
                            Number(inv.total_after_tax) && (
                            <span className="text-gray-400 line-through">
                              {Number(inv.total_after_tax).toLocaleString(
                                "en-US",
                              )}
                            </span>
                          )}
                          <span className="font-semibold text-orange-600">
                            {Number(inv.outstanding_amount).toLocaleString(
                              "en-US",
                            )}
                          </span>
                          {Number(inv.outstanding_amount) <
                            Number(inv.total_after_tax) && (
                            <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-semibold text-[10px]">
                              PARTIAL
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-sm">
                    No outstanding invoices for this supplier
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.payment_date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, payment_date: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <Banknote className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={
                  form.amount ? Number(form.amount).toLocaleString("en-US") : ""
                }
                onChange={(e) =>
                  handleAmountChange(e.target.value.replace(/,/g, ""))
                }
                className={`w-full border rounded-xl px-4 py-2.5 pr-16 text-sm focus:ring-2 focus:border-transparent outline-none transition ${
                  isOverLimit || amountError
                    ? "border-red-400 focus:ring-red-300 bg-red-50"
                    : "border-gray-300 focus:ring-orange-400"
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                VND
              </span>
            </div>

            {/* Error */}
            {amountError && (
              <p className="text-xs text-red-500 mt-1">{amountError}</p>
            )}

            {/* Quick fill buttons */}
            {totalPayable > 0 && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleFillFull}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
                >
                  <Zap className="w-3 h-3" />
                  Pay Full ({totalPayable.toLocaleString("en-US")} VND)
                </button>
              </div>
            )}
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {METHOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, method: opt.value }))
                  }
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition ${
                    form.method === opt.value
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition flex items-center gap-2 ${
              canSubmit
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating..." : "Create Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
