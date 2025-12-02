import { ArInvoiceDto } from "../../dto/invoice.dto";
import StatusBadge from "./StatusBadge";
import { Eye, Download, FileText } from "lucide-react";

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
              {inv.total_after_tax.toLocaleString("vi-VN")}
            </td>

            <td className="px-6 py-4">
              <StatusBadge status={inv.status} type="status" />
            </td>

            <td className="px-6 py-4">
              <StatusBadge status={inv.approval_status} type="approval" />
            </td>

            <td className="px-6 py-4">
              <div className="flex gap-2">
                <button onClick={() => onView(inv.id)}>
                  <Eye size={18} />
                </button>


                <button>
                  <Download size={18} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
