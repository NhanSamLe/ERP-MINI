import { useState } from "react";
import { toast } from "react-toastify";
import { ViewStockMove } from "../store/stock/stockmove/stockMove.types";

export const useStockMoveExport = (move: ViewStockMove | null) => {
  const [exporting, setExporting] = useState<"pdf" | null>(null);

  const buildPDFBlob = async (lang: "vi" | "en" = "vi") => {
    if (!move) throw new Error("No stock move data to export");
    const { pdf } = await import("@react-pdf/renderer");
    const { createElement } = await import("react");
    const { StockMovePDF } = await import("../components/StockMovePDF");

    type PDFElement = import("react").ReactElement<import("@react-pdf/renderer").DocumentProps>;
    const element = createElement(StockMovePDF, { move, lang }) as unknown as PDFElement;

    return pdf(element).toBlob();
  };

  const exportToPDF = async (lang: "vi" | "en" = "vi") => {
    if (!move) return;
    setExporting("pdf");
    try {
      const blob = await buildPDFBlob(lang);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Phieu_Kho_${move.move_no}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Xuất PDF phiếu kho thành công!");
    } catch (err) {
      console.error("Stock Move PDF export error:", err);
      toast.error("Lỗi xuất PDF. Vui lòng thử lại.");
    } finally {
      setExporting(null);
    }
  };

  const printStockMove = async (lang: "vi" | "en" = "vi") => {
    if (!move) return;
    setExporting("pdf");
    try {
      const blob = await buildPDFBlob(lang);
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, "_blank");
      if (newWindow) {
        newWindow.focus();
      } else {
        toast.warning("Vui lòng cho phép trình duyệt mở pop-up để xem bản in.");
      }
    } catch (err) {
      console.error("Print Stock Move error:", err);
      toast.error("Lỗi in phiếu kho. Vui lòng thử lại.");
    } finally {
      setExporting(null);
    }
  };

  return { exporting, exportToPDF, printStockMove };
};
