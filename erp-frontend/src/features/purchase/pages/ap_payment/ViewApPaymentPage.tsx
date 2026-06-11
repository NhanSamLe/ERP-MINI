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
        <p className="text-gray-500 font-medium">Đang tải phiếu chi...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-32 text-gray-500">Không tìm thấy phiếu chi</div>
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
      toast.success("Đã gửi duyệt phiếu chi");
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
      toast.success("Đã phê duyệt phiếu chi");
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
      toast.warning("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      setSubmitting(true);
      await dispatch(
        rejectApPaymentThunk({ id: payment.id, reason: rejectReason.trim() }),
      ).unwrap();
      toast.success("Đã từ chối phiếu chi");
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
    <div className="max-w-6xl mx-auto space-y-6 pb-10 bg-gray-50 -m-6 p-6 min-h-screen">
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
                Phiếu chi {payment.payment_no}
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
                Gửi duyệt
              </button>
            )}

            {canApproveReject && (
              <>
                <button
                  onClick={() => setOpenApproveModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md hover:bg-emerald-600"
                >
                  <CheckCircle className="w-4 h-4" />
                  Duyệt
                </button>

                <button
                  onClick={() => setOpenReject(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm shadow-md hover:bg-red-600"
                >
                  Từ chối
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
                Phân bổ cho hóa đơn
              </button>
            )}

            <button
              onClick={() => navigate("/purchase/payments")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-md "
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
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
              Thông tin thanh toán
            </h2>
          </div>

          <div className="space-y-4">
            {/* Amount nổi bật */}
            <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-orange-700">
                Số tiền thanh toán
              </span>
              <span className="text-xl font-bold text-orange-600">
                {Number(payment.amount || 0).toLocaleString("vi-VN", {
                  minimumFractionDigits: 0,
                })}{" "}
                VND
              </span>
            </div>
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Ngày thanh toán"
              value={new Date(payment.payment_date).toLocaleDateString("vi-VN")}
            />
            <InfoRow
              icon={<CreditCard className="w-4 h-4" />}
              label="Phương thức"
              value={payment.method.toUpperCase()}
            />
            <InfoRow
              icon={<CheckCircle className="w-4 h-4" />}
              label="Trạng thái"
              value={payment.status.toUpperCase()}
            />
            {payment.submitted_at && (
              <InfoRow
                icon={<Clock className="w-4 h-4" />}
                label="Gửi duyệt lúc"
                value={new Date(payment.submitted_at).toLocaleString("vi-VN")}
              />
            )}
            {payment.approved_at && (
              <InfoRow
                icon={<CheckCircle className="w-4 h-4" />}
                label="Được duyệt lúc"
                value={new Date(payment.approved_at).toLocaleString("vi-VN")}
              />
            )}
            <InfoRow
              icon={<Clock className="w-4 h-4" />}
              label="Phê duyệt"
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
              Thông tin nhà cung cấp
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 uppercase mb-1">
                Công ty
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
                Số điện thoại
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
        <UserCard title="Người tạo" user={payment.creator} />
        <UserCard
          title="Người duyệt"
          user={payment.approver}
          empty="Đang chờ duyệt"
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
                Lý do từ chối
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
                Gửi phê duyệt?
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Sau khi gửi, phiếu chi này sẽ được gửi đi phê duyệt và bạn sẽ không thể chỉnh sửa được nữa.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenSubmitModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Hủy
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
                {submitting ? "Đang gửi..." : "Xác nhận gửi"}
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
                Phê duyệt phiếu chi này?
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Hành động này sẽ phê duyệt phiếu chi và cho phép xử lý tiếp theo.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenApproveModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Hủy
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
                Xác nhận duyệt
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
                  Từ chối phiếu chi
                </h3>
                <p className="text-xs text-gray-500">
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Vui lòng giải thích lý do từ chối phiếu chi này..."
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none resize-none"
            />
            {rejectReason.trim() === "" && (
              <p className="text-xs text-red-500 mt-1">Lý do là bắt buộc</p>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setOpenReject(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Hủy
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
                {submitting ? "Đang từ chối..." : "Xác nhận từ chối"}
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

      {/* ================= ALLOCATION STATUS PANEL ================= */}
      {(payment as any).allocation_status && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Trạng thái phân bổ
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                (payment as any).allocation_status === "fully_allocated"
                  ? "bg-green-100 text-green-700"
                  : (payment as any).allocation_status === "partially_allocated"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-600"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  (payment as any).allocation_status === "fully_allocated"
                    ? "bg-green-500"
                    : (payment as any).allocation_status ===
                        "partially_allocated"
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
              />
              {(payment as any).allocation_status === "fully_allocated"
                ? "Phân bổ toàn bộ"
                : (payment as any).allocation_status === "partially_allocated"
                  ? "Phân bổ một phần"
                  : "Chưa phân bổ"}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-600 font-medium mb-1">
                Số tiền thanh toán
              </p>
              <p className="text-lg font-bold text-blue-700">
                {Number(payment.amount ?? 0).toLocaleString("vi-VN")} VND
              </p>
            </div>
            {(payment as any).transaction_reference && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Tham chiếu giao dịch
                </p>
                <p className="font-semibold text-gray-800">
                  {(payment as any).transaction_reference}
                </p>
              </div>
            )}
            {((payment as any).bankAccount || (payment as any).bank_account_id) && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Tài khoản ngân hàng
                </p>
                {(payment as any).bankAccount ? (
                  <>
                    <p className="font-semibold text-gray-800">
                      {(payment as any).bankAccount.bank_name} - {(payment as any).bankAccount.account_number}
                    </p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
                      {(payment as any).bankAccount.account_name}
                    </p>
                  </>
                ) : (
                  <p className="font-semibold text-gray-800">
                    #{(payment as any).bank_account_id}
                  </p>
                )}
              </div>
            )}
          </div>
          {(payment as any).allocation_status === "unallocated" && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700 font-medium">
                ⚠️ Khoản thanh toán này chưa được phân bổ cho bất kỳ hóa đơn nào. Vui lòng phân bổ để giảm công nợ nhà cung cấp.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= AUDIT LOG ================= */}
      <AuditLogCard
        title="Lịch sử hoạt động"
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

      toast.success("Phân bổ thanh công");
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
            Đang tải dữ liệu phân bổ...
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
                Đang phân bổ thanh toán...
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
                Phân bổ thanh toán
              </h3>
              <p className="text-xs text-gray-500">
                Gán khoản thanh toán cho các hóa đơn còn nợ
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
              Khả dụng
            </p>
            <p className="text-lg font-bold text-blue-700">
              {availableAmount.toLocaleString("vi-VN", {
                minimumFractionDigits: 0,
              })}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-xs text-purple-600 font-medium mb-0.5">
              Đang phân bổ
            </p>
            <p className="text-lg font-bold text-purple-700">
              {totalAllocate.toLocaleString("vi-VN", {
                minimumFractionDigits: 0,
              })}
            </p>
          </div>
          <div
            className={`rounded-xl p-3 text-center ${remaining < 0 ? "bg-red-50" : "bg-green-50"}`}
          >
            <p
              className={`text-xs font-medium mb-0.5 ${remaining < 0 ? "text-red-600" : "text-green-600"}`}
            >
              Còn lại
            </p>
            <p
              className={`text-lg font-bold ${remaining < 0 ? "text-red-700" : "text-green-700"}`}
            >
              {remaining.toLocaleString("vi-VN", { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* FILL MAX BUTTON */}
        <div className="flex justify-end mb-3">
          <button
            onClick={handleFillMax}
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-400 px-3 py-1.5 rounded-lg transition"
          >
            ⚡ Tự động điền tối đa
          </button>
        </div>

        {/* TABLE */}
        {localInvoices.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Không tìm thấy hóa đơn chưa thanh toán nào của nhà cung cấp này.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Hóa đơn
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Tổng cộng
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Chưa thanh toán
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Phân bổ
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
                        {Number(inv.total_after_tax).toLocaleString("vi-VN", {
                          minimumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-orange-600">
                        {Number(inv.unpaid_amount).toLocaleString("vi-VN", {
                          minimumFractionDigits: 0,
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
                            Vượt quá số tiền chưa thanh toán
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
            Hủy
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
            {submitting ? "Đang phân bổ..." : "Xác nhận phân bổ"}
          </button>
        </div>
      </div>
    </div>
  );
}
