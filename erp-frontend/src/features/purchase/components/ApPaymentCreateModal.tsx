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
import axiosClient from "@/api/axiosClient";
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
    { value: "bank", label: "Chuyển khoản", icon: "🏦" },
    { value: "cash", label: "Tiền mặt", icon: "💵" },
    { value: "transfer", label: "Chuyển khoản nhanh", icon: "⚡" },
  ];

export default function ApPaymentCreateModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  const dispatch = useAppDispatch();

  const [postedSuppliers, setPostedSuppliers] = useState<Partner[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankAccountId, setBankAccountId] = useState<string>("");

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
  const isBankMethod = ["bank", "transfer"].includes(form.method);
  const canSubmit =
    supplierId !== null &&
    form.payment_date &&
    amountNum > 0 &&
    !isOverLimit &&
    (!isBankMethod || bankAccountId !== "") &&
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

  /* ─── Load bank accounts on open ─────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    axiosClient
      .get("/master-data/bank-accounts")
      .then((res) => setBankAccounts(res.data || []))
      .catch(console.error);
  }, [open]);

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
      setBankAccountId("");
      setAmountError(null);
    }
  }, [open]);

  /* ─── Handlers ───────────────────────────────────────────────────────── */
  const handleAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const num = Number(digits);
    if (num > totalPayable) {
      setAmountError(
        `Không được vượt quá tổng số tiền cần thanh toán (${totalPayable.toLocaleString("en-US")})`,
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
    if (!supplierId) return toast.error("Vui lòng chọn nhà cung cấp");
    if (!form.payment_date) return toast.error("Vui lòng chọn ngày thanh toán");
    if (amountNum <= 0) return toast.error("Số tiền thanh toán phải lớn hơn 0");
    if (isOverLimit) return toast.error("Số tiền thanh toán vượt quá số dư nợ");

    try {
      await dispatch(
        createApPaymentThunk({
          supplier_id: supplierId,
          payment_date: form.payment_date,
          amount: amountNum.toString(),
          method: form.method,
          bank_account_id: isBankMethod && bankAccountId ? Number(bankAccountId) : null,
        } as any),
      ).unwrap();

      toast.success("Tạo thanh toán AP thành công");
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
                <h2 className="text-lg font-bold text-white">Thanh toán AP mới</h2>
                <p className="text-orange-100 text-xs">
                  Tạo thanh toán cho nhà cung cấp
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
              Nhà cung cấp <span className="text-red-500">*</span>
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
                  {loadingSuppliers ? "Đang tải..." : "Chọn nhà cung cấp..."}
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
                      Số dư nợ còn lại
                    </p>
                    <span className="text-xs text-gray-400">
                      {postedSummary?.invoices?.length ?? 0} hóa đơn
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
                              MỘT PHẦN
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
                    Không có hóa đơn chưa thanh toán cho nhà cung cấp này
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
              Ngày thanh toán <span className="text-red-500">*</span>
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
              Số tiền <span className="text-red-500">*</span>
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
                  Thanh toán hết ({totalPayable.toLocaleString("en-US")} VND)
                </button>
              </div>
            )}
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Phương thức thanh toán <span className="text-red-500">*</span>
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

          {/* Bank Account */}
          {isBankMethod && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Tài khoản ngân hàng <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none bg-white transition"
                >
                  <option value="">Chọn tài khoản ngân hàng...</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bank_name} - {acc.account_number} ({acc.account_name})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition disabled:opacity-50"
          >
            Hủy
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
            {loading ? "Đang tạo..." : "Tạo thanh toán"}
          </button>
        </div>
      </div>
    </div>
  );
}
