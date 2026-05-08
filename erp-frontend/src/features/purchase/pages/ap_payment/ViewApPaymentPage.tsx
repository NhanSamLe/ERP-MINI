import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getApPaymentByIdThunk,
  submitApPaymentThunk,
  approveApPaymentThunk,
  rejectApPaymentThunk,
  getApPaymentAvailableAmountThunk,
  getApPaymentUnpaidInvoicesThunk,
  allocateApPaymentThunk,
  getApPaymentAuditLogsThunk,
} from "../../store/apPayment/apPayment.thunks";
import {
  Loader2,
  CreditCard,
  Calendar,
  ArrowLeft,
  Send,
  CheckCircle,
  Clock,
  Building2,
  XCircle,
  History,
} from "lucide-react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { Roles } from "@/types/enum";
import { UnpaidInvoice } from "../../store/apPayment/apPayment.types";
import {
  ApprovalStatus,
  ApPaymentStatus,
} from "../../constants/purchaseStatus.enum";
import { AuditLogCard } from "../../components/Common";

export default function ViewApPaymentPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { selected: payment, loading } = useAppSelector((s) => s.apPayment);
  const { user } = useAppSelector((s) => s.auth);

  const [submitting, setSubmitting] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [openSubmitModal, setOpenSubmitModal] = useState(false);
  const [openApproveModal, setOpenApproveModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [openAllocateModal, setOpenAllocateModal] = useState(false);

  // ✅ Phase 2: Audit log state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  useEffect(() => {
    if (id) dispatch(getApPaymentByIdThunk(Number(id)));
  }, [id, dispatch]);

  // ✅ Phase 2 & 3: Load audit logs (extracted to reusable fn)
  const refreshAuditLogs = async () => {
    if (!id) return;
    try {
      setLoadingAuditLogs(true);
      const logs = await dispatch(
        getApPaymentAuditLogsThunk(Number(id)),
      ).unwrap();
      setAuditLogs(logs);
    } catch {
      // silent — audit log không critical
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    refreshAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500 font-medium">Loading payment...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-32 text-gray-500">Payment not found</div>
    );
  }

  /* ================= PERMISSIONS ================= */
  const canSubmit =
    user?.role.code === Roles.ACCOUNT &&
    payment.approval_status === ApprovalStatus.DRAFT &&
    payment.status === ApPaymentStatus.DRAFT &&
    payment.created_by === user.id;

  const canApproveReject =
    user?.role.code === Roles.CHACC &&
    payment.approval_status === ApprovalStatus.WAITING_APPROVAL &&
    payment.created_by !== user.id;

  const canAllocate =
    user?.role.code === Roles.ACCOUNT &&
    payment.status === ApPaymentStatus.POSTED &&
    payment.approval_status === ApprovalStatus.APPROVED &&
    payment.created_by === user.id;

  /* ================= HANDLERS ================= */
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await dispatch(submitApPaymentThunk(payment.id)).unwrap();
      toast.success("Payment submitted for approval");
      setOpenSubmitModal(false);
      refreshAuditLogs();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await dispatch(approveApPaymentThunk(payment.id)).unwrap();
      toast.success("Payment approved");
      setOpenApproveModal(false);
      refreshAuditLogs();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning("Please enter reject reason");
      return;
    }
    try {
      setSubmitting(true);
      await dispatch(
        rejectApPaymentThunk({ id: payment.id, reason: rejectReason.trim() }),
      ).unwrap();
      toast.success("Payment rejected");
      setOpenReject(false);
      setRejectReason("");
      refreshAuditLogs();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* ================= HEADER ================= */}
      <div className="bg-gradient-to-r from-white via-blue-50/30 to-white rounded-2xl border-2 border-blue-100 p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl
 bg-gradient-to-br from-orange-500 to-orange-600
 flex items-center justify-center shadow-lg shadow-orange-500/30"
            >
              <CreditCard className="w-8 h-8 text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payment {payment.payment_no}
              </h1>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(payment.payment_date).toLocaleDateString("en-US")}
                </span>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            {canSubmit && (
              <button
                onClick={() => setOpenSubmitModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold text-sm shadow-md hover:bg-orange-600 transition"
              >
                <Send className="w-4 h-4" />
                Submit
              </button>
            )}

            {canApproveReject && (
              <>
                <button
                  onClick={() => setOpenApproveModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md hover:bg-emerald-600"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>

                <button
                  onClick={() => setOpenReject(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm shadow-md hover:bg-red-600"
                >
                  Reject
                </button>
              </>
            )}

            {canAllocate && (
              <button
                onClick={() => setOpenAllocateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl
               bg-purple-500 text-white font-semibold text-sm
               shadow-md hover:bg-purple-600"
              >
                <CreditCard className="w-4 h-4" />
                Allocate to Invoices
              </button>
            )}

            <button
              onClick={() => navigate("/purchase/payments")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-md "
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* STATUS */}
            <div className="px-4 py-2 rounded-xl border-2 font-semibold text-sm bg-blue-50 text-blue-700 border-blue-200">
              {payment.status.toUpperCase()}
            </div>

            <div className="px-4 py-2 rounded-xl border-2 font-semibold text-sm bg-amber-50 text-amber-700 border-amber-200">
              {payment.approval_status.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* ================= INFO GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Payment Information
            </h2>
          </div>

          <div className="space-y-4">
            {/* Amount nổi bật */}
            <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-orange-700">
                Payment Amount
              </span>
              <span className="text-xl font-bold text-orange-600">
                {Number(payment.amount || 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}{" "}
                VND
              </span>
            </div>
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Payment Date"
              value={new Date(payment.payment_date).toLocaleDateString("en-US")}
            />
            <InfoRow
              icon={<CreditCard className="w-4 h-4" />}
              label="Method"
              value={payment.method.toUpperCase()}
            />
            <InfoRow
              icon={<CheckCircle className="w-4 h-4" />}
              label="Status"
              value={payment.status.toUpperCase()}
            />
            {payment.submitted_at && (
              <InfoRow
                icon={<Clock className="w-4 h-4" />}
                label="Submitted At"
                value={new Date(payment.submitted_at).toLocaleString("en-US")}
              />
            )}
            {payment.approved_at && (
              <InfoRow
                icon={<CheckCircle className="w-4 h-4" />}
                label="Approved At"
                value={new Date(payment.approved_at).toLocaleString("en-US")}
              />
            )}
            <InfoRow
              icon={<Clock className="w-4 h-4" />}
              label="Approval"
              value={payment.approval_status.toUpperCase()}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-2xl border-2 border-blue-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Supplier Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 uppercase mb-1">
                Company
              </p>
              <p className="font-bold text-gray-900">
                {payment.supplier?.name}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 uppercase mb-1">
                Email
              </p>
              <p className="text-sm text-gray-900">
                {payment.supplier?.email ?? "-"}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 uppercase mb-1">
                Phone
              </p>
              <p className="text-sm text-gray-900">
                {payment.supplier?.phone ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= USERS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserCard title="Created By" user={payment.creator} />
        <UserCard
          title="Approved By"
          user={payment.approver}
          empty="Waiting for approval"
        />
      </div>
      {/* ================= REJECTION INFO ================= */}
      {payment.approval_status === ApprovalStatus.REJECTED &&
        payment.reject_reason && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-red-700">
                Rejection Reason
              </h3>
            </div>

            <p className="text-sm text-red-800 leading-relaxed whitespace-pre-line">
              {payment.reject_reason}
            </p>
          </div>
        )}

      {/* ================= SUBMIT MODAL ================= */}
      {openSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Send className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Submit for approval?
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Once submitted, this payment will be sent for approval and you
              will not be able to edit it anymore.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenSubmitModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className={`px-4 py-2 rounded-xl font-semibold shadow-md transition ${
                  submitting
                    ? "bg-orange-300 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                {submitting ? "Submitting..." : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= APPROVE MODAL ================= */}
      {openApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Approve this payment?
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              This action will approve the payment and allow further processing.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenApproveModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                disabled={submitting}
                onClick={handleApprove}
                className={`px-4 py-2 rounded-xl font-semibold shadow-md transition ${
                  submitting
                    ? "bg-emerald-300 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
              >
                Confirm Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REJECT MODAL ================= */}
      {openReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Reject Payment
                </h3>
                <p className="text-xs text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please explain why this payment is being rejected..."
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none resize-none"
            />
            {rejectReason.trim() === "" && (
              <p className="text-xs text-red-500 mt-1">Reason is required</p>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setOpenReject(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                disabled={submitting || !rejectReason.trim()}
                onClick={handleReject}
                className={`px-4 py-2 rounded-xl font-semibold shadow-md transition flex items-center gap-2 ${
                  submitting || !rejectReason.trim()
                    ? "bg-red-200 cursor-not-allowed text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {openAllocateModal && (
        <AllocateModal
          paymentId={payment.id}
          onClose={() => setOpenAllocateModal(false)}
          onSuccess={refreshAuditLogs}
        />
      )}

      {/* ================= AUDIT LOG ================= */}
      <AuditLogCard
        title="Activity Log"
        logs={auditLogs}
        loading={loadingAuditLogs}
        variant="payment"
      />
    </div>
  );
}

/* ================= SHARED COMPONENTS ================= */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold text-gray-900">{value ?? "-"}</span>
    </div>
  );
}

function UserCard({
  title,
  user,
  empty,
}: {
  title: string;
  user?: {
    id: number;
    full_name: string;
    email?: string;
    phone?: string;
    avatar_url?: string | null;
  } | null;
  empty?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border p-6">
      <h3 className="font-bold mb-3">{title}</h3>
      {user ? (
        <>
          <p className="font-semibold">{user.full_name}</p>
          {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
        </>
      ) : (
        <p className="italic text-gray-400">{empty}</p>
      )}
    </div>
  );
}

/* ================= AUDIT ACTION BADGE ================= */
const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-blue-100 text-blue-700",
  SUBMIT: "bg-yellow-100 text-yellow-700",
  APPROVE: "bg-green-100 text-green-700",
  REJECT: "bg-red-100 text-red-700",
  ALLOCATE: "bg-purple-100 text-purple-700",
  COMPLETE: "bg-emerald-100 text-emerald-700",
};

function AuditActionBadge({ action }: { action: string }) {
  const cls = ACTION_STYLES[action] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}
    >
      {action}
    </span>
  );
}

/* ================= INVOICE STATUS BADGE ================= */
const INVOICE_STATUS_STYLES: Record<string, string> = {
  posted: "bg-orange-100 text-orange-700",
  partially_paid: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
};

function InvoiceStatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const cls = INVOICE_STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}
    >
      {status.replace(/_/g, " ").toUpperCase()}
    </span>
  );
}
function AllocateModal({
  paymentId,
  onClose,
  onSuccess,
}: {
  paymentId: number;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const dispatch = useAppDispatch();

  const [availableAmount, setAvailableAmount] = useState<number>(0);
  const [localInvoices, setLocalInvoices] = useState<UnpaidInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* ===== LOAD DATA ===== */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await dispatch(
          getApPaymentAvailableAmountThunk(paymentId),
        ).unwrap();
        const invoices = await dispatch(
          getApPaymentUnpaidInvoicesThunk(paymentId),
        ).unwrap();
        setAvailableAmount(result.available_amount);
        setLocalInvoices(invoices.map((i) => ({ ...i, allocate_amount: 0 })));
      } catch (e) {
        toast.error(getErrorMessage(e));
        onClose();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dispatch, paymentId, onClose]);

  /* ===== CALCULATIONS ===== */
  const totalAllocate = localInvoices.reduce(
    (sum, i) => sum + Number(i.allocate_amount || 0),
    0,
  );
  const remaining = availableAmount - totalAllocate;
  const invalid =
    totalAllocate <= 0 ||
    totalAllocate > availableAmount ||
    localInvoices.some(
      (i) => i.allocate_amount! < 0 || i.allocate_amount! > i.unpaid_amount,
    );

  /* ===== HANDLERS ===== */
  const handleChange = (id: number, value: string) => {
    const num = parseFloat(value) || 0;
    setLocalInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, allocate_amount: num } : i)),
    );
  };

  // ✅ Phase 3: Fill max — tự động điền tối đa có thể cho từng invoice
  const handleFillMax = () => {
    let budget = availableAmount;
    setLocalInvoices((prev) =>
      prev.map((inv) => {
        if (budget <= 0) return { ...inv, allocate_amount: 0 };
        const fill = Math.min(inv.unpaid_amount, budget);
        budget -= fill;
        return { ...inv, allocate_amount: fill };
      }),
    );
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const allocations = localInvoices
        .filter((i) => i.allocate_amount! > 0)
        .map((i) => ({ invoice_id: i.id, amount: i.allocate_amount }));

      await dispatch(
        allocateApPaymentThunk({ paymentId, allocations }),
      ).unwrap();

      toast.success("Allocation completed successfully");
      onSuccess?.();
      onClose();
      dispatch(getApPaymentByIdThunk(paymentId));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl flex items-center gap-3">
          <Loader2 className="animate-spin text-purple-500" />
          <span className="text-sm font-medium text-gray-600">
            Loading allocation data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6">
        {submitting && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-sm font-semibold text-gray-700">
                Allocating payment...
              </p>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Allocate Payment
              </h3>
              <p className="text-xs text-gray-500">
                Assign payment to outstanding invoices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* SUMMARY BAR */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xs text-blue-600 font-medium mb-0.5">
              Available
            </p>
            <p className="text-lg font-bold text-blue-700">
              {availableAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-xs text-purple-600 font-medium mb-0.5">
              Allocating
            </p>
            <p className="text-lg font-bold text-purple-700">
              {totalAllocate.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div
            className={`rounded-xl p-3 text-center ${remaining < 0 ? "bg-red-50" : "bg-green-50"}`}
          >
            <p
              className={`text-xs font-medium mb-0.5 ${remaining < 0 ? "text-red-600" : "text-green-600"}`}
            >
              Remaining
            </p>
            <p
              className={`text-lg font-bold ${remaining < 0 ? "text-red-700" : "text-green-700"}`}
            >
              {remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* FILL MAX BUTTON */}
        <div className="flex justify-end mb-3">
          <button
            onClick={handleFillMax}
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-400 px-3 py-1.5 rounded-lg transition"
          >
            ⚡ Auto-fill Max
          </button>
        </div>

        {/* TABLE */}
        {localInvoices.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No unpaid invoices found for this supplier.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Unpaid
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Allocate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {localInvoices.map((inv) => {
                  const isOverAllocated =
                    (inv.allocate_amount ?? 0) > inv.unpaid_amount;
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {inv.invoice_no}
                      </td>
                      <td className="px-4 py-3">
                        <InvoiceStatusBadge status={(inv as any).status} />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {Number(inv.total_after_tax).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-orange-600">
                        {Number(inv.unpaid_amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          max={inv.unpaid_amount}
                          step="0.01"
                          value={inv.allocate_amount ?? 0}
                          onChange={(e) => handleChange(inv.id, e.target.value)}
                          className={`w-32 border rounded-lg px-2 py-1.5 text-right text-sm focus:ring-2 outline-none transition ${
                            isOverAllocated
                              ? "border-red-400 focus:ring-red-300 bg-red-50"
                              : "border-gray-300 focus:ring-purple-300"
                          }`}
                        />
                        {isOverAllocated && (
                          <p className="text-xs text-red-500 mt-0.5">
                            Exceeds unpaid
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={invalid || submitting}
            onClick={handleSubmit}
            className={`px-5 py-2 rounded-xl font-semibold shadow-md transition flex items-center gap-2 ${
              invalid || submitting
                ? "bg-gray-300 cursor-not-allowed text-white"
                : "bg-purple-500 hover:bg-purple-600 text-white"
            }`}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Allocating..." : "Confirm Allocate"}
          </button>
        </div>
      </div>
    </div>
  );
}
