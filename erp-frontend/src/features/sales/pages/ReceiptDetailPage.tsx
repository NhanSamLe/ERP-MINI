import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchReceiptDetail,
  submitReceipt,
  approveReceipt,
  rejectReceipt,
} from "../store/receipt.slice";
import { AlertCircle, ArrowLeft, CheckCircle, XCircle, Clock, FileText, Building, User, Calendar, CreditCard, DollarSign } from "lucide-react";

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selected: receipt, loading, error } = useAppSelector((s) => s.receipt);
  const { user } = useAppSelector((s) => s.auth);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (id) dispatch(fetchReceiptDetail(Number(id)));
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading receipt details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Error Loading Receipt</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate("/sales/receipts")}
            className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Receipt Not Found</h2>
          <p className="text-gray-600">The receipt you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/sales/receipts")}
            className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
          <button
            onClick={() => navigate("/sales/receipts")}
            className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  const roleCode = user.role.code;
  const isAccountant = roleCode === "ACCOUNT";
  const isChiefAcc = roleCode === "CHACC";

  const canSubmit =
    isAccountant &&
    receipt.approval_status === "draft" &&
    receipt.status === "draft";

  const canApprove =
    isChiefAcc &&
    receipt.approval_status === "waiting_approval" &&
    receipt.status === "draft";

  const canReject = canApprove;

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit this receipt for approval?")) return;
    
    setActionLoading("submit");
    try {
      await dispatch(submitReceipt(receipt.id));
      await dispatch(fetchReceiptDetail(receipt.id));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    if (
      !window.confirm(
        "Approve and post this AR receipt?\n\nThis will create a GL Entry:\nDebit: 111/112 (Cash/Bank)\nCredit: 131 (AR)"
      )
    )
      return;
    
    setActionLoading("approve");
    try {
      await dispatch(approveReceipt(receipt.id));
      await dispatch(fetchReceiptDetail(receipt.id));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    
    setActionLoading("reject");
    try {
      await dispatch(rejectReceipt({ id: receipt.id, reason: rejectReason }));
      await dispatch(fetchReceiptDetail(receipt.id));
      setRejectModalOpen(false);
      setRejectReason("");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "posted":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "waiting_approval":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "waiting_approval":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const methodLabel = receipt.method === "cash" ? "Cash" : "Bank Transfer";
  const methodAccount = receipt.method === "cash" ? "111" : "112";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span>Sales</span>
                <span>›</span>
                <span>AR Receipts</span>
                <span>›</span>
                <span className="text-gray-900 font-medium">{receipt.receipt_no}</span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Receipt #{receipt.receipt_no}
              </h1>

              <div className="flex flex-wrap gap-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${getApprovalStatusColor(receipt.approval_status)}`}>
                  {getApprovalStatusIcon(receipt.approval_status)}
                  <span className="capitalize">{receipt.approval_status.replace(/_/g, " ")}</span>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(receipt.status)}`}>
                  <span className="capitalize">{receipt.status}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate("/sales/receipts")}
                className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {canSubmit && (
                <button
                  onClick={handleSubmit}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  {actionLoading === "submit" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Submit for Approval
                    </>
                  )}
                </button>
              )}

              {canApprove && (
                <button
                  onClick={handleApprove}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  {actionLoading === "approve" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Approve & Post
                    </>
                  )}
                </button>
              )}

              {canReject && (
                <button
                  onClick={() => setRejectModalOpen(true)}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Receipt Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Receipt Number
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    {receipt.receipt_no}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Receipt Date
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    {new Date(receipt.receipt_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Payment Method
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    {methodLabel}
                    <span className="ml-2 text-sm text-gray-500">({methodAccount})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Branch
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    Branch #{receipt.branch_id}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Customer
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    Customer #{receipt.customer_id}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Amount
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {receipt.amount?.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Accounting Entry Preview */}
        {canApprove && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              GL Entry Preview (Upon Approval)
            </h3>
            <div className="bg-white rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">Debit: {methodAccount} ({methodLabel})</span>
                <span className="font-bold text-green-600">
                  {receipt.amount?.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">Credit: 131 (Accounts Receivable)</span>
                <span className="font-bold text-red-600">
                  {receipt.amount?.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reject Receipt</h3>
                <p className="text-sm text-gray-500">Please provide a reason for rejection</p>
              </div>
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectReason("");
                }}
                disabled={actionLoading === "reject"}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === "reject"}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {actionLoading === "reject" ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Rejecting...
                  </div>
                ) : (
                  "Reject Receipt"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}