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

  const [showAllocPanel, setShowAllocPanel] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [alloc, setAlloc] = useState<Record<number, number>>({});
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (receiptId) {
      dispatch(fetchReceiptDetail(receiptId));
    }
  }, [dispatch, receiptId]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      await dispatch(submitReceipt(receiptId)).unwrap();
      setMessage({ type: 'success', text: 'Receipt submitted successfully' });
      dispatch(fetchReceiptDetail(receiptId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit receipt';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await dispatch(approveReceipt(receiptId)).unwrap();
      setMessage({ type: 'success', text: 'Receipt approved successfully' });
      dispatch(fetchReceiptDetail(receiptId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve receipt';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setMessage({ type: 'error', text: 'Please enter rejection reason' });
      return;
    }
    try {
      setActionLoading(true);
      await dispatch(rejectReceipt({ id: receiptId, reason: rejectReason })).unwrap();
      setMessage({ type: 'success', text: 'Receipt rejected successfully' });
      setRejectModalOpen(false);
      setRejectReason("");
      dispatch(fetchReceiptDetail(receiptId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject receipt';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAllocate = () => {
    dispatch(fetchUnpaidInvoices(receipt.customer_id));
    setShowAllocPanel(true);
    setAlloc({});
  };

  const handleApplyAllocation = async () => {
    const allocations = Object.entries(alloc)
      .filter(([, val]) => val > 0)
      .map(([id, val]) => ({
        invoice_id: Number(id),
        applied_amount: val,
      }));

    if (allocations.length === 0) {
      setMessage({ type: 'error', text: 'Please allocate at least one invoice' });
      return;
    }

    // ✅ Validate each allocation
    for (const a of allocations) {
      const invoice = unpaidInvoices?.find((inv) => inv.invoice_id === a.invoice_id);
      if (!invoice) {
        setMessage({ type: "error", text: "Invalid invoice selected" });
        return;
      }

      const unpaid = invoice.unpaid ?? invoice.total_after_tax;

      if (a.applied_amount > unpaid) {
        setMessage({
          type: "error",
          text: `Allocation for invoice ${invoice.invoice_no} exceeds unpaid amount (${formatCurrency(unpaid)})`,
        });
        return;
      }

      if (a.applied_amount <= 0) {
        setMessage({
          type: "error",
          text: `Allocation amount must be greater than 0`,
        });
        return;
      }
    }

    const totalAlloc = allocations.reduce((sum, a) => sum + a.applied_amount, 0);

    if (totalAlloc > remainingAmount) {
      setMessage({
        type: "error",
        text: `Total allocation (${formatCurrency(totalAlloc)}) exceeds remaining amount (${formatCurrency(remainingAmount)})`,
      });
      return;
    }

    try {
      setActionLoading(true);
      await dispatch(allocateReceipt({ id: receiptId, allocations })).unwrap();
      setMessage({ type: 'success', text: 'Allocations applied successfully' });
      setShowAllocPanel(false);
      setAlloc({});
      dispatch(fetchReceiptDetail(receiptId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply allocations';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setActionLoading(false);
    }
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

  const remainingAmount = Math.max(0, receipt.amount - totalAllocated);
  const isFullyAllocated = remainingAmount === 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

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

            <div className="flex gap-3 flex-wrap justify-end">
              {isAccountant && isDraft && !isRejected && (
                <button
                  onClick={handleSubmit}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-orange-400 transition font-medium"
                >
                  {actionLoading ? 'Processing...' : 'Submit for Approval'}
                </button>
              )}

              {isAccountant && isDraft && isRejected && (
                <button
                  onClick={handleSubmit}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-orange-400 transition font-medium"
                >
                  {actionLoading ? 'Processing...' : 'Resubmit'}
                </button>
              )}

              {isChiefAcc && isWaitingApproval && (
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-500 transition font-medium"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
              )}

              {isChiefAcc && isWaitingApproval && (
                <button
                  onClick={() => setRejectModalOpen(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-500 transition font-medium"
                >
                  Reject
                </button>
              )}

              {isAccountant && isPosted && isApproved && !isFullyAllocated && (
                <button
                  onClick={handleAllocate}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-500 transition font-medium"
                >
                  Allocate to Invoices
                </button>
              )}

              {isAccountant && isPosted && isApproved && isFullyAllocated && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium border border-green-300">
                  ✓ Fully Allocated
                </span>
              )}
            </div>
          </div>

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

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
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

              {isRejected && receipt.reject_reason && (
                <div className="mt-6 pt-6 border-t border-red-200 bg-red-50 p-4 rounded">
                  <p className="text-xs text-red-600 uppercase font-semibold mb-2">
                    Rejection Reason
                  </p>
                  <p className="text-sm text-red-700">{receipt.reject_reason}</p>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-green-600 rounded"></div>
                Allocations
              </h2>

              {receipt.allocations && receipt.allocations.length > 0 ? (
                <div className="space-y-3">
                  {receipt.allocations.map((alloc, idx) => {
                    const invoice = alloc.invoice;
                    const unpaid = (invoice?.total_after_tax || 0) - (alloc.applied_amount || 0);
                    return (
                      <div
                        key={alloc.id || idx}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {invoice?.invoice_no}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Invoice Total: {formatCurrency(invoice?.total_after_tax || 0)}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-bold text-green-600">
                              {formatCurrency(alloc.applied_amount || 0)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Allocated
                            </p>
                          </div>
                        </div>
                        
                        {/* Show remaining unpaid after allocation */}
                        <div className="pt-3 border-t border-gray-200 flex justify-between">
                          <p className="text-xs text-gray-600">Remaining Unpaid:</p>
                          <p className={`text-xs font-semibold ${unpaid > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {formatCurrency(unpaid)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No allocations yet.</p>
              )}
            </div>
          </div>

          <div className="col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-indigo-600 rounded"></div>
                Summary
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Receipt Amount
                  </p>
                  <p className="text-2xl font-bold text-indigo-600 mt-2">
                    {formatCurrency(receipt.amount)}
                  </p>
                </div>

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
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 uppercase font-semibold">
                    Available Amount
                  </p>
                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {formatCurrency(remainingAmount)}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-900">
                    Unpaid Invoices
                  </h3>

                  {unpaidInvoices && unpaidInvoices.length > 0 ? (
                    unpaidInvoices.map((inv) => (
                      <div
                        key={inv.invoice_id}
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
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="0"
                          min="0"
                          max={inv.unpaid || inv.total_after_tax}
                          value={alloc[inv.invoice_id] || ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            const unpaidAmount = inv.unpaid || inv.total_after_tax;
                            
                            if (value > unpaidAmount) {
                              setMessage({
                                type: 'error',
                                text: `Cannot exceed unpaid amount (${formatCurrency(unpaidAmount)})`
                              });
                              return;
                            }
                            
                            setAlloc({
                              ...alloc,
                              [inv.invoice_id]: value,
                            });
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Max: {formatCurrency(inv.unpaid || inv.total_after_tax)}
                        </p>
                        
                        {alloc[inv.invoice_id] && alloc[inv.invoice_id] > (inv.unpaid || inv.total_after_tax) && (
                          <p className="text-xs text-red-600 mt-2 font-semibold">
                            ⚠ Exceeds unpaid amount
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No unpaid invoices found.
                    </p>
                  )}
                </div>

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

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAllocPanel(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyAllocation}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition font-medium"
                  >
                    {actionLoading ? 'Processing...' : 'Apply Allocation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  disabled={!rejectReason.trim() || actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition font-medium"
                >
                  {actionLoading ? 'Processing...' : 'Reject Receipt'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}