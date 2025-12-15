import { CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { InvoiceStatus, InvoiceApprovalStatus } from "../../dto/invoice.dto";

interface Props {
  status: InvoiceStatus | InvoiceApprovalStatus;
  type: "status" | "approval";
}

const StatusBadge = ({ status, type }: Props) => {
  const statusConfig = {
    status: {
      draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', icon: FileText },
      posted: { label: 'Posted', bg: 'bg-orange-100', text: 'text-orange-700', icon: FileText },
       partially_paid: {label: "Partially Paid",bg: "bg-orange-100",text: "text-orange-800",icon: Clock},
      paid: { label: 'Paid', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
      cancelled: { label: 'Cancelled', bg: 'bg-gray-200', text: 'text-gray-600', icon: XCircle }
    },
    approval: {
      draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', icon: FileText },
      waiting_approval: { label: 'Waiting', bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
      approved: { label: 'Approved', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle }
    }
  };

  const config =
  type === "status"
    ? statusConfig.status[status as keyof typeof statusConfig.status]
    : statusConfig.approval[status as keyof typeof statusConfig.approval];

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      <Icon size={14} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
