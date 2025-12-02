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

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const receiptId = Number(id);
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const { selected: receipt, loading, unpaidInvoices } = useAppSelector(
    (s) => s.receipt
  );
  const { user } = useAppSelector((s) => s.auth);

  // Modals & Panels
  const [showAllocPanel, setShowAllocPanel] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [alloc, setAlloc] = useState<Record<number, number>>({});
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (receiptId) {
      dispatch(fetchReceiptDetail(receiptId));
    }
  }, [dispatch, receiptId]);

  if (loading || !receipt) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">No Permission</p>
        </div>
      </div>
    );
  }

  const isAccountant = user?.role?.code === "ACCOUNT";
  const isChiefAcc = user?.role?.code === "CHACC";

  const isDraft = receipt.status === "draft";
  const isPosted = receipt.status === "posted";
  const isApproved = receipt.approval_status === "approved";
  const isRejected = receipt.approval_status === "rejected";
  const isWaitingApproval = receipt.approval_status === "waiting_approval";

  const handleSubmit = () => {
    dispatch(submitReceipt(receiptId));
  };

  const handleApprove = () => {
    dispatch(approveReceipt(receiptId));
  };

  const handleAllocate = () => {
    dispatch(fetchUnpaidInvoices(receipt.customer_id));
    setShowAllocPanel(true);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert("Please enter rejection reason");
      return;
    }
    dispatch(rejectReceipt({ id: receiptId, reason: rejectReason }));
    setRejectModalOpen(false);
    setRejectReason("");
  };

  const handleApplyAllocation = () => {
    const allocations = Object.entries(alloc)
      .filter(([, val]) => val > 0)
      .map(([id, val]) => ({
        invoice_id: Number(id),
        applied_amount: val,
      }));

    if (allocations.length === 0) {
      alert("Please allocate at least one invoice");
      return;
    }

    const totalAlloc = allocations.reduce((sum, a) => sum + a.applied_amount, 0);
    if (totalAlloc > receipt.amount) {
      alert(`Total allocation (${totalAlloc.toLocaleString()}) exceeds receipt amount (${receipt.amount.toLocaleString()})`);
      return;
    }

    dispatch(allocateReceipt({ id: receiptId, allocations }));
    setShowAllocPanel(false);
    setAlloc({});
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const totalAllocated = receipt.allocations
    ? receipt.allocations.reduce((sum, a) => sum + a.applied_amount!, 0)
    : 0;

  const remainingAmount = receipt.amount - totalAllocated;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <button
            onClick={() => navigate("/ar/receipts")}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            Receipts
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{receipt.receipt_no}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {receipt.receipt_no}
              </h1>
              <p className="text-gray-500">
                Receipt ID: <span className="text-gray-700 font-mono">#{receipt.id}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap justify-end">
              {/* ACCOUNT: Submit */}
              {isAccountant && isDraft && !isRejected && (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                >
                  Submit for Approval
                </button>
              )}

              {/* ACCOUNT: Resubmit after reject */}
              {isAccountant && isDraft && isRejected && (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                >
                  Resubmit
                </button>
              )}

              {/* CHACC: Approve */}
              {isChiefAcc && isWaitingApproval && (
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Approve
                </button>
              )}

              {/* CHACC: Reject */}
              {isChiefAcc && isWaitingApproval && (
                <button
                  onClick={() => setRejectModalOpen(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Reject
                </button>
              )}

              {/* ACCOUNT: Allocate (after approved) */}
              {isAccountant && isPosted && isApproved && (
                <button
                  onClick={handleAllocate}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Allocate to Invoices
                </button>
              )}
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">
                Receipt Status
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    receipt.status === "draft"
                      ? "bg-gray-400"
                      : receipt.status === "posted"
                      ? "bg-blue-500"
                      : "bg-green-500"
                  }`}
                ></span>
                <span className="text-sm font-medium text-gray-900">
                  {receipt.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Date: {formatDate(receipt.receipt_date)}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">
                Approval Status
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    receipt.approval_status === "draft"
                      ? "bg-gray-400"
                      : receipt.approval_status === "waiting_approval"
                      ? "bg-yellow-400"
                      : receipt.approval_status === "approved"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                ></span>
                <span className="text-sm font-medium text-gray-900">
                  {receipt.approval_status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              {receipt.submitted_at && (
                <p className="text-xs text-gray-500 mt-2">
                  Submitted: {formatDate(receipt.submitted_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left - Receipt Info */}
          <div className="col-span-2 space-y-6">
            {/* Receipt Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-600 rounded"></div>
                Receipt Details
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Customer
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {receipt.customer?.name || "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {receipt.customer?.phone || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Payment Method
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {receipt.method || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Receipt Date
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {formatDate(receipt.receipt_date)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Receipt Amount
                  </p>
                  <p className="text-sm text-gray-900 font-bold">
                    {formatCurrency(receipt.amount)}
                  </p>
                </div>

              
              </div>

              {/* Creator & Approver Info */}
              <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Created By
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {receipt.creator?.full_name || receipt.creator?.username}
                  </p>
                </div>

                {receipt.approver && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                      Approved By
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      {receipt.approver.full_name || receipt.approver.username}
                    </p>
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {isRejected && receipt.reject_reason && (
                <div className="mt-6 pt-6 border-t border-red-200 bg-red-50 p-4 rounded">
                  <p className="text-xs text-red-600 uppercase font-semibold mb-2">
                    Rejection Reason
                  </p>
                  <p className="text-sm text-red-700">{receipt.reject_reason}</p>
                </div>
              )}
            </div>

            {/* Allocations */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-green-600 rounded"></div>
                Allocations
              </h2>

              {receipt.allocations && receipt.allocations.length > 0 ? (
                <div className="space-y-3">
                  {receipt.allocations.map((alloc, idx) => (
                    <div
                      key={alloc.id || idx}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {alloc.invoice?.invoice_no}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Invoice Total: {formatCurrency(alloc.invoice?.total_after_tax || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">
                          {formatCurrency(alloc.applied_amount || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No allocations yet.</p>
              )}
            </div>
          </div>

          {/* Right - Summary */}
          <div className="col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-indigo-600 rounded"></div>
                Summary
              </h3>

              <div className="space-y-4">
                {/* Receipt Amount */}
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Receipt Amount
                  </p>
                  <p className="text-2xl font-bold text-indigo-600 mt-2">
                    {formatCurrency(receipt.amount)}
                  </p>
                </div>

                {/* Allocated */}
                {totalAllocated > 0 && (
                  <>
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 uppercase font-semibold">
                        Allocated Amount
                      </p>
                      <p className="text-lg font-semibold text-green-600 mt-2">
                        {formatCurrency(totalAllocated)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 uppercase font-semibold">
                        Remaining Amount
                      </p>
                      <p
                        className={`text-lg font-semibold mt-2 ${
                          remainingAmount === 0
                            ? "text-gray-600"
                            : "text-orange-600"
                        }`}
                      >
                        {formatCurrency(remainingAmount)}
                      </p>
                    </div>
                  </>
                )}

                {/* Progress Bar */}
                {receipt.allocations && receipt.allocations.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            receipt.amount > 0
                              ? (totalAllocated / receipt.amount) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {receipt.amount > 0
                        ? ((totalAllocated / receipt.amount) * 100).toFixed(1)
                        : 0}
                      % allocated
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                      Status
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        receipt.status === "draft"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {receipt.status.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                      Approval
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        receipt.approval_status === "approved"
                          ? "bg-green-100 text-green-800"
                          : receipt.approval_status === "waiting_approval"
                          ? "bg-yellow-100 text-yellow-800"
                          : receipt.approval_status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {receipt.approval_status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Allocation Panel Modal */}
        {showAllocPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-end z-50">
            <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Allocate to Invoices
                  </h2>
                  <button
                    onClick={() => setShowAllocPanel(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Receipt Amount Info */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 uppercase font-semibold">
                    Available Amount
                  </p>
                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {formatCurrency(receipt.amount)}
                  </p>
                </div>

                {/* Unpaid Invoices */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-900">
                    Unpaid Invoices
                  </h3>

                  {unpaidInvoices && unpaidInvoices.length > 0 ? (
                    unpaidInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {inv.invoice_no}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Unpaid: {formatCurrency(inv.unpaid || inv.total_after_tax)}
                            </p>
                          </div>
                        </div>

                        <input
                          type="number"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          placeholder="0"
                          value={alloc[inv.id] || ""}
                          onChange={(e) =>
                            setAlloc({
                              ...alloc,
                              [inv.id]: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Max: {formatCurrency(inv.unpaid || inv.total_after_tax)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No unpaid invoices found.
                    </p>
                  )}
                </div>

                {/* Total Allocation */}
                {Object.values(alloc).some((v) => v > 0) && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 uppercase font-semibold">
                      Total Allocation
                    </p>
                    <p className="text-2xl font-bold text-green-700 mt-2">
                      {formatCurrency(
                        Object.values(alloc).reduce((sum, v) => sum + v, 0)
                      )}
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAllocPanel(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyAllocation}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                  >
                    Apply Allocation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Reject Receipt
              </h2>

              <p className="text-gray-600 text-sm mb-4">
                Please provide a reason for rejecting this receipt.
              </p>

              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-6 resize-none"
                placeholder="Rejection reason..."
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectReason("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition font-medium"
                >
                  Reject Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}