import React from "react";
import { SaleOrderDto } from "../dto/saleOrder.dto";
import { FileText, Clock, CheckCircle, Building2 } from "lucide-react";
import SaleOrderStatusBadge from "./SaleOrderStatusBadge";

interface Props {
  order: SaleOrderDto;
}

export default function SaleOrderStatusCards({ order }: Props) {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("vi-VN");

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
        <div className="flex items-center gap-3 mb-2">
          <FileText size={20} className="text-blue-600" />
          <span className="text-gray-500 text-sm">Status</span>
        </div>
        <p className="text-gray-900 font-semibold text-lg capitalize">
          {order.status}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
        <div className="flex items-center gap-3 mb-2">
          <Clock size={20} className="text-yellow-600" />
          <span className="text-gray-500 text-sm">Approval</span>
        </div>
        <SaleOrderStatusBadge status={order.approval_status} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle size={20} className="text-gray-400" />
          <span className="text-gray-500 text-sm">Order Date</span>
        </div>
        <p className="text-gray-900 font-semibold">{formatDate(order.order_date)}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
        <div className="flex items-center gap-3 mb-2">
          <Building2 size={20} className="text-gray-400" />
          <span className="text-gray-500 text-sm">Branch</span>
        </div>
        <p className="text-gray-900 font-semibold">{order.branch?.name}</p>
      </div>
    </div>
  );
}