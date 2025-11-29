import React from "react";
import { SaleOrderDto } from "../dto/saleOrder.dto";

interface Props {
  order: SaleOrderDto;
}

export default function SaleOrderStaffTimeline({ order }: Props) {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("vi-VN");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-1 h-5 bg-purple-600 rounded"></div>
        Staff & Timeline
      </h3>
      <div className="space-y-4">
        <div>
          <p className="text-gray-500 text-sm mb-2">Created By</p>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-gray-900 font-semibold">{order.creator?.full_name}</p>
            <p className="text-gray-500 text-xs mt-1">@{order.creator?.username}</p>
            <p className="text-gray-400 text-xs mt-1">
              {formatDate(order.created_at??"")}
            </p>
          </div>
        </div>

        {order.approver && (
          <div>
            <p className="text-gray-500 text-sm mb-2">Approved By</p>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-gray-900 font-semibold">
                {order.approver?.full_name}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {order.approved_at ? formatDate(order.approved_at) : "N/A"}
              </p>
            </div>
          </div>
        )}

        {order.reject_reason && (
          <div>
            <p className="text-gray-500 text-sm mb-2">Rejection Reason</p>
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="text-red-700 text-sm">{order.reject_reason}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
