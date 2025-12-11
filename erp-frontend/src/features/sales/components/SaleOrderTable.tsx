import  { useState } from "react";
import { SaleOrderDto } from "../dto/saleOrder.dto";
import SaleOrderStatusBadge from "./SaleOrderStatusBadge";
import { Link } from "react-router-dom";
import { Eye, Edit, Send, CheckCircle, XCircle } from "lucide-react";
import { formatVND } from "@/utils/currency.helper";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  submitSaleOrder,
  approveSaleOrder,
  rejectSaleOrder,
  fetchSaleOrders,
} from "@/features/sales/store/saleOrder.slice";
import RejectReasonModal from "./RejectReasonModal";

interface Props {
  items: SaleOrderDto[];
}

export default function SaleOrderTable({ items }: Props) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(s => s.auth);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // ✅ Check permissions for actions
  const canEdit = (order: SaleOrderDto): boolean => {
    if (!user) return false;
    // SALES can edit their own draft orders
    if (user.role?.code === "SALES") {
      return order.approval_status === "draft" && order.created_by === user.id;
    }
    return false;
  };

  const canSubmit = (order: SaleOrderDto): boolean => {
    if (!user) return false;
    // SALES can submit their own draft orders
    if (user.role?.code === "SALES") {
      return order.approval_status === "draft" && order.created_by === user.id;
    }
    return false;
  };

  const canApprove = (order: SaleOrderDto): boolean => {
    if (!user) return false;
    // Only SALESMANAGER can approve
    return user.role?.code === "SALESMANAGER" && order.approval_status === "waiting_approval";
  };

  const canReject = (order: SaleOrderDto): boolean => {
    if (!user) return false;
    // Only SALESMANAGER can reject
    return user.role?.code === "SALESMANAGER" && order.approval_status === "waiting_approval";
  };

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
                  title="View"
                >
                  <Eye size={16} />
                </Link>

                {/* EDIT - Only SALES on their own draft orders */}
                {canEdit(item) && (
                  <Link
                    to={`/sales/orders/${item.id}/edit`}
                    className="p-1.5 border rounded text-gray-600 hover:bg-gray-100"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </Link>
                )}

                {/* SUBMIT - Only SALES on their own draft orders */}
                {canSubmit(item) && (
                  <button
                    onClick={() => {
                      if (window.confirm("Submit order for approval?")) {
                        dispatch(submitSaleOrder(item.id)).then(() => {
                          // ✅ Refresh table after submit
                          dispatch(fetchSaleOrders());
                        });
                      }
                    }}
                    className="p-1.5 border rounded text-yellow-600 hover:bg-yellow-50 transition"
                    title="Submit for Approval"
                  >
                    <Send size={16} />
                  </button>
                )}

                {/* APPROVE - Only SALESMANAGER on waiting_approval orders */}
                {canApprove(item) && (
                  <button
                    onClick={() => {
                      if (window.confirm("Approve this order?")) {
                        dispatch(approveSaleOrder(item.id)).then(() => {
                          // ✅ Refresh table after approve
                          dispatch(fetchSaleOrders());
                        });
                      }
                    }}
                    className="p-1.5 border rounded text-green-600 hover:bg-green-50 transition"
                    title="Approve"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}

                {/* REJECT - Only SALESMANAGER on waiting_approval orders */}
                {canReject(item) && (
                  <button
                    onClick={() => {
                      setSelectedOrderId(item.id);
                      setRejectModalOpen(true);
                    }}
                    className="p-1.5 border rounded text-red-600 hover:bg-red-50 transition"
                    title="Reject"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* REJECT MODAL */}
      <RejectReasonModal
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedOrderId(null);
        }}
        onConfirm={(reason) => {
          if (selectedOrderId) {
            dispatch(rejectSaleOrder({ id: selectedOrderId, reason })).then(() => {
              // ✅ Refresh table after reject
              dispatch(fetchSaleOrders());
            });
          }
          setRejectModalOpen(false);
          setSelectedOrderId(null);
        }}
      />
    </div>
  );
}