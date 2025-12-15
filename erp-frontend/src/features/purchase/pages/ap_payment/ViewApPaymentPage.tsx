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
} from "lucide-react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { Roles } from "@/types/enum";
import { UnpaidInvoice } from "../../store/apPayment/apPayment.types";

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

  useEffect(() => {
    if (id) dispatch(getApPaymentByIdThunk(Number(id)));
  }, [id, dispatch]);
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
    payment.approval_status === "draft" &&
    payment.status === "draft" &&
    payment.created_by === user.id;

  const canApproveReject =
    user?.role.code === Roles.CHACC &&
    payment.approval_status === "waiting_approval" &&
    payment.created_by !== user.id;

  const canAllocate =
    user?.role.code === Roles.ACCOUNT &&
    payment.status === "posted" &&
    payment.approval_status === "approved" &&
    payment.created_by === user.id;

  /* ================= HANDLERS ================= */
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await dispatch(submitApPaymentThunk(payment.id)).unwrap();
      toast.success("Payment submitted for approval");
      setOpenSubmitModal(false);
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
        rejectApPaymentThunk({
          id: payment.id,
          reason: rejectReason.trim(),
        })
      ).unwrap();
      toast.success("Payment rejected");
      setOpenReject(false);
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
                  {new Date(payment.payment_date).toLocaleDateString("vi-VN")}
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
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Payment Date"
              value={new Date(payment.payment_date).toLocaleDateString("vi-VN")}
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
      {payment.approval_status === "rejected" && payment.reject_reason && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-red-700">Rejection Reason</h3>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="font-bold mb-3">Reject Payment</h3>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border rounded p-2"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setOpenReject(false)}>Cancel</button>
              <button
                onClick={handleReject}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {openAllocateModal && (
        <AllocateModal
          paymentId={payment.id}
          onClose={() => setOpenAllocateModal(false)}
        />
      )}
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

function AllocateModal({
  paymentId,
  onClose,
}: {
  paymentId: number;
  onClose: () => void;
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
          getApPaymentAvailableAmountThunk(paymentId)
        ).unwrap();

        const invoices = await dispatch(
          getApPaymentUnpaidInvoicesThunk(paymentId)
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
    0
  );

  const remaining = availableAmount - totalAllocate;

  const invalid =
    totalAllocate <= 0 ||
    totalAllocate > availableAmount ||
    localInvoices.some(
      (i) => i.allocate_amount! < 0 || i.allocate_amount! > i.unpaid_amount
    );

  /* ===== HANDLERS ===== */
  const handleChange = (id: number, value: string) => {
    const num = Number(value);
    setLocalInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, allocate_amount: num } : i))
    );
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const allocations = localInvoices
        .filter((i) => i.allocate_amount! > 0)
        .map((i) => ({
          invoice_id: i.id,
          amount: i.allocate_amount,
        }));

      await dispatch(
        allocateApPaymentThunk({
          paymentId,
          allocations,
        })
      ).unwrap();

      toast.success("Allocation completed");
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
          <Loader2 className="animate-spin" />
          Loading allocation data...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      {submitting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-sm font-semibold text-gray-700">
              Allocating payment...
            </p>
          </div>
        </div>
      )}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6">
        {/* HEADER */}
        <div className="flex justify-between mb-4">
          <h3 className="text-xl font-bold">Allocate Payment</h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className={submitting ? "opacity-50 cursor-not-allowed" : ""}
          >
            ✕
          </button>
        </div>

        {/* AVAILABLE */}
        <div className="mb-4 flex justify-between">
          <div>
            Available Amount:{" "}
            <span className="font-bold text-blue-600">
              {availableAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* TABLE */}
        <table className="w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border">Invoice</th>
              <th className="p-2 border text-right">Total</th>
              <th className="p-2 border text-right">Unpaid</th>
              <th className="p-2 border text-right">Allocate</th>
            </tr>
          </thead>
          <tbody>
            {localInvoices.map((inv) => (
              <tr key={inv.id}>
                <td className="p-2 border">{inv.invoice_no}</td>
                <td className="p-2 border text-right">
                  {inv.total_after_tax.toLocaleString()}
                </td>
                <td className="p-2 border text-right">
                  {inv.unpaid_amount.toLocaleString()}
                </td>
                <td className="p-2 border text-right">
                  <input
                    type="number"
                    min={0}
                    max={inv.unpaid_amount}
                    value={inv.allocate_amount}
                    onChange={(e) => handleChange(inv.id, e.target.value)}
                    className="w-28 border rounded px-2 py-1 text-right"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="mt-4 flex justify-between">
          <div>
            Remaining:{" "}
            <span
              className={`font-bold ${
                remaining < 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {remaining.toLocaleString()}
            </span>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="border px-4 py-2 rounded">
              Cancel
            </button>
            <button
              disabled={invalid || submitting}
              onClick={handleSubmit}
              className={`px-4 py-2 rounded text-white flex items-center gap-2 ${
                invalid || submitting
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Allocating..." : "Allocate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
