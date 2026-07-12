import { useState } from "react";
import { SaleOrderDto } from "../dto/saleOrder.dto";
import { StatusBadge } from "@/components/common";
import { Link } from "react-router-dom";
import { Eye, Edit, Send, CheckCircle, XCircle } from "lucide-react";
import { formatDateTime } from "@/utils/time.helper";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  submitSaleOrder,
  approveSaleOrder,
  rejectSaleOrder,
  fetchSaleOrders,
} from "@/features/sales/store/saleOrder.slice";
import { ActionConfirmModal } from "@/components/common";
import { formatCurrency } from "@/utils/currency.helper";

interface Props {
  items: SaleOrderDto[];
}

export default function SaleOrderTable({ items }: Props) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; orderId: number | null }>({
    open: false, orderId: null,
  });

  const canEdit   = (o: SaleOrderDto) => o.approval_status === "draft" && (o.created_by === user?.id || ["ADMIN", "CEO", "BRANCH_MANAGER", "SALESMANAGER"].includes(user?.role?.code ?? ""));
  const canSubmit = (o: SaleOrderDto) => o.approval_status === "draft" && (o.created_by === user?.id || ["ADMIN", "CEO", "BRANCH_MANAGER", "SALESMANAGER"].includes(user?.role?.code ?? ""));
  const canApprove= (o: SaleOrderDto) => ["SALESMANAGER", "BRANCH_MANAGER", "CEO", "ADMIN"].includes(user?.role?.code ?? "") && o.approval_status === "waiting_approval";
  const canReject = (o: SaleOrderDto) => ["SALESMANAGER", "BRANCH_MANAGER", "CEO", "ADMIN"].includes(user?.role?.code ?? "") && o.approval_status === "waiting_approval";

  const refresh = () => dispatch(fetchSaleOrders());
  const formatOrderMoney = (item: SaleOrderDto) =>
    formatCurrency(item.total_after_tax, item.currency?.symbol || item.currency?.code || "VND");

  if (items.length === 0) {
    return (
      <div className="py-14 text-center text-sm text-gray-400">Không tìm thấy đơn hàng.</div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              {["Số đơn hàng", "Khách hàng", "Trạng thái", "Tổng tiền", "Người tạo", "Ngày tạo", "Thao tác"].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${h === "Actions" ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-orange-50/40 transition-colors duration-100 group">
                <td className="px-4 py-3 font-semibold text-orange-600 whitespace-nowrap">
                  <Link to={`/sales/orders/${item.id}`} className="hover:underline">
                    {item.order_no}
                  </Link>
                </td>

                <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">
                  {item.customer?.name || `Partner #${item.customer_id}`}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={item.approval_status} />
                </td>

                <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">
                  {formatOrderMoney(item)}
                </td>

                <td className="px-4 py-3 text-gray-600">
                  {item.creator?.full_name}
                </td>

                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {formatDateTime(item.created_at)}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/sales/orders/${item.id}`}
                      title="Xem"
                      className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>

                    {canEdit(item) && (
                      <Link
                        to={`/sales/orders/${item.id}/edit`}
                        title="Sửa"
                        className="p-1.5 rounded text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {canSubmit(item) && (
                      <button
                        title="Gửi phê duyệt"
                        onClick={() =>
                          dispatch(submitSaleOrder(item.id)).then(refresh)
                        }
                        className="p-1.5 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canApprove(item) && (
                      <button
                        title="Phê duyệt"
                        onClick={() =>
                          dispatch(approveSaleOrder(item.id)).then(refresh)
                        }
                        className="p-1.5 rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canReject(item) && (
                      <button
                        title="Từ chối"
                        onClick={() => setRejectModal({ open: true, orderId: item.id })}
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ActionConfirmModal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, orderId: null })}
        title="Từ chối đơn hàng"
        description="Vui lòng nhập lý do từ chối đơn hàng này."
        confirmText="Từ chối"
        variant="danger"
        requireReason
        onConfirm={(reason) => {
          if (rejectModal.orderId) {
            dispatch(rejectSaleOrder({ id: rejectModal.orderId, reason: reason ?? "" })).then(refresh);
          }
          setRejectModal({ open: false, orderId: null });
        }}
      />
    </>
  );
}
