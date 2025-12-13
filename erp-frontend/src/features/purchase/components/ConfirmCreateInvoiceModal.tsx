import { X, FileText, AlertTriangle } from "lucide-react";
import { PurchaseOrder } from "../store/purchaseOrder.types";

interface Props {
  open: boolean;
  po: PurchaseOrder | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmCreateInvoiceModal({
  open,
  po,
  onCancel,
  onConfirm,
}: Props) {
  if (!open || !po) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-lg">Create AP Invoice</h3>
          </div>
          <X className="w-5 h-5 cursor-pointer" onClick={onCancel} />
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <p className="text-sm text-gray-700">
              Are you sure you want to create an AP Invoice from this Purchase
              Order?
            </p>
          </div>

          <div className="rounded-lg border bg-gray-50 p-3 text-sm">
            <div className="font-semibold text-gray-900">{po.po_no}</div>
            <div className="text-gray-600">Supplier: {po.supplier?.name}</div>
            <div className="font-semibold text-right mt-2">
              {Number(po.total_after_tax || 0).toLocaleString("vi-VN")} VND
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
