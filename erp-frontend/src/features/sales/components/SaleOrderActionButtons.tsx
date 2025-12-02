import React from "react";
import { SaleOrderDto } from "../dto/saleOrder.dto";
import { User } from "../../../types/User";
import { Download, Edit2 } from "lucide-react";

interface Props {
  order: SaleOrderDto;
  user: User;
  onEdit: () => void;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCreateInvoice: () => void;
}

export default function SaleOrderActionButtons({
  order,
  user,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onCreateInvoice
}: Props) {
  const role = user.role.code;

  const allowEdit =
    role === "SALES" &&
    order.created_by === user.id &&
    order.approval_status === "draft";

  const allowSubmit = allowEdit;

  const allowApprove =
    ["SALESMANAGER", "BRMN", "CEO"].includes(role) &&
    order.approval_status === "waiting_approval";

  return (
    <div className="flex gap-3">
      <button className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition flex items-center gap-2">
        <Download size={18} /> Export PDF
      </button>

      {allowEdit && (
        <button
          onClick={onEdit}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
        >
          <Edit2 size={18} /> Edit Order
        </button>
      )}

      {allowSubmit && (
        <button
          onClick={onSubmit}
          className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition"
        >
          Submit for Approval
        </button>
      )}

      {allowApprove && (
        <>
          <button
            onClick={onApprove}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            Reject
          </button>
        </>
      )}
      {role === "ACCOUNT" &&
        order.approval_status === "approved" &&
        order.status === "confirmed" && (
          <button
            onClick={onCreateInvoice}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Tạo hóa đơn
          </button>
      )}
    </div>
  );
}
