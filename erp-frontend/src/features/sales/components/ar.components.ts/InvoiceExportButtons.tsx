import React, { useState } from "react";
import { ArInvoiceDto } from "../../dto/invoice.dto";

interface Props {
  invoice: ArInvoiceDto;
}

export default function InvoiceExportButtons({ invoice }: Props) {
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Export PDF using jsPDF + html2canvas
  const exportToPDF = async () => {
    setExporting("pdf");
    try {
      // Dynamic import để giảm bundle size
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const element = document.getElementById("invoice-print-area");
      if (!element) {
        alert("Invoice element not found");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      pdf.save(`${invoice.invoice_no}.pdf`);
      alert("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  // Export to Excel using SheetJS
  const exportToExcel = async () => {
    setExporting("excel");
    try {
      const XLSX = (await import("xlsx")).default;

      // Prepare data
      const worksheetData = [
        ["HÓA ĐƠN BÁN HÀNG"],
        [],
        ["Số HÓA ĐƠN:", invoice.invoice_no, "Ngày:", formatDate(invoice.invoice_date)],
        [],
        ["CHI NHÁNH:", invoice.branch?.name],
        [],
        ["KHÁCH HÀNG:", invoice.order?.customer?.name],
        ["Địa chỉ:", invoice.order?.customer?.address],
        ["Điện thoại:", invoice.order?.customer?.phone],
        ["Email:", invoice.order?.customer?.email],
        ["Mã số thuế:", invoice.order?.customer?.tax_code],
        [],
        ["Số đơn hàng:", invoice.order?.order_no, "Ngày đơn:", formatDate(invoice.order?.order_date || "")],
        [],
        ["STT", "Tên sản phẩm", "Số lượng", "Đơn giá", "Thành tiền", "Thuế (%)", "Cộng"],
      ];

      // Add line items
    invoice.lines.forEach((line, idx) => {
    worksheetData.push([
       String(idx + 1),
        line.product?.name || "—",
        line.quantity.toString(),
        line.unit_price.toString(),
        (line.line_total || 0).toString(),
        (line.taxRate?.rate || 0).toString(),
        (line.line_total_after_tax || 0).toString(),
    ]);
    });
      // Add summary
      worksheetData.push([]);
      worksheetData.push(["", "", "", "Cộng tiền hàng:", formatCurrency(invoice.total_before_tax)]);
      worksheetData.push(["", "", "", "Tổng thuế GTGT:", formatCurrency(invoice.total_tax)]);
      worksheetData.push(["", "", "", "TỔNG CỘNG:", formatCurrency(invoice.total_after_tax)]);
      worksheetData.push([]);
      worksheetData.push(["Người lập:", invoice.creator?.full_name || "—", "Người duyệt:", "—", "Người mua:", "—"]);

      // Create workbook
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      worksheet["!cols"] = [
        { wch: 5 },   // STT
        { wch: 30 },  // Tên sản phẩm
        { wch: 12 },  // Số lượng
        { wch: 15 },  // Đơn giá
        { wch: 15 },  // Thành tiền
        { wch: 10 },  // Thuế
        { wch: 15 },  // Cộng
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Hóa Đơn");

      XLSX.writeFile(workbook, `${invoice.invoice_no}.xlsx`);
      alert("Excel exported successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Failed to export Excel. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  // Print invoice
  const printInvoice = () => {
    const element = document.getElementById("invoice-print-area");
    if (!element) {
      alert("Invoice element not found");
      return;
    }

    const printWindow = window.open("", "", "width=900,height=600");
    if (!printWindow) {
      alert("Please allow popups to print the invoice");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${invoice.invoice_no}</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .mb-8 { margin-bottom: 20px; }
            .border-top { border-top: 2px solid #000; margin-top: 20px; padding-top: 20px; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

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