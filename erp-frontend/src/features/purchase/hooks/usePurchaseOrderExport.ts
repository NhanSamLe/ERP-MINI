import { useState } from "react";
import { toast } from "react-toastify";
import { PurchaseOrder } from "../store/purchaseOrder.types";

export const usePurchaseOrderExport = (po: PurchaseOrder) => {
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async (supplierInfo?: any, lang: "vi" | "en" = "vi") => {
    setExporting(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { createElement } = await import("react");
      const { PurchaseOrderPDF } = await import("../components/PurchaseOrderPDF");

      const poWithSupplier = supplierInfo ? { ...po, supplier: supplierInfo } : po;
      type PDFElement = import("react").ReactElement<import("@react-pdf/renderer").DocumentProps>;
      const element = createElement(PurchaseOrderPDF, { po: poWithSupplier, lang }) as unknown as PDFElement;

      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PO-${po.po_no}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Xuất PDF đơn mua hàng thành công!");
    } catch (err) {
      console.error("Purchase Order PDF export error:", err);
      toast.error("Lỗi xuất PDF. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  return { exporting, exportToPDF };
};
