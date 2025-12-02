import React from "react";
import { ArInvoiceDto } from "../../dto/invoice.dto";
import { useInvoiceExport } from "../../hook/useInvoiceExport";

interface Props {
  invoice: ArInvoiceDto;
}

export default function InvoiceExportToolbar({ invoice }: Props) {
  const { exporting, exportToPDF, exportToExcel, printInvoice } =
    useInvoiceExport(invoice);

  return (
    <div className="flex gap-3 mb-6">
      <button
        onClick={exportToPDF}
        disabled={exporting === "pdf"}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition font-medium flex items-center gap-2"
      >
        <span>{exporting === "pdf" ? "⏳" : "📄"}</span>
        {exporting === "pdf" ? "Exporting PDF..." : "Export PDF"}
      </button>

      <button
        onClick={exportToExcel}
        disabled={exporting === "excel"}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition font-medium flex items-center gap-2"
      >
        <span>{exporting === "excel" ? "⏳" : "📊"}</span>
        {exporting === "excel" ? "Exporting Excel..." : "Export Excel"}
      </button>

      <button
        onClick={printInvoice}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
      >
        <span>🖨️</span>
        Print
      </button>
    </div>
  );
}