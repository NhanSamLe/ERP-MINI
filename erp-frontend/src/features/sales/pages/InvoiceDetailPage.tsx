// ============================================
// INVOICE DETAIL PAGE - Professional Version
// ============================================

import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchInvoiceDetail,
  submitInvoice,
  approveInvoice,
  rejectInvoice,
} from "../store/invoice.slice";
import { 
  ArrowLeft, 
  Send, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Building,
  DollarSign,
  FileText,
  User,
  Clock
} from "lucide-react";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selected: invoice, loading } = useAppSelector((s) => s.invoice);
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (id) dispatch(fetchInvoiceDetail(Number(id)));
  }, [dispatch, id]);

  if (loading || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 text-lg mt-4 font-medium">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <p className="text-gray-900 text-xl font-bold">Access Denied</p>
          <p className="text-gray-500 mt-2">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  const roleCode = user.role.code;
  const isAccountant = roleCode === "ACCOUNT";
  const isChiefAcc = roleCode === "CHACC";

  const canSubmit =
    isAccountant &&
    invoice.approval_status === "draft" &&
    invoice.status === "draft";

  const canApprove =
    isChiefAcc &&
    invoice.approval_status === "waiting_approval" &&
    invoice.status === "draft";

  const canReject = canApprove;

  const handleSubmit = async () => {
    if (!window.confirm("Submit this invoice for approval?")) return;
    await dispatch(submitInvoice(invoice.id));
    dispatch(fetchInvoiceDetail(invoice.id));
  };

  const handleApprove = async () => {
    if (!window.confirm("Approve & post this AR invoice (create GL Entry)?"))
      return;
    await dispatch(approveInvoice(invoice.id));
    dispatch(fetchInvoiceDetail(invoice.id));
  };

  const handleReject = async () => {
    const reason = window.prompt("Please provide a reason for rejection:");
    if (!reason) return;
    await dispatch(rejectInvoice({ id: invoice.id, reason }));
    dispatch(fetchInvoiceDetail(invoice.id));
  };

  // Badge styling
  const getApprovalBadge = () => {
    const status = invoice.approval_status;
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700 border-gray-300",
      waiting_approval: "bg-yellow-100 text-yellow-700 border-yellow-300",
      approved: "bg-green-100 text-green-700 border-green-300",
      rejected: "bg-red-100 text-red-700 border-red-300",
    };
    return styles[status] || styles.draft;
  };

  const getStatusBadge = () => {
    const status = invoice.status;
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      posted: "bg-blue-100 text-blue-700",
      paid: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return styles[status] || styles.draft;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span>Sales</span>
          <span>›</span>
          <span>AR Invoices</span>
          <span>›</span>
          <span className="text-gray-900 font-medium">{invoice.invoice_no}</span>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Left: Title & Status */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Invoice #{invoice.invoice_no}
                </h1>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getApprovalBadge()}`}>
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {invoice.approval_status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getStatusBadge()}`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/sales/invoices")}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all hover:border-gray-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {canSubmit && (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-all shadow-md hover:shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  Submit for Approval
                </button>
              )}

              {canApprove && (
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve & Post
                </button>
              )}

              {canReject && (
                <button
                  onClick={handleReject}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-all shadow-md hover:shadow-lg"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Invoice Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice Number</p>
                      <p className="text-base font-bold text-gray-900 mt-1">{invoice.invoice_no}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice Date</p>
                      <p className="text-base font-bold text-gray-900 mt-1">
                        {new Date(invoice.invoice_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</p>
                      <p className="text-base font-bold text-gray-900 mt-1">Branch #{invoice.branch_id}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        ${invoice.total_after_tax?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Lines */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Line Items
              </h2>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-5 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-5 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-5 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Tax
                        </th>
                        <th className="px-5 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Line Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoice.lines?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <FileText className="w-8 h-8 text-gray-400" />
                              </div>
                              <p className="text-sm font-medium text-gray-500">No line items available</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        invoice.lines.map((l, idx) => (
                          <tr key={l.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600">
                                  {idx + 1}
                                </div>
                                <span className="font-medium text-gray-900">{l.description}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right font-semibold text-gray-900">
                              {l.quantity}
                            </td>
                            <td className="px-5 py-4 text-right font-semibold text-gray-900">
                              ${l.unit_price?.toLocaleString()}
                            </td>
                            <td className="px-5 py-4 text-right font-semibold text-gray-700">
                              ${l.line_tax?.toLocaleString()}
                            </td>
                            <td className="px-5 py-4 text-right font-bold text-gray-900">
                              ${l.line_total_after_tax?.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              {invoice.lines?.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <div className="w-full sm:w-80 space-y-3 bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Subtotal:</span>
                      <span className="font-semibold text-gray-900">
                        ${invoice.lines.reduce((sum, l) => sum + ((l.unit_price || 0) * (l.quantity || 0)), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Tax:</span>
                      <span className="font-semibold text-gray-900">
                        ${invoice.lines.reduce((sum, l) => sum + (l.line_tax || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-3 border-t-2 border-gray-300">
                      <div className="flex justify-between">
                        <span className="text-base font-bold text-gray-900">Total:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          ${invoice.total_after_tax?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Summary & Timeline */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wide opacity-90 mb-4">
                Invoice Summary
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs opacity-75 mb-1">Invoice Number</p>
                  <p className="text-xl font-bold">{invoice.invoice_no}</p>
                </div>
                <div>
                  <p className="text-xs opacity-75 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold">${invoice.total_after_tax?.toLocaleString()}</p>
                </div>
                <div className="pt-4 border-t border-blue-500/30">
                  <p className="text-xs opacity-75 mb-2">Current Status</p>
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center w-fit px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-xs font-bold">
                      {invoice.approval_status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="inline-flex items-center w-fit px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-xs font-bold">
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Your Role
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Role</p>
                  <p className="text-base font-bold text-gray-900 mt-1">{user.role.code}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Permissions</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {canSubmit && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                        Can Submit
                      </span>
                    )}
                    {canApprove && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                        Can Approve
                      </span>
                    )}
                    {canReject && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                        Can Reject
                      </span>
                    )}
                    {!canSubmit && !canApprove && !canReject && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                        View Only
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}