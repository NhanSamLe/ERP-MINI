
import { useNavigate } from "react-router-dom";

interface Props {
  invoiceNo: string;
}

export default function InvoiceDetailBreadcrumb({ invoiceNo }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 mb-6 text-sm">
      <button
        onClick={() => navigate("/ar/invoices")}
        className="text-gray-600 hover:text-gray-900 transition"
      >
        Invoices
      </button>
      <span className="text-gray-400">/</span>
      <span className="text-gray-900 font-medium">{invoiceNo}</span>
    </div>
  );
}