interface Props {
  status: string;
  /** "status" uses the default colorMap; "approval" uses approvalColorMap */
  variant?: "status" | "approval";
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
  partially_returned: "bg-orange-50 text-orange-700",
  returned: "bg-rose-50 text-rose-700",
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
  partially_returned: "bg-orange-500",
  returned: "bg-rose-500",
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
  draft: "Nháp",
  new: "Mới",
  pending: "Chờ xử lý",
  waiting_approval: "Chờ duyệt",
  in_progress: "Đang xử lý",
  approved: "Đã duyệt",
  confirmed: "Đã xác nhận",
  completed: "Hoàn thành",
  paid: "Đã thanh toán",
  won: "Thắng",
  delivered: "Đã giao",
  partially_returned: "Trả hàng một phần",
  returned: "Đã trả hàng",
  partially_paid: "Thanh toán một phần",
  converted: "Đã chuyển đổi",
  shipped: "Đang vận chuyển",
  rejected: "Đã từ chối",
  cancelled: "Đã hủy",
  lost: "Thua",
  overdue: "Quá hạn",
  active: "Đang hoạt động",
  inactive: "Ngừng hoạt động",
  submitted: "Đã gửi",
  processing: "Đang xử lý",
  posted: "Đã ghi sổ",
  applied: "Đã áp dụng",
  received: "Đã nhận",
  accepted: "Đã chấp nhận",
  expired: "Hết hạn",
  sent: "Đã gửi",
  fully_received: "Nhận đủ hàng",
  partial: "Một phần",
  not_invoiced: "Chưa lập hóa đơn",
  invoiced: "Đã lập hóa đơn",
  unallocated: "Chưa phân bổ",
  partially_allocated: "Phân bổ một phần",
  fully_allocated: "Đã phân bổ đủ",
};

/** Approval-specific overrides (waiting_approval → amber, approved → emerald, rejected → red) */
const approvalColorMap: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  waiting_approval: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

const approvalDotColor: Record<string, string> = {
  draft: "bg-gray-400",
  waiting_approval: "bg-amber-500",
  approved: "bg-emerald-500",
  rejected: "bg-red-500",
};

const approvalLabelMap: Record<string, string> = {
  draft: "Nháp",
  waiting_approval: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
};

export function StatusBadge({
  status,
  variant = "status",
  className = "",
}: Props) {
  const key = status ? status.toLowerCase() : "unknown";

  const isApproval = variant === "approval";
  const badgeClass = isApproval
    ? (approvalColorMap[key] ?? "bg-gray-100 text-gray-500")
    : (colorMap[key] ?? "bg-gray-100 text-gray-500");
  const dot = isApproval
    ? (approvalDotColor[key] ?? "bg-gray-400")
    : (dotColor[key] ?? "bg-gray-400");
  const label = isApproval
    ? (approvalLabelMap[key] ?? status?.replace(/_/g, " ") ?? "Unknown")
    : (labelMap[key] ?? status?.replace(/_/g, " ") ?? "Unknown");

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

// Re-export color maps for consumers that need raw access
export { colorMap as STATUS_COLORS, approvalColorMap as APPROVAL_COLORS };
