import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchReceiptDetail,
  submitReceipt,
  approveReceipt,
  rejectReceipt,
  allocateReceipt,
  fetchUnpaidInvoices,
} from "../store/receipt.slice";
import { ActionConfirmModal, StatusBadge } from "@/components/common";
import { StandardFormLayout, FormSection } from "@/components/layout";
import {
  Wallet, User, CreditCard, Phone,
  FileText, AlertTriangle, CheckCircle2, Clock, UserCheck, Loader2,
  X, Check,
} from "lucide-react";

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value || "—"}</p>
  </div>
);

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const receiptId = Number(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selected: receipt, loading, unpaidInvoices } = useAppSelector((s) => s.receipt);
  const { user } = useAppSelector((s) => s.auth);

  const [activeModal, setActiveModal] = useState<"submit" | "approve" | "reject" | null>(null);
  const [showAllocPanel, setShowAllocPanel] = useState(false);
  const [alloc, setAlloc] = useState<Record<number, number>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (receiptId) dispatch(fetchReceiptDetail(receiptId));
  }, [dispatch, receiptId]);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  if (loading || !receipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm font-medium">Đang tải phiếu thu...</p>
        </div>
      </div>
    );
  }

  if (!user) return <div className="p-10 text-center text-gray-500">Không có quyền truy cập</div>;

  /* ─── derived ─── */
  const currencySymbol = receipt.currency?.symbol || receipt.currency?.code || "VND";
  const currencyCode = receipt.currency?.code || "VND";
  const exchangeRate = Number(receipt.exchange_rate || 1);
  const fmtMoney = (v: number | null | undefined) =>
    `${Number(v || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ${currencySymbol}`;

  const isAccountant = ["ACCOUNT", "BRANCH_MANAGER", "CEO", "ADMIN"].includes(user?.role?.code ?? "");
  const isChiefAcc = ["CHACC", "BRANCH_MANAGER", "CEO", "ADMIN"].includes(user?.role?.code ?? "");
  const isOwner = receipt.created_by === user.id;
  const isRejected = receipt.approval_status === "rejected";
  const isPosted = receipt.status === "posted";
  const isApproved = receipt.approval_status === "approved";
  const isWaiting = receipt.approval_status === "waiting_approval";
  const isDraft = receipt.approval_status === "draft";

  const totalAllocated = receipt.allocations
    ? receipt.allocations.reduce((s, a) => s + (a.applied_amount ?? 0), 0)
    : 0;
  const remainingAmount = Math.max(0, receipt.amount - totalAllocated);
  const totalAllocInput = Object.values(alloc).reduce((s, v) => s + v, 0);
  const isFullyAllocated = receipt.allocation_status === "fully_allocated";
  const isUnallocated = receipt.allocation_status === "unallocated";

  // CHACC tạo phiếu thu sẽ được tự duyệt + ghi sổ ngay (backend), nên không cần
  // hiện nút "Gửi duyệt" cho CHACC ở phiếu nháp.
  const canSubmit = isDraft && isAccountant && (isOwner || ["CEO", "ADMIN", "BRANCH_MANAGER"].includes(user?.role?.code ?? ""));
  const canApprove = isWaiting && isChiefAcc;
  const canReject = canApprove;
  // Cho phép cả kế toán (ACCOUNT) lẫn kế toán trưởng (CHACC) phân bổ phiếu đã ghi sổ.
  const canAllocate =
    (isAccountant || isChiefAcc) && isPosted && isApproved && !isFullyAllocated && remainingAmount > 0;

  const handleAllocate = () => {
    dispatch(fetchUnpaidInvoices(receipt.customer_id));
    setShowAllocPanel(true);
    setAlloc({});
  };

  const handleAutoAllocate = () => {
    let remaining = remainingAmount;
    const newAlloc: Record<number, number> = {};
    for (const inv of unpaidInvoices) {
      if (remaining <= 0) break;
      const needed = inv.unpaid || inv.total_after_tax;
      const apply = Math.min(remaining, needed);
      if (apply > 0) { newAlloc[inv.invoice_id] = apply; remaining -= apply; }
    }
    setAlloc(newAlloc);
  };

  const handleApplyAllocation = async () => {
    const allocations = Object.entries(alloc)
      .filter(([, v]) => v > 0)
      .map(([id, v]) => ({ invoice_id: Number(id), applied_amount: v }));

    if (allocations.length === 0) {
      setMessage({ type: "error", text: "Vui lòng phân bổ ít nhất một hóa đơn" });
      return;
    }

    for (const a of allocations) {
      const inv = unpaidInvoices?.find((i) => i.invoice_id === a.invoice_id);
      if (!inv) { setMessage({ type: "error", text: "Hóa đơn không hợp lệ" }); return; }
      const unpaid = inv.unpaid ?? inv.total_after_tax;
      if (a.applied_amount > unpaid) {
        setMessage({ type: "error", text: `Phân bổ cho ${inv.invoice_no} vượt quá số nợ (${fmtMoney(unpaid)})` });
        return;
      }
      if (a.applied_amount <= 0) { setMessage({ type: "error", text: "Số tiền phải lớn hơn 0" }); return; }
    }

    if (totalAllocInput > remainingAmount) {
      setMessage({ type: "error", text: `Tổng phân bổ (${fmtMoney(totalAllocInput)}) vượt quá số tiền còn lại (${fmtMoney(remainingAmount)})` });
      return;
    }

    try {
      setActionLoading(true);
      await dispatch(allocateReceipt({ id: receiptId, allocations })).unwrap();
      setMessage({ type: "success", text: "Phân bổ hóa đơn thành công" });
      setShowAllocPanel(false);
      setAlloc({});
      dispatch(fetchReceiptDetail(receiptId));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Phân bổ thất bại" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {/* Toast */}
      {message && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${message.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {message.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <StandardFormLayout
        title={receipt.receipt_no}
        statusBadge={
          <div className="flex items-center gap-2">
            <StatusBadge status={receipt.approval_status} />
            {receipt.status !== receipt.approval_status && (
              <StatusBadge status={receipt.status} />
            )}
            {isFullyAllocated && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                Đã phân bổ đầy đủ
              </span>
            )}
          </div>
        }
        actions={[
          { label: "Quay lại", variant: "outline", onClick: () => navigate("/receipts") },
          ...(canSubmit ? [{ label: isRejected ? "Gửi lại" : "Gửi duyệt", variant: "primary" as const, onClick: () => setActiveModal("submit") }] : []),
          ...(canApprove ? [{ label: "Duyệt", variant: "success" as const, onClick: () => setActiveModal("approve") }] : []),
          ...(canReject ? [{ label: "Từ chối", variant: "danger" as const, onClick: () => setActiveModal("reject") }] : []),
          ...(canAllocate ? [{ label: "Phân bổ vào hóa đơn", variant: "primary" as const, onClick: handleAllocate }] : []),
        ]}
        sidebarContent={
          <div className="space-y-4">
            {/* Allocation summary */}
            <FormSection title="Tóm tắt phân bổ" icon={<CreditCard className="w-4 h-4" />}>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Tổng phiếu thu</p>
                  <p className="text-xl font-bold text-orange-600">{fmtMoney(receipt.amount)}</p>
                  {currencyCode !== "VND" && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      ≈ {Math.round(Number(receipt.amount || 0) * exchangeRate).toLocaleString("vi-VN")} ₫
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Đã phân bổ</p>
                    <p className="text-sm font-semibold text-green-600">{fmtMoney(totalAllocated)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Còn lại</p>
                    <p className={`text-sm font-semibold ${remainingAmount === 0 ? "text-gray-400" : "text-orange-600"}`}>
                      {fmtMoney(remainingAmount)}
                    </p>
                  </div>
                </div>

                {receipt.amount > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Hoàn thành</span>
                      <span>{((totalAllocated / receipt.amount) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${remainingAmount === 0 ? "bg-green-500" : "bg-orange-500"}`}
                        style={{ width: `${(totalAllocated / receipt.amount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {canAllocate && (
                  <button
                    onClick={handleAllocate}
                    className="w-full h-8 mt-1 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 transition-colors"
                  >
                    Phân bổ ngay
                  </button>
                )}
              </div>
            </FormSection>

            {/* Workflow */}
            <FormSection title="Luồng duyệt" icon={<Clock className="w-4 h-4" />}>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3 h-3 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Tạo</p>
                    <p className="text-xs text-gray-500">{receipt.creator?.full_name || "—"}</p>
                    <p className="text-[10px] text-gray-400">{fmtDate(receipt.receipt_date)}</p>
                  </div>
                </div>

                {receipt.submitted_at && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3 h-3 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">Gửi duyệt</p>
                      <p className="text-[10px] text-gray-400">{fmtTime(receipt.submitted_at)}</p>
                    </div>
                  </div>
                )}

                {receipt.approved_at && receipt.approver && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">Đã duyệt</p>
                      <p className="text-xs text-gray-500">{receipt.approver.full_name}</p>
                      <p className="text-[10px] text-gray-400">{fmtTime(receipt.approved_at)}</p>
                    </div>
                  </div>
                )}

                {isRejected && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-600">Từ chối</p>
                      {receipt.reject_reason && (
                        <p className="text-xs text-gray-500 mt-0.5 italic">"{receipt.reject_reason}"</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            {/* Assignment */}
            <FormSection title="Phân công" icon={<UserCheck className="w-4 h-4" />}>
              <div className="space-y-2.5">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Người tạo</p>
                  <p className="text-sm font-medium text-gray-800">{receipt.creator?.full_name || "—"}</p>
                </div>
                {receipt.approver && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Người duyệt</p>
                    <p className="text-sm font-medium text-gray-800">{receipt.approver.full_name}</p>
                  </div>
                )}
              </div>
            </FormSection>
          </div>
        }
      >
        {/* Rejection banner */}
        {isRejected && receipt.reject_reason && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Phiếu thu bị từ chối</p>
              <p className="text-sm text-red-600 mt-0.5">{receipt.reject_reason}</p>
            </div>
          </div>
        )}

        {/* ─── 1. RECEIPT INFO ─── */}
        <FormSection title="Thông tin phiếu thu" icon={<Wallet className="w-4 h-4" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Số phiếu thu" value={receipt.receipt_no} />
            <Field label="Ngày phiếu" value={fmtDate(receipt.receipt_date)} />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">
                Số tiền{currencyCode !== "VND" && <span className="ml-1 text-orange-500">({currencyCode})</span>}
              </p>
              <p className="text-sm font-bold text-orange-600">{fmtMoney(receipt.amount)}</p>
              {currencyCode !== "VND" && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  ≈ {Math.round(Number(receipt.amount || 0) * exchangeRate).toLocaleString("vi-VN")} ₫
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Phương thức</p>
              <p className="text-sm font-medium text-gray-800 capitalize">{receipt.method || "—"}</p>
            </div>
          </div>
        </FormSection>

        {/* ─── 2. CUSTOMER ─── */}
        <FormSection title="Thông tin khách hàng" icon={<User className="w-4 h-4" />}>
          {receipt.customer ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-0.5">Tên khách hàng</p>
                <p className="text-base font-semibold text-gray-900">{receipt.customer.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Điện thoại
                </p>
                <p className="text-sm text-gray-800">{receipt.customer.phone || "—"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Không có thông tin khách hàng.</p>
          )}
        </FormSection>

        {/* ─── 3. ALLOCATED INVOICES ─── */}
        <FormSection
          title="Hóa đơn đã phân bổ"
          icon={<FileText className="w-4 h-4" />}
          description={`${receipt.allocations?.length || 0} hóa đơn`}
          noPadding
        >
          {!receipt.allocations || receipt.allocations.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">Chưa có hóa đơn được phân bổ.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {receipt.allocations.map((a, idx) => {
                const inv = a.invoice;
                const pct = inv?.total_after_tax
                  ? Math.min(100, ((a.applied_amount ?? 0) / inv.total_after_tax) * 100)
                  : 0;
                return (
                  <div key={a.id || idx} className="px-5 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{inv?.invoice_no || "—"}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Tổng HĐ: {fmtMoney(inv?.total_after_tax)}</p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">
                        +{fmtMoney(a.applied_amount)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Tiến độ thanh toán</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </FormSection>

        {/* Modals */}
        <ActionConfirmModal
          isOpen={activeModal === "submit"}
          onClose={() => setActiveModal(null)}
          title="Gửi duyệt phiếu thu"
          description={`Gửi phiếu thu "${receipt.receipt_no}" để kế toán trưởng phê duyệt?`}
          confirmText="Gửi duyệt"
          variant="primary"
          onConfirm={async () => {
            setActionLoading(true);
            try {
              await dispatch(submitReceipt(receiptId)).unwrap();
              dispatch(fetchReceiptDetail(receiptId));
              setMessage({ type: "success", text: "Gửi duyệt thành công" });
            } catch (err) {
              setMessage({ type: "error", text: err instanceof Error ? err.message : "Thất bại" });
            } finally {
              setActionLoading(false);
              setActiveModal(null);
            }
          }}
        />

        <ActionConfirmModal
          isOpen={activeModal === "approve"}
          onClose={() => setActiveModal(null)}
          title="Duyệt phiếu thu"
          description={`Duyệt phiếu thu "${receipt.receipt_no}"? Phiếu thu sẽ được phát hành và cập nhật sổ kế toán.`}
          confirmText="Duyệt"
          variant="success"
          onConfirm={async () => {
            setActionLoading(true);
            try {
              await dispatch(approveReceipt(receiptId)).unwrap();
              dispatch(fetchReceiptDetail(receiptId));
              setMessage({ type: "success", text: "Duyệt thành công" });
            } catch (err) {
              setMessage({ type: "error", text: err instanceof Error ? err.message : "Thất bại" });
            } finally {
              setActionLoading(false);
              setActiveModal(null);
            }
          }}
        />

        <ActionConfirmModal
          isOpen={activeModal === "reject"}
          onClose={() => setActiveModal(null)}
          title="Từ chối phiếu thu"
          description={`Từ chối phiếu thu "${receipt.receipt_no}"? Vui lòng nhập lý do để thông báo cho kế toán.`}
          confirmText="Từ chối"
          variant="danger"
          requireReason
          reasonLabel="Lý do từ chối"
          reasonPlaceholder="VD: Sai số tiền, sai khách hàng..."
          onConfirm={async (reason) => {
            setActionLoading(true);
            try {
              await dispatch(rejectReceipt({ id: receiptId, reason: reason ?? "" })).unwrap();
              dispatch(fetchReceiptDetail(receiptId));
              setMessage({ type: "success", text: "Từ chối thành công" });
            } catch (err) {
              setMessage({ type: "error", text: err instanceof Error ? err.message : "Thất bại" });
            } finally {
              setActionLoading(false);
              setActiveModal(null);
            }
          }}
        />
      </StandardFormLayout>

      {/* ─── ALLOCATION SLIDE-IN PANEL ─── */}
      {showAllocPanel && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex justify-end">
          <div className="relative w-full max-w-lg bg-white shadow-2xl min-h-screen flex flex-col">
            {/* Panel Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Phân bổ hóa đơn</h2>
                <p className="text-xs text-gray-500 mt-0.5">Khách hàng: {receipt.customer?.name}</p>
              </div>
              <button
                onClick={() => setShowAllocPanel(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-lg text-gray-500 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Remaining hint */}
              <div className="mb-6 bg-orange-50 border border-orange-100 rounded-lg px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-xs text-orange-600 font-semibold uppercase">Có thể phân bổ</p>
                  <p className="text-xl font-bold text-orange-700 mt-0.5">{fmtMoney(remainingAmount)}</p>
                </div>
                <button
                  onClick={handleAutoAllocate}
                  className="h-7 px-3 text-xs font-medium bg-white border border-orange-200 text-orange-600 rounded-md hover:bg-orange-50 transition"
                >
                  Tự động điền
                </button>
              </div>

              {/* Invoices */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700 uppercase border-b pb-2">Hóa đơn chưa thanh toán</p>
                {unpaidInvoices && unpaidInvoices.length > 0 ? (
                  unpaidInvoices.map((inv) => {
                    const cur = alloc[inv.invoice_id] || 0;
                    const isAlloc = cur > 0;
                    const unpaidAmt = inv.unpaid || inv.total_after_tax;
                    return (
                      <div
                        key={inv.invoice_id}
                        className={`p-4 rounded-lg border transition ${isAlloc ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{inv.invoice_no}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Còn nợ: {fmtMoney(unpaidAmt)}</p>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="0"
                            min="0"
                            max={unpaidAmt}
                            value={cur || ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setAlloc((prev) => ({ ...prev, [inv.invoice_id]: val }));
                            }}
                            className={`w-full pl-3 pr-14 h-9 text-sm rounded-md border font-mono focus:outline-none focus:ring-2 ${isAlloc ? "border-orange-300 focus:ring-orange-400" : "border-gray-300 focus:ring-gray-400"}`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">{currencySymbol}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-sm text-gray-400 bg-gray-50 rounded-lg">
                    Không tìm thấy hóa đơn chưa thanh toán.
                  </div>
                )}
              </div>
            </div>

            {/* Panel Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className={`flex justify-between items-center mb-3 ${totalAllocInput > 0 && totalAllocInput <= remainingAmount ? "text-green-600" : totalAllocInput > remainingAmount ? "text-red-600" : "text-gray-500"}`}>
                <span className="text-sm font-semibold">Tổng đã chọn</span>
                <span className="text-lg font-bold font-mono">{fmtMoney(totalAllocInput)}</span>
              </div>
              {totalAllocInput > remainingAmount && (
                <p className="text-xs text-red-500 mb-3 text-center">
                  Vượt quá số tiền có thể phân bổ ({fmtMoney(remainingAmount)})
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAllocPanel(false)}
                  className="flex-1 h-9 border border-gray-300 text-sm font-medium text-gray-700 rounded-md hover:bg-white transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleApplyAllocation}
                  disabled={actionLoading || totalAllocInput <= 0 || totalAllocInput > remainingAmount}
                  className="flex-1 h-9 bg-orange-500 text-white text-sm font-semibold rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {actionLoading ? "Đang lưu..." : "Xác nhận phân bổ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
