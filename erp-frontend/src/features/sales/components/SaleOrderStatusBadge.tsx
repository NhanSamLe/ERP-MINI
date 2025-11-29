import React from "react";

interface Props {
  status: string;
}

export default function SaleOrderStatusBadge({ status }: Props) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    waiting_approval: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    confirmed: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded-md text-xs font-medium ${
        colors[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
