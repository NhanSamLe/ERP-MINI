import { useState } from "react";
import { toast } from "react-toastify";
import { ApPayment } from "../store/apPayment/apPayment.types";

export const useApPaymentExport = (payment: ApPayment) => {
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async (lang: "vi" | "en" = "vi") => {
    setExporting(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { createElement } = await import("react");
      const { ApPaymentPDF } = await import("../components/ApPaymentPDF");

      type PDFElement = import("react").ReactElement<import("@react-pdf/renderer").DocumentProps>;
      const element = createElement(ApPaymentPDF, { payment, lang }) as unknown as PDFElement;

      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Payment-${payment.payment_no}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Xuất PDF phiếu chi thành công!");
    } catch (err) {
      console.error("AP Payment PDF export error:", err);
      toast.error("Lỗi xuất PDF. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  return { exporting, exportToPDF };
};
