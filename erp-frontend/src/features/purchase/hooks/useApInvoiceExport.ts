import { useState } from "react";
import { toast } from "react-toastify";
import { ApInvoice } from "../store/apInvoice/apInvoice.types";

export const useApInvoiceExport = (invoice: ApInvoice) => {
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async (lang: "vi" | "en" = "vi") => {
    setExporting(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { createElement } = await import("react");
      const { ApInvoicePDF } = await import("../components/ApInvoicePDF");

      type PDFElement = import("react").ReactElement<import("@react-pdf/renderer").DocumentProps>;
      const element = createElement(ApInvoicePDF, { invoice, lang }) as unknown as PDFElement;

      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoice.invoice_no}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Xuất PDF hóa đơn mua hàng thành công!");
    } catch (err) {
      console.error("AP Invoice PDF export error:", err);
      toast.error("Lỗi xuất PDF. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  return { exporting, exportToPDF };
};
