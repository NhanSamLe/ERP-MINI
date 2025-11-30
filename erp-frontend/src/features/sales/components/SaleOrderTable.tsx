import React from "react";
import { SaleOrderDto } from "../dto/saleOrder.dto";
import SaleOrderStatusBadge from "./SaleOrderStatusBadge";
import { Link } from "react-router-dom";
import { Eye, Edit, Send, CheckCircle, XCircle } from "lucide-react";
import {formatVND} from "@/utils/currency.helper"

interface Props {
  items: SaleOrderDto[];
}

export default function SaleOrderTable({ items }: Props) {
  return (
    <div className="rounded-lg border shadow-sm bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="p-3 text-left">Order No</th>
            <th className="p-3 text-left">Customer</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Total</th>
            <th className="p-3 text-left">Created By</th>
            <th className="p-3 text-left">Created At</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t hover:bg-gray-50">
              <td className="p-3 font-medium text-blue-600">
                <Link to={`/sales/orders/${item.id}`}>{item.order_no}</Link>
              </td>

              <td className="p-3">{item.customer_id}</td>

              <td className="p-3">
                <SaleOrderStatusBadge status={item.approval_status} />
              </td>

              <td className="p-3">{formatVND(item.total_after_tax)} </td>

              <td className="p-3">{item.creator?.full_name}</td>

              <td className="p-3">
                {new Date(item.created_at || "").toLocaleString()}
              </td>

              <td className="p-3 text-right flex items-center justify-end gap-2">

                {/* VIEW */}
                <Link
                  to={`/sales/orders/${item.id}`}
                  className="p-1.5 border rounded text-blue-600 hover:bg-blue-50"
                >
                  <Eye size={16} />
                </Link>

                {/* EDIT */}
                <Link
                  to={`/sales/orders/${item.id}/edit`}
                  className="p-1.5 border rounded text-gray-600 hover:bg-gray-100"
                >
                  <Edit size={16} />
                </Link>

                {/* SUBMIT */}
                {item.approval_status === "draft" && (
                  <button className="p-1.5 border rounded text-yellow-600 hover:bg-yellow-50">
                    <Send size={16} />
                  </button>
                )}

                {/* APPROVE */}
                {item.approval_status === "waiting_approval" && (
                  <button className="p-1.5 border rounded text-green-600 hover:bg-green-50">
                    <CheckCircle size={16} />
                  </button>
                )}

                {/* REJECT */}
                {item.approval_status === "waiting_approval" && (
                  <button className="p-1.5 border rounded text-red-600 hover:bg-red-50">
                    <XCircle size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
