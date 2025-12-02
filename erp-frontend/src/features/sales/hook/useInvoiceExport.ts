import { useState } from "react";
import { ArInvoiceDto } from "../dto/invoice.dto";

export const useInvoiceExport = (invoice: ArInvoiceDto) => {
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

  const getInvoiceHTML = () => {
    return `
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 900px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333;">
          <div>
            <h1 style="font-size: 28px; margin: 0; font-weight: bold;">HÓA ĐƠN BÁN HÀNG</h1>
            <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Invoice</p>
          </div>
          <div style="text-align: right;">
            <div style="background: #f5f5f5; padding: 15px; border: 2px solid #333; border-radius: 4px;">
              <p style="font-size: 11px; color: #666; margin: 0; font-weight: bold;">SỐ HÓA ĐƠN</p>
              <p style="font-size: 20px; font-weight: bold; color: #0066cc; margin: 5px 0 0 0;">${invoice.invoice_no}</p>
            </div>
            <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">
              Ngày: <span style="font-weight: bold;">${formatDate(invoice.invoice_date)}</span>
            </p>
          </div>
        </div>

        <!-- Company & Customer Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <!-- From -->
          <div>
            <h3 style="font-size: 11px; font-weight: bold; color: #333; margin: 0 0 10px 0; text-transform: uppercase;">Từ (From):</h3>
            <div style="background: #e3f2fd; padding: 15px; border: 1px solid #90caf9; border-radius: 4px;">
              <p style="font-weight: bold; margin: 0;">${invoice.branch?.name || "—"}</p>
              <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Chi nhánh chính</p>
            </div>
          </div>

          <!-- Bill To -->
          <div>
            <h3 style="font-size: 11px; font-weight: bold; color: #333; margin: 0 0 10px 0; text-transform: uppercase;">Khách hàng (Bill To):</h3>
            <div style="background: #f3e5f5; padding: 15px; border: 1px solid #ce93d8; border-radius: 4px;">
              <p style="font-weight: bold; margin: 0;">${invoice.order?.customer?.name || "—"}</p>
              <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Địa chỉ: ${invoice.order?.customer?.address || "—"}</p>
              <p style="font-size: 12px; color: #666; margin: 3px 0 0 0;">Điện thoại: ${invoice.order?.customer?.phone || "—"}</p>
              <p style="font-size: 12px; color: #666; margin: 3px 0 0 0;">Email: ${invoice.order?.customer?.email || "—"}</p>
              <p style="font-size: 12px; color: #666; margin: 3px 0 0 0;">Mã số thuế: ${invoice.order?.customer?.tax_code || "—"}</p>
            </div>
          </div>
        </div>

        <!-- Order Reference -->
        <div style="background: #fffacd; padding: 15px; border: 1px solid #ffd700; border-radius: 4px; margin-bottom: 30px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            <div>
              <p style="font-size: 10px; color: #666; margin: 0; font-weight: bold; text-transform: uppercase;">Số đơn hàng</p>
              <p style="font-size: 14px; font-weight: bold; margin: 5px 0 0 0;">${invoice.order?.order_no || "—"}</p>
            </div>
            <div>
              <p style="font-size: 10px; color: #666; margin: 0; font-weight: bold; text-transform: uppercase;">Ngày đơn hàng</p>
              <p style="font-size: 14px; font-weight: bold; margin: 5px 0 0 0;">${formatDate(invoice.order?.order_date || "")}</p>
            </div>
            <div>
              <p style="font-size: 10px; color: #666; margin: 0; font-weight: bold; text-transform: uppercase;">Người lập</p>
              <p style="font-size: 14px; font-weight: bold; margin: 5px 0 0 0;">${invoice.creator?.full_name || "—"}</p>
            </div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #333; color: white;">
              <th style="border: 1px solid #333; padding: 12px; text-align: left; font-weight: bold;">STT</th>
              <th style="border: 1px solid #333; padding: 12px; text-align: left; font-weight: bold;">Tên sản phẩm</th>
              <th style="border: 1px solid #333; padding: 12px; text-align: center; font-weight: bold;">Số lượng</th>
              <th style="border: 1px solid #333; padding: 12px; text-align: right; font-weight: bold;">Đơn giá</th>
              <th style="border: 1px solid #333; padding: 12px; text-align: right; font-weight: bold;">Thành tiền</th>
              <th style="border: 1px solid #333; padding: 12px; text-align: center; font-weight: bold;">Thuế</th>
              <th style="border: 1px solid #333; padding: 12px; text-align: right; font-weight: bold;">Cộng</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.lines.map((line, idx) => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">${idx + 1}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">
                  <p style="margin: 0; font-weight: 500;">${line.product?.name || "—"}</p>
                  ${line.description ? `<p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">${line.description}</p>` : ""}
                </td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${Number(line.quantity)}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-family: monospace;">${formatCurrency(line.unit_price)}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-family: monospace;">${formatCurrency(line.line_total || 0)}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${line.taxRate?.rate || 0}%</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-weight: bold;">${formatCurrency(line.line_total_after_tax || 0)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <!-- Summary -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
          <div style="width: 400px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
              <span style="font-weight: bold;">Cộng tiền hàng:</span>
              <span style="font-family: monospace; font-weight: bold;">${formatCurrency(invoice.total_before_tax)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd;">
              <span style="font-weight: bold;">Tổng thuế GTGT:</span>
              <span style="font-family: monospace; font-weight: bold;">${formatCurrency(invoice.total_tax)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: #e3f2fd; border-radius: 4px; font-weight: bold; font-size: 16px;">
              <span>TỔNG CỘNG:</span>
              <span style="font-family: monospace; color: #0066cc;">${formatCurrency(invoice.total_after_tax)}</span>
            </div>
          </div>
        </div>

        <!-- Signatures -->
        <div style="border-top: 2px solid #333; padding-top: 30px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px;">
            <div style="text-align: center;">
              <p style="font-weight: bold; margin: 0 0 15px 0;">Người lập hóa đơn</p>
              <div style="height: 50px;"></div>
              <p style="font-size: 12px; font-weight: bold; margin: 15px 0 0 0;">${invoice.creator?.full_name || "—"}</p>
            </div>
            <div style="text-align: center;">
              <p style="font-weight: bold; margin: 0 0 15px 0;">Người duyệt</p>
              <div style="height: 50px;"></div>
              <p style="font-size: 12px; color: #666; margin: 15px 0 0 0;">(Nếu có)</p>
            </div>
            <div style="text-align: center;">
              <p style="font-weight: bold; margin: 0 0 15px 0;">Người mua hàng</p>
              <div style="height: 50px;"></div>
              <p style="font-size: 12px; color: #666; margin: 15px 0 0 0;">(Nếu có)</p>
            </div>
          </div>
          <p style="text-align: center; font-size: 11px; color: #666; margin: 30px 0 0 0;">
            Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi!
          </p>
          <p style="text-align: center; font-size: 10px; color: #999; margin: 8px 0 0 0;">
            Generated on ${new Date().toLocaleString("vi-VN")}
          </p>
        </div>
      </div>
    `;
  };

  const exportToPDF = async () => {
    setExporting("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      // Tạo temp div với HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = getInvoiceHTML();
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "900px";
      tempDiv.style.background = "white";
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
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

  const exportToExcel = async () => {
    setExporting("excel");
    try {
      const XLSX = (await import("xlsx")).default;

      type WorksheetRow = (string | number)[];
      const worksheetData: WorksheetRow[] = [];

      worksheetData.push(["HÓA ĐƠN BÁN HÀNG"] as WorksheetRow);
      worksheetData.push(["Invoice"] as WorksheetRow);
      worksheetData.push([] as WorksheetRow);

      worksheetData.push(["Số HÓA ĐƠN:", invoice.invoice_no, "", "Ngày:", formatDate(invoice.invoice_date)] as WorksheetRow);
      worksheetData.push([] as WorksheetRow);

      worksheetData.push(["TỪ (FROM):", invoice.branch?.name] as WorksheetRow);
      worksheetData.push([] as WorksheetRow);

      worksheetData.push(["KHÁCH HÀNG (BILL TO):"] as WorksheetRow);
      worksheetData.push(["Tên:", invoice.order?.customer?.name] as WorksheetRow);
      worksheetData.push(["Địa chỉ:", invoice.order?.customer?.address] as WorksheetRow);
      worksheetData.push(["Điện thoại:", invoice.order?.customer?.phone] as WorksheetRow);
      worksheetData.push(["Email:", invoice.order?.customer?.email] as WorksheetRow);
      worksheetData.push(["Mã số thuế:", invoice.order?.customer?.tax_code] as WorksheetRow);
      worksheetData.push([] as WorksheetRow);

      worksheetData.push(["Số đơn hàng:", invoice.order?.order_no, "Ngày đơn:", formatDate(invoice.order?.order_date || "")] as WorksheetRow);
      worksheetData.push(["Người lập:", invoice.creator?.full_name || "—"] as WorksheetRow);
      worksheetData.push([] as WorksheetRow);

      worksheetData.push(["STT", "Tên sản phẩm", "Số lượng", "Đơn giá", "Thành tiền", "Thuế (%)", "Cộng"] as WorksheetRow);

      invoice.lines.forEach((line, idx) => {
        worksheetData.push([
          idx + 1,
          line.product?.name || "—",
          line.quantity,
          line.unit_price,
          line.line_total || 0,
          line.taxRate?.rate || 0,
          line.line_total_after_tax || 0,
        ] as WorksheetRow);
      });

      worksheetData.push([] as WorksheetRow);
      worksheetData.push(["", "", "", "Cộng tiền hàng:", invoice.total_before_tax] as WorksheetRow);
      worksheetData.push(["", "", "", "Tổng thuế GTGT:", invoice.total_tax] as WorksheetRow);
      worksheetData.push(["", "", "", "TỔNG CỘNG:", invoice.total_after_tax] as WorksheetRow);
      worksheetData.push([] as WorksheetRow);
      worksheetData.push(["Người lập hóa đơn", "Người duyệt", "Người mua hàng"] as WorksheetRow);
      worksheetData.push([invoice.creator?.full_name || "—", "", ""] as WorksheetRow);

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      worksheet["!cols"] = [
        { wch: 5 }, { wch: 35 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
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

  const printInvoice = () => {
    const printWindow = window.open("", "", "width=900,height=600");
    if (!printWindow) {
      alert("Please allow popups to print the invoice");
      return;
    }

    const html = `
      <html>
        <head>
          <title>${invoice.invoice_no}</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          ${getInvoiceHTML()}
          <script>
            window.print();
            setTimeout(() => window.close(), 1000);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return {
    exporting,
    exportToPDF,
    exportToExcel,
    printInvoice,
  };
};