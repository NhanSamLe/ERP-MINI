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
import { formatVND } from "@/utils/currency.helper";
import { ArrowLeft, Check, X, AlertTriangle, FileText, Wallet } from "lucide-react";

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
          <p className="text-gray-600 text-lg animate-pulse">Loading receipt details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view this page.</p>
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
    if (isFullyAllocated) return;
    dispatch(fetchUnpaidInvoices(receipt.customer_id));
    setShowAllocPanel(true);
    setAlloc({});
  };

  const handleAutoAllocate = () => {
    // Basic auto-allocate logic: distribute `remainingAmount` to oldest invoices first
    // This is a client-side helper for the user
    let remaining = remainingAmount;
    const newAlloc: Record<number, number> = {};

    // Assuming unpaidInvoices are sorted by date or ID (typically helpful to sort by due date)
    // Here we just iterate as is
    for (const inv of unpaidInvoices) {
      if (remaining <= 0) break;
      const amountNeeded = inv.unpaid || inv.total_after_tax;
      const amountToApply = Math.min(remaining, amountNeeded);

      if (amountToApply > 0) {
        newAlloc[inv.invoice_id] = amountToApply;
        remaining -= amountToApply;
      }
    }
    setAlloc(newAlloc);
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
          text: `Allocation for invoice ${invoice.invoice_no} exceeds unpaid amount (${formatVND(unpaid)})`,
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

    if (totalAlloc !== remainingAmount) {
      setMessage({
        type: "error",
        text: `You must allocate exactly ${formatVND(remainingAmount)}`
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const totalAllocated = receipt.allocations
    ? receipt.allocations.reduce((sum, a) => sum + a.applied_amount!, 0)
    : 0;

  const remainingAmount = Math.max(0, receipt.amount - totalAllocated);
  const totalAllocInput = Object.values(alloc).reduce((s, v) => s + v, 0);
  const allocationStatus = receipt.allocation_status;
  const isUnallocated = allocationStatus === "unallocated";
  const isFullyAllocated = allocationStatus === "fully_allocated";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Toast Message */}
        {message && (
          <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transform transition-all duration-500 ${message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
            {message.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <button
            onClick={() => navigate("/receipts")}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft size={16} />
            Receipts
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">{receipt.receipt_no}</span>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {receipt.receipt_no}
                </h1>
                {isFullyAllocated && (
                  <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200">
                    FULLY ALLOCATED
                  </span>
                )}
              </div>
              <p className="text-gray-500 flex items-center gap-2">
                <FileText size={14} />
                Receipt ID: <span className="font-mono text-gray-700">#{receipt.id}</span>
              </p>
            </div>

            <div className="flex gap-3 flex-wrap justify-end">
              {/* Draft Actions */}
              {isAccountant && isDraft && !isRejected && (
                <button
                  onClick={handleSubmit}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-medium shadow-sm"
                >
                  {actionLoading ? 'Processing...' : 'Submit for Approval'}
                </button>
              )}

              {isAccountant && isDraft && isRejected && (
                <button
                  onClick={handleSubmit}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-medium shadow-sm"
                >
                  {actionLoading ? 'Processing...' : 'Resubmit'}
                </button>
              )}

              {/* Approval Actions */}
              {isChiefAcc && isWaitingApproval && (
                <>
                  <button
                    onClick={() => setRejectModalOpen(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition font-medium shadow-sm"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium shadow-sm"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                </>
              )}

              {/* Allocation Actions */}
              {isAccountant && isPosted && isApproved && isUnallocated && (
                <button
                  onClick={handleAllocate}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition font-medium shadow-sm flex items-center gap-2"
                >
                  <Wallet size={18} />
                  Allocate to Invoices
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Receipt Status
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${receipt.status === "draft"
                      ? "bg-gray-400"
                      : receipt.status === "posted"
                        ? "bg-blue-500"
                        : "bg-green-500"
                    }`}
                ></span>
                <span className="text-sm font-bold text-gray-900">
                  {receipt.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 pl-4.5">
                Date: {formatDate(receipt.receipt_date)}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Approval Status
              </h3>
              <div className="flex items-center gap-2">
                <div className={`
                    px-2.5 py-0.5 rounded text-xs font-bold uppercase
                    ${receipt.approval_status === "draft" ? "bg-gray-100 text-gray-600" : ""}
                    ${receipt.approval_status === "waiting_approval" ? "bg-yellow-100 text-yellow-700" : ""}
                    ${receipt.approval_status === "approved" ? "bg-green-100 text-green-700" : ""}
                    ${receipt.approval_status === "rejected" ? "bg-red-100 text-red-700" : ""}
                 `}>
                  {receipt.approval_status.replace("_", " ")}
                </div>
              </div>
              {receipt.submitted_at && (
                <p className="text-sm text-gray-500 mt-1">
                  Submitted: {formatDate(receipt.submitted_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: DETAILS & ALLOCATIONS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 pb-2 border-b">
                Receipt Information
              </h2>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Customer</p>
                  <p className="text-base text-gray-900 font-medium">{receipt.customer?.name || "—"}</p>
                  <p className="text-sm text-gray-500">{receipt.customer?.phone || "—"}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Payment Method</p>
                  <p className="text-base text-gray-900 font-medium capitalize">{receipt.method || "—"}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Receipt Date</p>
                  <p className="text-base text-gray-900 font-medium">{formatDate(receipt.receipt_date)}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Amount</p>
                  <p className="text-lg text-indigo-700 font-bold font-mono">{formatVND(receipt.amount)}</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Created By</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-bold">
                      {(receipt.creator?.full_name || receipt.creator?.username || "?")[0].toUpperCase()}
                    </div>
                    <p className="text-sm text-gray-900">{receipt.creator?.full_name || receipt.creator?.username}</p>
                  </div>
                </div>

                {receipt.approver && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Approved By</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs text-green-700 font-bold">
                        {(receipt.approver.full_name || receipt.approver.username || "?")[0].toUpperCase()}
                      </div>
                      <p className="text-sm text-gray-900">{receipt.approver.full_name || receipt.approver.username}</p>
                    </div>
                  </div>
                )}
              </div>

              {isRejected && receipt.reject_reason && (
                <div className="mt-6 bg-red-50 border border-red-100 p-4 rounded-lg">
                  <p className="text-xs text-red-600 uppercase font-semibold mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-800">{receipt.reject_reason}</p>
                </div>
              )}
            </div>

            {/* Existing Allocations List */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 pb-2 border-b">
                Allocated Invoices
                <span className="text-xs font-normal text-gray-500 ml-auto flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                  <Check size={12} className="text-green-600" />
                  {receipt.allocations?.length || 0} invoices
                </span>
              </h2>

              {receipt.allocations && receipt.allocations.length > 0 ? (
                <div className="space-y-3">
                  {receipt.allocations.map((alloc, idx) => {
                    const invoice = alloc.invoice;
                    const unpaid = (invoice?.total_after_tax || 0) - (alloc.applied_amount || 0);
                    return (
                      <div
                        key={alloc.id || idx}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{invoice?.invoice_no}</p>
                            <p className="text-xs text-gray-500">Total: {formatVND(invoice?.total_after_tax)}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                              +{formatVND(alloc.applied_amount)}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar for Allocation */}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Payment Progress</span>
                            <span>{unpaid <= 0 ? 'Paid' : 'Partially Paid'}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-green-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, ((alloc.applied_amount || 0) / (invoice?.total_after_tax || 1) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                  No invoices allocated yet.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b">
                Allocation Summary
              </h3>

              <div className="space-y-5">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Receipt</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1 font-mono">
                    {formatVND(receipt.amount)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Allocated</p>
                    <p className="text-lg font-semibold text-green-600 mt-1">
                      {formatVND(totalAllocated)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Remaining</p>
                    <p className={`text-lg font-semibold mt-1 ${remainingAmount === 0 ? 'text-gray-400' : 'text-orange-600'}`}>
                      {formatVND(remainingAmount)}
                    </p>
                  </div>
                </div>

                {receipt.amount > 0 && (
                  <div className="pt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Completion</span>
                      <span>{((totalAllocated / receipt.amount) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${remainingAmount === 0 ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                        style={{ width: `${(totalAllocated / receipt.amount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {isAccountant && isPosted && isApproved && isUnallocated && remainingAmount > 0 && (
                  <div className="pt-4 mt-2">
                    <button
                      onClick={handleAllocate}
                      className="w-full py-3 bg-orange-600 text-white font-bold rounded-lg shadow-lg shadow-orange-100 hover:bg-orange-700 transition"
                    >
                      Allocate Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= ALLOCATION MODAL ================= */}
        {showAllocPanel && (
          <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex justify-end transition-opacity">
            <div className="relative w-full max-w-lg bg-white shadow-2xl min-h-screen flex flex-col animate-slide-in-right">

              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Allocate Invoices</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Customer: {receipt.customer?.name}</p>
                </div>
                <button
                  onClick={() => setShowAllocPanel(false)}
                  className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Remaining Hint */}
                <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-blue-600 uppercase font-bold">Available to Allocate</p>
                    <p className="text-2xl font-bold text-blue-700 font-mono mt-1">{formatVND(remainingAmount)}</p>
                  </div>
                  <button
                    onClick={handleAutoAllocate}
                    className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-50 font-medium transition"
                  >
                    Auto Fill
                  </button>
                </div>

                {/* Invoices List */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Unpaid Invoices</h3>

                  {unpaidInvoices && unpaidInvoices.length > 0 ? (
                    unpaidInvoices.map((inv) => {
                      const currentVal = alloc[inv.invoice_id] || 0;
                      const isAllocated = currentVal > 0;
                      const unpaidAmount = inv.unpaid || inv.total_after_tax;

                      return (
                        <div
                          key={inv.invoice_id}
                          className={`p-4 rounded-lg border transition ${isAllocated ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-gray-200'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-gray-900">{inv.invoice_no}</p>
                              <p className="text-xs text-gray-500">Unpaid: {formatVND(unpaidAmount)}</p>
                            </div>
                          </div>

                          <div className="relative">
                            <input
                              type="number"
                              placeholder="0"
                              className={`w-full pl-3 pr-12 py-2 rounded border focus:outline-none focus:ring-2 font-mono ${isAllocated ? 'border-orange-300 focus:ring-orange-500 bg-white' : 'border-gray-300 focus:ring-gray-400'
                                }`}
                              min="0"
                              max={unpaidAmount}
                              value={currentVal || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setAlloc(prev => ({ ...prev, [inv.invoice_id]: val }));
                              }}
                            />
                            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">VND</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-lg">
                      No unpaid invoices found for this customer.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 safe-bottom">
                <div className={`flex justify-between items-center mb-4 ${totalAllocInput === remainingAmount ? 'text-green-600' : 'text-red-600'
                  }`}>
                  <span className="font-semibold text-sm uppercase">Total Selected</span>
                  <span className="font-bold font-mono text-xl">{formatVND(totalAllocInput)}</span>
                </div>

                {totalAllocInput !== remainingAmount && (
                  <p className="text-xs text-red-500 text-center mb-4">
                    ⚠️ Total allocation must strictly equal {formatVND(remainingAmount)}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAllocPanel(false)}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyAllocation}
                    disabled={actionLoading || totalAllocInput !== remainingAmount}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 transition"
                  >
                    {actionLoading ? 'Saving...' : 'Confirm Allocation'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= REJECT MODAL ================= */}
        {rejectModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Reject Request</h2>
                <p className="text-sm text-gray-500 mt-1">Provide a reason for rejection to notify the requester.</p>
              </div>

              <div className="p-6">
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[120px] resize-none"
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                <button
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectReason("");
                  }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}