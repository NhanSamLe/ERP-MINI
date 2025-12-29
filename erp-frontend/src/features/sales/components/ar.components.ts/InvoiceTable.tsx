import { ArInvoiceDto } from "../../dto/invoice.dto";
import StatusBadge from "./StatusBadge";
import { Eye, Download, FileText } from "lucide-react";
import { formatVND } from "@/utils/currency.helper";

interface Props {
  invoices: ArInvoiceDto[];
  onView: (id: number) => void;
}

export default function InvoiceTable({ invoices, onView }: Props) {
  if (invoices.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        <FileText size={48} className="mx-auto opacity-30" />
        <p className="text-lg font-medium">No invoices found</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <tbody>
        {invoices.map(inv => (
          <tr key={inv.id} className="border-b hover:bg-orange-50">
            <td className="px-6 py-4 font-medium text-orange-600">
              <button onClick={() => onView(inv.id)}>
                {inv.invoice_no}
              </button>
            </td>

            <td className="px-6 py-4">{inv.branch?.name}</td>

            <td className="px-6 py-4">
              {inv.order?.customer?.name ?? "-"}
            </td>

            <td className="px-6 py-4 font-semibold">
              {formatVND(inv.total_after_tax)}
            </td>

            <td className="px-6 py-4">
              <StatusBadge status={inv.status} type="status" />
            </td>

            <td className="px-6 py-4">
              <StatusBadge status={inv.approval_status} type="approval" />
            </td>

            <td className="px-6 py-4">
              <div className="flex gap-2">
                <button
                  onClick={() => onView(inv.id)}
                  className="p-1.5 border border-gray-300 rounded text-blue-600 hover:bg-blue-50 transition"
                  title="View Invoice"
                >
                  <Eye size={16} />
                </button>

                <button
                  className="p-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition"
                  title="Download PDF"
                >
                  <Download size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
