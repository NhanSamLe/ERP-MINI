import { ArInvoiceDto } from "../../dto/invoice.dto";
import StatusBadge from "./StatusBadge";
import { Eye, FileText } from "lucide-react";

interface Props {
  invoices: ArInvoiceDto[];
  onView: (id: number) => void;
}

export default function InvoiceTable({ invoices, onView }: Props) {
  if (invoices.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-gray-400">
        <FileText size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Không tìm thấy hóa đơn.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Số hóa đơn</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Chi nhánh</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng tiền</th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Phê duyệt</th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoices.map(inv => {
            const customerName =
              inv.customer?.name || inv.order?.customer?.name || "—";
            const currencySymbol =
              inv.currency?.symbol || inv.currency?.code || "VND";
            const fmtAmount = `${Number(inv.total_after_tax || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ${currencySymbol}`;

            return (
              <tr key={inv.id} className="hover:bg-orange-50/30 transition-colors">
                <td className="px-6 py-4">
                  <button
                    onClick={() => onView(inv.id)}
                    className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    {inv.invoice_no}
                  </button>
                </td>
                <td className="px-6 py-4 text-gray-800 font-medium">{customerName}</td>
                <td className="px-6 py-4 text-gray-600">{inv.branch?.name || "—"}</td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900">{fmtAmount}</td>
                <td className="px-6 py-4 text-center">
                  <StatusBadge status={inv.status} type="status" />
                </td>
                <td className="px-6 py-4 text-center">
                  <StatusBadge status={inv.approval_status} type="approval" />
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onView(inv.id)}
                    className="p-1.5 border border-gray-200 rounded text-gray-500 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition"
                    title="Xem chi tiết"
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
