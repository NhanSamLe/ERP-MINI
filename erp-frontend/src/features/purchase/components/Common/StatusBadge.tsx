import React from "react";

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  posted: "bg-orange-100 text-orange-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-700",
  partially_received: "bg-yellow-100 text-yellow-700",
  received: "bg-green-100 text-green-700",
};

export const APPROVAL_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  waiting_approval: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

interface StatusBadgeProps {
  status: string;
  variant?: "status" | "approval";
}

export function StatusBadge({ status, variant = "status" }: StatusBadgeProps) {
  const colors = variant === "approval" ? APPROVAL_COLORS : STATUS_COLORS;
  const colorClass = colors[status] || "bg-gray-100 text-gray-700";

  return (
    <span
      className={`px-2.5 py-1 rounded-md text-xs font-medium ${colorClass}`}
    >
      {status.replace(/_/g, " ").toUpperCase()}
    </span>
  );
}
