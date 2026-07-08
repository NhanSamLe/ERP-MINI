import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getApPaymentByIdThunk,
  submitApPaymentThunk,
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
  Mail,
  Phone,
  PenTool,
  FileText,
} from "lucide-react";
import { useApPaymentExport } from "../../hooks/useApPaymentExport";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { Roles } from "@/types/enum";
import { UnpaidInvoice } from "../../store/apPayment/apPayment.types";
import {
  ApprovalStatus,
  ApPaymentStatus,
} from "../../constants/purchaseStatus.enum";
import { AuditLogCard, StatusBadge } from "../../components/Common";
import SignatureModal from "@/features/purchase/components/SignatureModal";
import { apPaymentApi } from "../../api/apPayment.api";

export default function ViewApPaymentPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { selected: payment, loading } = useAppSelector((s) => s.apPayment);
  const { user } = useAppSelector((s) => s.auth);
  const { exporting, exportToPDF } = useApPaymentExport(payment as any);

  const [submitting, setSubmitting] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [openSubmitModal, setOpenSubmitModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [openAllocateModal, setOpenAllocateModal] = useState(false);

  // Digital Signature Modal States
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signing, setSigning] = useState(false);

  // ✅ Phase 2: Audit log state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  useEffect(() => {
    if (id) dispatch(getApPaymentByIdThunk(Number(id)));
  }, [id, dispatch]);

  const refreshAuditLogs = async () => {
    if (!id) return;
    try {
      setLoadingAuditLogs(true);
      const res = await dispatch(getApPaymentAuditLogsThunk(Number(id))).unwrap();
      setAuditLogs(res);
    } catch {
      /* silent */
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    refreshAuditLogs();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-gray-500 text-sm font-medium">
          Đang tải chi tiết phiếu chi...
        </p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-32 text-gray-500">Không tìm thấy phiếu chi</div>
    );
  }

  /* ================= PERMISSIONS ================= */
  const isPaymentManager = user?.role.code === Roles.CHACC;
  const isPaymentStaff   = user?.role.code === Roles.ACCOUNT;
  const isPaymentCreator = payment.created_by === user?.id;
  const isPaymentSameBranch = user?.branch?.id === (payment as any).branch_id;

  // Nhân viên chỉ gửi duyệt khi chính mình tạo; Quản lý gửi được bất kỳ phiếu nào cùng chi nhánh
  const canSubmit =
    payment.approval_status === ApprovalStatus.DRAFT &&
    payment.status === ApPaymentStatus.DRAFT &&
    (
      (isPaymentStaff && isPaymentCreator) ||
      isPaymentManager
    );

  const canApproveReject =
    user?.role.code === Roles.CHACC &&
    payment.approval_status === ApprovalStatus.WAITING_APPROVAL;

  const canAllocate =
    payment.status === ApPaymentStatus.POSTED &&
    payment.approval_status === ApprovalStatus.APPROVED &&
    (
      (isPaymentStaff && isPaymentCreator) ||
      isPaymentManager
    );

  /* ================= HANDLERS ================= */
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await dispatch(submitApPaymentThunk(payment.id)).unwrap();
      toast.success("Đã gửi duyệt phiếu chi");
      setOpenSubmitModal(false);
      refreshAuditLogs();
      dispatch(getApPaymentByIdThunk(payment.id));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSign = async (pin: string, signatureImage: string) => {
    setSigning(true);
    try {
      await apPaymentApi.sign(payment.id, pin, signatureImage);
      toast.success("Ký duyệt phiếu chi thành công!");
      setIsSignModalOpen(false);
      dispatch(getApPaymentByIdThunk(payment.id));
      refreshAuditLogs();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Ký duyệt phiếu chi thất bại";
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setSigning(false);
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
      dispatch(getApPaymentByIdThunk(payment.id));
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
                  onClick={() => setIsSignModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md hover:bg-emerald-600"
                >
                  <PenTool className="w-4 h-4" />
                  Ký duyệt
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
            {payment && ["posted", "completed"].includes(payment.status) && (
              <button
                disabled={exporting}
                onClick={() => exportToPDF("vi")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold text-sm shadow-sm hover:bg-red-100 transition disabled:opacity-60"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                ) : (
                  <FileText className="w-4 h-4 text-red-600" />
                )}
                {exporting ? "Đang xuất..." : "Xuất PDF"}
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
            <StatusBadge
              status={payment.status}
              className="px-4 py-2 text-sm rounded-xl border-2"
            />

            <StatusBadge
              status={payment.approval_status}
              variant="approval"
              className="px-4 py-2 text-sm rounded-xl border-2"
            />
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
              value={<StatusBadge status={payment.status} />}
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
              value={<StatusBadge status={payment.approval_status} variant="approval" />}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Thông tin nhà cung cấp
            </h2>
          </div>

          <div className="space-y-4">
            {/* Nhà cung cấp nổi bật */}
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-700">
                Nhà cung cấp
              </span>
              <span className="font-bold text-blue-600">
                {payment.supplier?.name}
              </span>
            </div>

            <InfoRow
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              value={payment.supplier?.email ?? "-"}
            />

            <InfoRow
              icon={<Phone className="w-4 h-4" />}
              label="Số điện thoại"
              value={payment.supplier?.phone ?? "-"}
            />
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

      {/* Verified Digital Signature */}
      {payment && payment.signatures && payment.signatures.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Thông tin chữ ký số điện tử xác thực
            </h2>
          </div>
          <div className="p-5 flex flex-col md:flex-row items-center gap-6 bg-orange-50/10 rounded-xl border border-orange-100">
            <div className="border border-gray-200 bg-white p-3 rounded-lg shadow-inner flex items-center justify-center w-full md:w-auto">
              <img
                src={payment.signatures[0].signature_image}
                alt="Signature"
                className="h-20 object-contain max-w-[200px]"
              />
            </div>
            <div className="flex-1 space-y-2 text-sm w-full">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <CheckCircle className="w-4 h-4" />
                Phiếu chi đã được ký số điện tử bảo mật thành công bởi Kế toán trưởng
              </div>
              <div className="text-xs text-gray-500">
                <p className="font-semibold text-gray-700">Mã băm tài liệu (Document Hash):</p>
                <p className="font-mono bg-gray-50 p-2 rounded border border-gray-100 text-[10px] break-all select-all text-orange-600">
                  {payment.signatures[0].hash_value}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                <p>Người ký: <span className="font-semibold text-gray-700">{payment.signatures[0].signer?.full_name}</span></p>
                <p>Thời gian: <span className="font-semibold text-gray-700">{new Date(payment.signatures[0].signed_at).toLocaleString("vi-VN")}</span></p>
                <p className="col-span-2">IP Ký: <span className="font-semibold text-gray-700">{payment.signatures[0].signer_ip || "N/A"}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* ================= REJECT MODAL ================= */}
      {openReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Từ chối phiếu chi?
              </h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600">
                Nhập lý do từ chối phê duyệt phiếu chi này:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setOpenReject(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                disabled={submitting || !rejectReason.trim()}
                onClick={handleReject}
                className={`px-4 py-2 rounded-xl font-semibold shadow-md transition ${
                  submitting || !rejectReason.trim()
                    ? "bg-red-350 cursor-not-allowed text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {submitting ? "Đang xử lý..." : "Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ALLOCATE MODAL ================= */}
      {openAllocateModal && (
        <AllocateModal
          payment={payment}
          onClose={() => setOpenAllocateModal(false)}
          refreshPayment={() => dispatch(getApPaymentByIdThunk(payment.id))}
          refreshAuditLogs={refreshAuditLogs}
        />
      )}

      {/* ================= SIGNATURE MODAL ================= */}
      <SignatureModal
        visible={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onConfirm={handleSign}
        title="Ký duyệt Phiếu chi AP Payment"
        loading={signing}
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
          {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
        </>
      ) : (
        <p className="text-sm text-gray-400 italic">{empty ?? "N/A"}</p>
      )}
    </div>
  );
}

/* ================= ALLOCATE MODAL COMPONENT ================= */

interface AllocateModalProps {
  payment: any;
  onClose: () => void;
  refreshPayment: () => void;
  refreshAuditLogs: () => void;
}

function AllocateModal({
  payment,
  onClose,
  refreshPayment,
  refreshAuditLogs,
}: AllocateModalProps) {
  const dispatch = useAppDispatch();
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableAmount, setAvailableAmount] = useState(0);

  // Local allocations state
  const [allocations, setAllocations] = useState<Record<number, number>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [avail, invoices] = await Promise.all([
          dispatch(getApPaymentAvailableAmountThunk(payment.id)).unwrap(),
          dispatch(getApPaymentUnpaidInvoicesThunk(payment.id)).unwrap(),
        ]);
        setAvailableAmount(Number(avail.available_amount || 0));
        setUnpaidInvoices(invoices || []);

        // Init allocations to 0
        const init: Record<number, number> = {};
        (invoices || []).forEach((inv: any) => {
          init[inv.id] = 0;
        });
        setAllocations(init);
      } catch (e) {
        toast.error("Không thể tải danh sách hóa đơn chưa thanh toán");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [payment.id, dispatch]);

  const handleAmountChange = (invoiceId: number, val: string) => {
    const num = Number(val) || 0;
    setAllocations((prev) => ({
      ...prev,
      [invoiceId]: num,
    }));
  };

  const handleMax = (invoice: UnpaidInvoice) => {
    const remainingToPay = invoice.unpaid_amount;
    const currentlyAllocatedOthers = totalAllocated - (allocations[invoice.id] || 0);
    const maxAllowedByAvailable = availableAmount - currentlyAllocatedOthers;
    const finalAmount = Math.max(0, Math.min(remainingToPay, maxAllowedByAvailable));

    setAllocations((prev) => ({
      ...prev,
      [invoice.id]: finalAmount,
    }));
  };

  const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
  const isOverAvailable = totalAllocated > availableAmount;

  // Validate per line
  let invalid = isOverAvailable || totalAllocated <= 0;
  unpaidInvoices.forEach((inv) => {
    const val = allocations[inv.id] || 0;
    if (val < 0 || val > inv.unpaid_amount) {
      invalid = true;
    }
  });

  const handleSubmit = async () => {
    if (invalid) return;
    const payload = Object.entries(allocations)
      .filter(([_, amount]) => amount > 0)
      .map(([invoiceId, amount]) => ({
        invoice_id: Number(invoiceId),
        amount,
      }));

    try {
      setSubmitting(true);
      await dispatch(
        allocateApPaymentThunk({ paymentId: payment.id, allocations: payload }),
      ).unwrap();
      toast.success("Phân bổ thanh toán thành công!");
      refreshPayment();
      refreshAuditLogs();
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Phân bổ thanh toán cho Hóa đơn
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Số tiền khả dụng để phân bổ:{" "}
          <span className="font-bold text-orange-600">
            {availableAmount.toLocaleString("vi-VN")} VND
          </span>
        </p>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : unpaidInvoices.length === 0 ? (
          <p className="text-center py-10 text-gray-500 text-sm">
            Không tìm thấy hóa đơn nào chưa thanh toán của nhà cung cấp này.
          </p>
        ) : (
          <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Số hóa đơn</th>
                  <th className="px-4 py-3 text-right">Tổng tiền</th>
                  <th className="px-4 py-3 text-right">Còn lại</th>
                  <th className="px-4 py-3 text-right w-48">Nhập số tiền phân bổ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unpaidInvoices.map((inv) => {
                  const val = allocations[inv.id] || 0;
                  const isLineOver = val > inv.unpaid_amount;
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {inv.invoice_no}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">
                        {Number(inv.total_after_tax).toLocaleString("vi-VN")} VND
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {Number(inv.unpaid_amount).toLocaleString("vi-VN")} VND
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <input
                            type="number"
                            value={val || ""}
                            onChange={(e) =>
                              handleAmountChange(inv.id, e.target.value)
                            }
                            placeholder="0"
                            className={`w-32 px-3 py-1.5 border rounded-lg text-right text-sm font-semibold focus:outline-none focus:ring-2 ${
                              isLineOver
                                ? "border-red-500 focus:ring-red-500/20"
                                : "border-gray-200 focus:ring-purple-500/20 focus:border-purple-500"
                            }`}
                          />
                          <button
                            onClick={() => handleMax(inv)}
                            className="text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1.5 rounded-lg border border-purple-100"
                          >
                            MAX
                          </button>
                        </div>
                        {isLineOver && (
                          <p className="text-[10px] text-red-500 font-semibold mt-1">
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
