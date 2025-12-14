import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  approveApInvoiceThunk,
  getApInvoiceByIdThunk,
  rejectApInvoiceThunk,
  submitApInvoiceThunk,
} from "../../store/apInvoice/apInvoice.thunks";
import {
  Loader2,
  FileText,
  Calendar,
  Building2,
  User,
  Package,
  ShoppingCart,
  CheckCircle,
  Clock,
  TrendingUp,
  Mail,
  Phone,
  Send,
  ArrowLeft,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { Roles } from "@/types/enum";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";
import {
  ApInvoiceApprovalStatus,
  ApInvoiceStatus,
} from "../../store/apInvoice/apInvoice.types";
import { PurchaseOrderStatus } from "../../store/purchaseOrder.types";

export default function ViewApInvoicePage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { selected, loading } = useAppSelector((s) => s.apInvoice);
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);

  const [openSubmitModal, setOpenSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openApproveModal, setOpenApproveModal] = useState(false);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (id) dispatch(getApInvoiceByIdThunk(Number(id)));
  }, [id, dispatch]);
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
        <p className="text-gray-500 font-medium">Loading invoice...</p>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <FileText className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-700 font-semibold text-lg">Invoice not found</p>
        <p className="text-gray-500 text-sm mt-1">
          The requested invoice could not be loaded
        </p>
      </div>
    );
  }

  const invoice = selected;
  const po = invoice.order;
  const canSubmitForApproval =
    user?.role.code === Roles.ACCOUNT &&
    user?.branch.id === invoice.branch_id &&
    invoice.created_by === user.id &&
    invoice.approval_status === "draft";

  const canApproveOrReject =
    user?.role.code === Roles.CHACC &&
    invoice.approval_status === "waiting_approval" &&
    invoice.created_by !== user.id &&
    user?.branch.id === invoice.branch_id;

  const getInvoiceStatusBadge = (status: ApInvoiceStatus) => {
    const colors: Record<ApInvoiceStatus, string> = {
      draft: "bg-gray-50 text-gray-700 border-gray-200",
      posted: "bg-blue-50 text-blue-700 border-blue-200",
      paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };

    return colors[status];
  };

  const getApprovalStatusBadge = (status: ApInvoiceApprovalStatus) => {
    const colors: Record<ApInvoiceApprovalStatus, string> = {
      draft: "bg-gray-50 text-gray-700 border-gray-200",
      waiting_approval: "bg-amber-50 text-amber-700 border-amber-200",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
    };

    return colors[status];
  };

  const getPoStatusBadge = (status: PurchaseOrderStatus) => {
    const map: Record<PurchaseOrderStatus, string> = {
      draft: "bg-gray-50 text-gray-700 border-gray-200",
      waiting_approval: "bg-amber-50 text-amber-700 border-amber-200",
      confirmed: "bg-blue-50 text-blue-700 border-blue-200",
      partially_received: "bg-purple-50 text-purple-700 border-purple-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    return map[status];
  };

  const handleSubmitForApproval = async () => {
    if (!invoice?.id || submitting) return;

    try {
      setSubmitting(true);
      await dispatch(submitApInvoiceThunk(invoice.id)).unwrap();
      toast.success("Invoice submitted for approval successfully");
      setOpenSubmitModal(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!invoice?.id) return;

    try {
      setSubmitting(true);
      await dispatch(approveApInvoiceThunk(invoice.id)).unwrap();
      toast.success("Invoice approved successfully");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };
  const handleReject = async () => {
    if (!invoice?.id) return;

    if (!rejectReason.trim()) {
      toast.warning("Please enter reject reason");
      return;
    }

    try {
      setSubmitting(true);
      await dispatch(
        rejectApInvoiceThunk({
          id: invoice.id,
          reason: rejectReason.trim(),
        })
      ).unwrap();

      toast.success("Invoice rejected successfully");
      setOpenRejectModal(false);
      setRejectReason("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* ================= HEADER ================= */}
      <div className="bg-gradient-to-r from-white via-orange-50/30 to-white rounded-2xl border-2 border-orange-100 p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Invoice {invoice.invoice_no}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Created:{" "}
                  {new Date(invoice.invoice_date).toLocaleDateString("vi-VN")}
                </span>
                <span className="text-gray-400">•</span>
                <Clock className="w-4 h-4" />
                <span>
                  Due: {new Date(invoice.due_date).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex gap-3 items-center">
            {canSubmitForApproval && (
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold text-sm shadow-md hover:bg-orange-600 transition"
                onClick={() => setOpenSubmitModal(true)}
              >
                <Send className="w-4 h-4" />
                Submit for approval
              </button>
            )}
            {/* CHACC ACTIONS */}
            {canApproveOrReject && (
              <>
                {/* APPROVE */}
                <button
                  disabled={submitting}
                  onClick={() => setOpenApproveModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md hover:bg-emerald-600 transition disabled:opacity-60"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>

                {/* REJECT */}
                <button
                  disabled={submitting}
                  onClick={() => setOpenRejectModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm shadow-md hover:bg-red-600 transition disabled:opacity-60"
                >
                  Cancel
                </button>
              </>
            )}

            {/* BACK BUTTON */}
            <button
              onClick={() => navigate("/purchase/invoices")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold text-sm shadow-md hover:bg-orange-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Invoices
            </button>

            {/* STATUS */}
            <div
              className={`px-4 py-2 rounded-xl border-2 font-semibold text-sm flex items-center gap-2   ${getInvoiceStatusBadge(
                invoice.status
              )}`}
            >
              <div className="w-2 h-2 rounded-full bg-current"></div>
              {invoice.status.toUpperCase()}
            </div>

            <div
              className={`px-4 py-2 rounded-xl border-2 font-semibold text-sm flex items-center gap-2  ${getApprovalStatusBadge(
                invoice.approval_status
              )}`}
            >
              <CheckCircle className="w-4 h-4" />
              {invoice.approval_status.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* ================= INFO GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Info */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Invoice Information
            </h2>
          </div>

          <div className="space-y-4">
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Invoice Date"
              value={new Date(invoice.invoice_date).toLocaleDateString("vi-VN")}
            />
            <InfoRow
              icon={<Clock className="w-4 h-4" />}
              label="Due Date"
              value={new Date(invoice.due_date).toLocaleDateString("vi-VN")}
            />
            <InfoRow
              icon={<Building2 className="w-4 h-4" />}
              label="Branch"
              value={invoice.branch?.name}
            />
            <InfoRow
              icon={<User className="w-4 h-4" />}
              label="Created By"
              value={invoice.creator?.full_name}
            />
            {invoice.approver && (
              <InfoRow
                icon={<CheckCircle className="w-4 h-4" />}
                label="Approved By"
                value={invoice.approver.full_name}
              />
            )}
            {invoice.approval_status === "rejected" &&
              invoice.reject_reason && (
                <div className="mt-4 rounded-xl border-2 border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-white" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-red-700 mb-1">
                        Rejection Reason
                      </p>
                      <p className="text-sm text-red-800 whitespace-pre-line">
                        {invoice.reject_reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* PO Info */}
        {po && (
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Purchase Order
              </h2>
            </div>

            <div className="space-y-4">
              <InfoRow
                icon={<FileText className="w-4 h-4" />}
                label="PO Number"
                value={po.po_no}
                highlight
              />
              <InfoRow
                icon={<Calendar className="w-4 h-4" />}
                label="Order Date"
                value={
                  po?.order_date
                    ? new Date(po.order_date).toLocaleDateString("vi-VN")
                    : "-"
                }
              />
              <InfoRow
                icon={<CheckCircle className="w-4 h-4" />}
                label="Status"
                value={
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${getPoStatusBadge(
                      po.status
                    )}`}
                  >
                    {po.status.toUpperCase()}
                  </span>
                }
              />
              {po.description && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Description
                  </p>
                  <p className="text-sm text-gray-700">{po.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* ================= USER INFO ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CREATOR */}
        <UserCard title="Created By" user={invoice.creator} color="orange" />

        {/* APPROVER */}
        <UserCard
          title="Approved By"
          user={invoice.approver}
          color="green"
          emptyText="Waiting for approval"
        />
      </div>

      {/* ================= SUPPLIER INFO ================= */}
      {po?.supplier && (
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
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700 uppercase">
                  Company
                </span>
              </div>
              <p className="font-bold text-gray-900">{po.supplier.name}</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700 uppercase">
                  Email
                </span>
              </div>
              <p className="font-medium text-gray-900 text-sm">
                {po.supplier.email}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700 uppercase">
                  Phone
                </span>
              </div>
              <p className="font-medium text-gray-900 text-sm">
                {po.supplier.phone}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= PO LINES ================= */}
      {invoice.lines && invoice.lines.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b-2 border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Invoice Items
                </h2>
                <p className="text-sm text-gray-500">
                  {invoice.lines.length} items
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Line Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {invoice.lines?.map((line, idx) => (
                  <tr
                    key={line.id}
                    className="hover:bg-orange-50/30 transition-colors"
                  >
                    {/* PRODUCT */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {/* IMAGE */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {line.product?.image_url ? (
                            <img
                              src={line.product.image_url}
                              alt={line.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>

                        {/* INFO */}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {line.product?.name ?? "Unknown product"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Item {idx + 1}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* QUANTITY */}
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                        {line.quantity}
                      </span>
                    </td>

                    {/* UNIT PRICE */}
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-gray-700">
                        {Number(line.unit_price).toLocaleString("vi-VN")} VND
                      </span>
                    </td>

                    {/* LINE TOTAL */}
                    <td className="px-6 py-4 text-right">
                      <span className="text-base font-bold text-gray-900">
                        {Number(line.line_total).toLocaleString("vi-VN")} VND
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TOTAL ================= */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Payment Summary</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AmountCard
            label="Subtotal"
            value={invoice.total_before_tax}
            color="slate"
          />
          <AmountCard
            label="Tax (10%)"
            value={invoice.total_tax}
            color="blue"
          />
          <AmountCard
            label="Total Amount"
            value={invoice.total_after_tax}
            color="orange"
            highlight
          />
        </div>
      </div>
      {openSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in">
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Send className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Submit for approval?
              </h3>
            </div>

            {/* CONTENT */}
            <p className="text-sm text-gray-600 mb-6">
              Once submitted, this invoice will be sent for approval and you
              will not be able to edit it anymore.
            </p>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenSubmitModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmitForApproval}
                className={`px-4 py-2 rounded-xl font-semibold shadow-md transition
    ${
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

      {openApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Approve this invoice?
              </h3>
            </div>

            {/* CONTENT */}
            <p className="text-sm text-gray-600 mb-6">
              This action will approve the invoice and allow further processing.
            </p>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenApproveModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                disabled={submitting}
                onClick={async () => {
                  await handleApprove();
                  setOpenApproveModal(false);
                }}
                className={`px-4 py-2 rounded-xl font-semibold shadow-md transition
            ${
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

      {openRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in">
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Reject this invoice?
              </h3>
            </div>

            {/* CONTENT */}
            <p className="text-sm text-gray-600 mb-3">
              Please provide a reason for rejecting this invoice.
            </p>

            {/* REASON INPUT */}
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Enter reject reason..."
              className="w-full rounded-xl border border-gray-300 p-3 text-sm
        focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400
        resize-none"
            />

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setOpenRejectModal(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                disabled={submitting}
                onClick={handleReject}
                className={`px-4 py-2 rounded-xl font-semibold shadow-md transition
            ${
              submitting
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
              >
                {submitting ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= COMPONENTS ================= */

function InfoRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
        highlight ? "bg-purple-50" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-2 text-gray-600">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div
        className={`text-sm font-bold ${
          highlight ? "text-purple-700" : "text-gray-900"
        }`}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function AmountCard({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
}) {
  const colors = {
    slate: "bg-slate-50 border-slate-200",
    blue: "bg-blue-50 border-blue-200",
    orange: "bg-orange-50 border-orange-200",
  };

  const textColors = {
    slate: "text-slate-700",
    blue: "text-blue-700",
    orange: "text-orange-700",
  };

  return (
    <div
      className={`p-6 rounded-xl border-2 ${
        colors[color as keyof typeof colors]
      } ${highlight ? "shadow-lg ring-2 ring-orange-200" : "shadow-sm"}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`text-xs font-bold uppercase tracking-wider ${
            textColors[color as keyof typeof textColors]
          }`}
        >
          {label}
        </div>
      </div>
      <div
        className={`text-2xl font-bold ${
          highlight ? "text-orange-600" : "text-gray-900"
        }`}
      >
        {Number(value).toLocaleString("vi-VN")}
      </div>
      <div className="text-xs text-gray-500 font-medium mt-1">VND</div>
    </div>
  );
}

function UserCard({
  title,
  user,
  color,
  emptyText,
}: {
  title: string;
  user?: {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    avatar_url?: string | null;
  } | null;
  color: "orange" | "green" | "blue";
  emptyText?: string;
}) {
  const bg = {
    orange: "bg-orange-50 border-orange-200",
    green: "bg-emerald-50 border-emerald-200",
    blue: "bg-blue-50 border-blue-200",
  };

  const iconBg = {
    orange: "bg-orange-500",
    green: "bg-emerald-500",
    blue: "bg-blue-500",
  };

  return (
    <div className={`rounded-2xl border-2 p-6 shadow-sm ${bg[color]}`}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${iconBg[color]}`}
        >
          <User className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>

      {user ? (
        <div className="flex items-center gap-4">
          {/* AVATAR */}
          <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-500" />
            )}
          </div>

          {/* INFO */}
          <div className="space-y-1">
            <p className="font-bold text-gray-900">{user.full_name}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              {user.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              {user.phone}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-gray-500 italic">
          <Clock className="w-5 h-5" />
          {emptyText || "No data"}
        </div>
      )}
    </div>
  );
}
