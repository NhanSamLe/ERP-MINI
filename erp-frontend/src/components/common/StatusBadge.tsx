interface Props {
  status: string;
  className?: string;
}

const colorMap: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  new: "bg-blue-50 text-blue-600",
  pending: "bg-amber-50 text-amber-700",
  waiting_approval: "bg-orange-50 text-orange-600",
  in_progress: "bg-indigo-50 text-indigo-600",
  approved: "bg-emerald-50 text-emerald-700",
  confirmed: "bg-teal-50 text-teal-700",
  completed: "bg-emerald-50 text-emerald-700",
  paid: "bg-green-50 text-green-700",
  won: "bg-green-50 text-green-700",
  delivered: "bg-green-50 text-green-700",
  partially_paid: "bg-orange-50 text-orange-600",
  converted: "bg-cyan-50 text-cyan-700",
  shipped: "bg-sky-50 text-sky-700",
  rejected: "bg-red-50 text-red-600",
  cancelled: "bg-gray-50 text-gray-400",
  lost: "bg-red-50 text-red-600",
  overdue: "bg-red-50 text-red-600",
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-gray-100 text-gray-500",
  // Purchase Return statuses
  submitted: "bg-blue-50 text-blue-600",
  processing: "bg-indigo-50 text-indigo-600",
  posted: "bg-teal-50 text-teal-700",
  applied: "bg-cyan-50 text-cyan-700",
  received: "bg-sky-50 text-sky-700",
  accepted: "bg-emerald-50 text-emerald-700",
  expired: "bg-red-50 text-red-500",
  sent: "bg-blue-50 text-blue-600",
  fully_received: "bg-green-50 text-green-700",
  partial: "bg-orange-50 text-orange-600",
  not_invoiced: "bg-gray-100 text-gray-500",
  invoiced: "bg-green-50 text-green-700",
  unallocated: "bg-red-50 text-red-600",
  partially_allocated: "bg-amber-50 text-amber-700",
  fully_allocated: "bg-green-50 text-green-700",
};

const dotColor: Record<string, string> = {
  draft: "bg-gray-400",
  new: "bg-blue-500",
  pending: "bg-amber-500",
  waiting_approval: "bg-orange-500",
  in_progress: "bg-indigo-500",
  approved: "bg-emerald-500",
  confirmed: "bg-teal-500",
  completed: "bg-emerald-500",
  paid: "bg-green-500",
  won: "bg-green-500",
  delivered: "bg-green-500",
  partially_paid: "bg-orange-500",
  converted: "bg-cyan-500",
  shipped: "bg-sky-500",
  rejected: "bg-red-500",
  cancelled: "bg-gray-300",
  lost: "bg-red-500",
  overdue: "bg-red-500",
  active: "bg-emerald-500",
  inactive: "bg-gray-400",
  submitted: "bg-blue-500",
  processing: "bg-indigo-500",
  posted: "bg-teal-500",
  applied: "bg-cyan-500",
  received: "bg-sky-500",
  accepted: "bg-emerald-500",
  expired: "bg-red-400",
  sent: "bg-blue-400",
  fully_received: "bg-green-500",
  partial: "bg-orange-400",
  not_invoiced: "bg-gray-300",
  invoiced: "bg-green-500",
  unallocated: "bg-red-500",
  partially_allocated: "bg-amber-500",
  fully_allocated: "bg-green-500",
};

const labelMap: Record<string, string> = {
  draft: "Draft",
  new: "New",
  pending: "Pending",
  waiting_approval: "Waiting Approval",
  in_progress: "In Progress",
  approved: "Approved",
  confirmed: "Confirmed",
  completed: "Completed",
  paid: "Paid",
  won: "Won",
  delivered: "Delivered",
  partially_paid: "Partial",
  converted: "Converted",
  shipped: "Shipped",
  rejected: "Rejected",
  cancelled: "Cancelled",
  lost: "Lost",
  overdue: "Overdue",
  active: "Active",
  inactive: "Inactive",
  submitted: "Submitted",
  processing: "Processing",
  posted: "Posted",
  applied: "Applied",
  received: "Received",
  accepted: "Accepted",
  expired: "Expired",
  sent: "Sent",
  fully_received: "Fully Received",
  partial: "Partial",
  not_invoiced: "Not Invoiced",
  invoiced: "Invoiced",
  unallocated: "Unallocated",
  partially_allocated: "Partial Alloc.",
  fully_allocated: "Fully Allocated",
};

export function StatusBadge({ status, className = "" }: Props) {
  const key = status ? status.toLowerCase() : "unknown";
  const badgeClass = colorMap[key] ?? "bg-gray-100 text-gray-500";
  const dot = dotColor[key] ?? "bg-gray-400";
  const label = labelMap[key] ?? status?.replace(/_/g, " ") ?? "Unknown";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        badgeClass,
        className,
      ].join(" ")}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  );
}
