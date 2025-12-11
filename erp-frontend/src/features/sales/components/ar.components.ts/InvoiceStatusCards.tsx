
import { ArInvoiceDto } from "../../dto/invoice.dto";

interface Props {
  invoice: ArInvoiceDto;
}

export default function InvoiceStatusCards({ invoice }: Props) {
  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "waiting_approval":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "posted":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "paid":
        return "bg-green-100 text-green-800 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Approval Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">Approval Status</h3>
        <div
          className={`inline-block px-3 py-1 rounded-full border text-sm font-medium ${getApprovalStatusColor(
            invoice.approval_status
          )}`}
        >
          {invoice.approval_status.replace("_", " ").toUpperCase()}
        </div>
        {invoice.approval_status === "waiting_approval" && invoice.submitted_at && (
          <p className="text-xs text-gray-500 mt-2">
            Submitted: {formatDate(invoice.submitted_at)}
          </p>
        )}
        {invoice.approval_status === "approved" && invoice.approved_at && (
          <p className="text-xs text-gray-500 mt-2">
            Approved: {formatDate(invoice.approved_at)}
          </p>
        )}
        {invoice.approval_status === "rejected" && invoice.reject_reason && (
          <p className="text-xs text-red-600 mt-2">
            Reason: {invoice.reject_reason}
          </p>
        )}
      </div>

      {/* Invoice Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">Invoice Status</h3>
        <div
          className={`inline-block px-3 py-1 rounded-full border text-sm font-medium ${getInvoiceStatusColor(
            invoice.status
          )}`}
        >
          {invoice.status.toUpperCase()}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Date: {formatDate(invoice.invoice_date)}
        </p>
      </div>
    </div>
  );
}