import { useState } from "react";
import type ExcelJS from "exceljs";
import { toast } from "react-toastify";
import { ArInvoiceDto } from "../dto/invoice.dto";

export type InvoiceLang = "vi" | "en";

export const useInvoiceExport = (invoice: ArInvoiceDto) => {
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  /* ── shared helpers (used by Excel) ─────────────────────── */
  const currencyCode = invoice.currency?.code || "VND";
  const exchangeRate   = Number(invoice.exchange_rate || 1);
  const customer       = (invoice.customer || invoice.order?.customer) as any;

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  /* ── helper: build + download blob ──────────────────────── */
  const buildPDFBlob = async (lang: InvoiceLang = "vi") => {
    const { pdf }        = await import("@react-pdf/renderer");
    const { createElement } = await import("react");
    const { InvoicePDF } = await import("../components/ar.components.ts/InvoicePDF");

    type PDFElement = import("react").ReactElement<import("@react-pdf/renderer").DocumentProps>;
    const element = createElement(InvoicePDF, { invoice, lang }) as unknown as PDFElement;

    return pdf(element).toBlob();
  };

  /* ── export PDF ──────────────────────────────────────────── */
  const exportToPDF = async (lang: InvoiceLang = "vi") => {
    setExporting("pdf");
    try {
      const blob = await buildPDFBlob(lang);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${invoice.invoice_no}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Lỗi xuất PDF. Vui lòng thử lại.");
    } finally {
      setExporting(null);
    }
  };

  /* ── print (opens PDF in new tab → browser print dialog) ── */
  const printInvoice = async (lang: InvoiceLang = "vi") => {
    try {
      const blob = await buildPDFBlob(lang);
      const url  = URL.createObjectURL(blob);
      const win  = window.open(url, "_blank");
      if (!win) toast.warn("Vui lòng cho phép popup để in hóa đơn.");
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Lỗi in hóa đơn. Vui lòng thử lại.");
    }
  };

  /* ── export Excel (dùng ExcelJS + file-saver, đồng nhất project) ── */
  const exportToExcel = async () => {
    setExporting("excel");
    try {
      const ExcelJS   = (await import("exceljs")).default;
      const { saveAs } = await import("file-saver");

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Hóa Đơn");

      // ── col widths ──
      ws.columns = [
        { width: 5  }, // A – STT / label
        { width: 30 }, // B – Tên SP / value
        { width: 12 }, // C – SKU
        { width: 8  }, // D – ĐVT
        { width: 22 }, // E – Mô tả
        { width: 8  }, // F – SL
        { width: 16 }, // G – Đơn giá
        { width: 16 }, // H – Tiền hàng
        { width: 10 }, // I – Thuế %
        { width: 14 }, // J – Tiền thuế
        { width: 16 }, // K – Thành tiền
      ];

      const COL = 11; // total columns
      const ORANGE: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEA580C" } };
      const DARK:   ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
      const LIGHT:  ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7ED" } };
      const GRAY:   ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };

      const thinBorder = (cell: ExcelJS.Cell) => {
        cell.border = {
          top:    { style: "thin", color: { argb: "FFE5E7EB" } },
          left:   { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right:  { style: "thin", color: { argb: "FFE5E7EB" } },
        };
      };

      let r = 1;

      // ── TITLE ──────────────────────────────────────────────
      ws.mergeCells(r, 1, r, COL);
      const titleCell = ws.getCell(r, 1);
      titleCell.value     = "HÓA ĐƠN BÁN HÀNG / COMMERCIAL INVOICE";
      titleCell.font      = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      titleCell.fill      = DARK;
      ws.getRow(r).height = 36;
      r++;

      // sub-title row: invoice_no + date
      ws.mergeCells(r, 1, r, 6);
      ws.getCell(r, 1).value     = `Số hóa đơn: ${invoice.invoice_no}`;
      ws.getCell(r, 1).font      = { bold: true, size: 11, color: { argb: "FFEA580C" } };
      ws.getCell(r, 1).alignment = { horizontal: "left", vertical: "middle" };
      ws.getCell(r, 1).fill      = LIGHT;

      ws.mergeCells(r, 7, r, COL);
      ws.getCell(r, 7).value     = `Ngày: ${fmtDate(invoice.invoice_date)}${invoice.due_date ? `   Đến hạn: ${fmtDate(invoice.due_date)}` : ""}`;
      ws.getCell(r, 7).font      = { size: 9, color: { argb: "FF374151" } };
      ws.getCell(r, 7).alignment = { horizontal: "right", vertical: "middle" };
      ws.getCell(r, 7).fill      = LIGHT;
      ws.getRow(r).height = 22;
      r++;

      ws.addRow([]); r++;

      // ── INFO SECTION (2 columns: left=seller, right=customer) ──
      // LEFT: seller info
      const sellerLines: [string, string][] = [
        ["CHI NHÁNH",    invoice.branch?.name     || "—"],
        ["SỐ ĐƠN HÀNG", invoice.order?.order_no  || "—"],
        ["NGÀY ĐẶT",     fmtDate(invoice.order?.order_date)],
        ["NGƯỜI LẬP",    invoice.creator?.full_name || invoice.creator?.username || "—"],
        ...(invoice.approver ? [["NGƯỜI DUYỆT", invoice.approver.full_name || invoice.approver.username] as [string, string]] : []),
        ["TRẠNG THÁI",   invoice.status],
        ["PHÊ DUYỆT",    invoice.approval_status],
        ...(currencyCode !== "VND" ? [["TỶ GIÁ", `1 ${currencyCode} = ${exchangeRate.toLocaleString("vi-VN")} VND`] as [string, string]] : []),
      ];

      // RIGHT: customer info
      const custLines: [string, string][] = [
        ["KHÁCH HÀNG",   customer?.name      || "—"],
        ["ĐIỆN THOẠI",   customer?.phone     || "—"],
        ["EMAIL",        customer?.email     || "—"],
        ["MÃ SỐ THUẾ",  customer?.tax_code  || "—"],
        ["ĐỊA CHỈ",     customer?.address   || "—"],
      ];

      const infoRows = Math.max(sellerLines.length, custLines.length);

      // header row for left block
      ws.mergeCells(r, 1, r, 5);
      ws.getCell(r, 1).value     = "ĐƠN VỊ BÁN HÀNG";
      ws.getCell(r, 1).font      = { bold: true, size: 9, color: { argb: "FFFFFFFF" } };
      ws.getCell(r, 1).fill      = DARK;
      ws.getCell(r, 1).alignment = { horizontal: "center" };
      ws.mergeCells(r, 6, r, COL);
      ws.getCell(r, 6).value     = "THÔNG TIN KHÁCH HÀNG";
      ws.getCell(r, 6).font      = { bold: true, size: 9, color: { argb: "FFFFFFFF" } };
      ws.getCell(r, 6).fill      = ORANGE;
      ws.getCell(r, 6).alignment = { horizontal: "center" };
      ws.getRow(r).height = 18;
      r++;

      for (let i = 0; i < infoRows; i++) {
        const row = ws.getRow(r);
        if (sellerLines[i]) {
          row.getCell(1).value = sellerLines[i][0];
          row.getCell(1).font  = { bold: true, size: 8, color: { argb: "FF6B7280" } };
          row.getCell(1).fill  = GRAY;
          ws.mergeCells(r, 2, r, 5);
          row.getCell(2).value = sellerLines[i][1];
          row.getCell(2).font  = { size: 9 };
        }
        if (custLines[i]) {
          row.getCell(6).value = custLines[i][0];
          row.getCell(6).font  = { bold: true, size: 8, color: { argb: "FF6B7280" } };
          row.getCell(6).fill  = LIGHT;
          ws.mergeCells(r, 7, r, COL);
          row.getCell(7).value = custLines[i][1];
          row.getCell(7).font  = { size: 9 };
        }
        for (let c = 1; c <= COL; c++) thinBorder(ws.getCell(r, c));
        row.height = 16;
        r++;
      }

      ws.addRow([]); r++;

      // ── TABLE HEADER ────────────────────────────────────────
      const headers = ["#", "Tên sản phẩm", "SKU", "ĐVT", "Mô tả", "SL",
                        `Đơn giá (${currencyCode})`, `Tiền hàng (${currencyCode})`,
                        "Thuế (%)", "Tiền thuế", `Thành tiền (${currencyCode})`];
      const hRow = ws.getRow(r);
      hRow.values = ["", ...headers]; // 1-based
      for (let c = 1; c <= COL; c++) {
        const cell = hRow.getCell(c);
        cell.value = headers[c - 1];
        cell.font  = { bold: true, size: 9, color: { argb: "FFFFFFFF" } };
        cell.fill  = DARK;
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        thinBorder(cell);
      }
      hRow.height = 22;
      r++;

      // ── TABLE ROWS ───────────────────────────────────────────
      invoice.lines.forEach((line, idx) => {
        const uom        = (line.product as any)?.uom?.code || "";
        const sku        = (line.product as any)?.sku       || "";
        const qty        = Number(line.quantity ?? 0);
        const unitPrice  = Number(line.unit_price ?? 0);
        const lineTotal  = Number(line.line_total ?? 0);
        const taxRate    = line.taxRate?.rate ?? 0;
        const lineTax    = Number(line.line_tax ?? 0);
        const lineAfter  = Number(line.line_total_after_tax ?? 0);

        const dRow = ws.getRow(r);
        const vals = [idx + 1, line.product?.name || "—", sku, uom,
                      line.description || "", qty, unitPrice, lineTotal, taxRate, lineTax, lineAfter];
        vals.forEach((v, ci) => {
          const cell = dRow.getCell(ci + 1);
          cell.value = v;
          cell.font  = { size: 9 };
          cell.fill  = idx % 2 === 1 ? GRAY : { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
          cell.alignment = { vertical: "middle", horizontal: ci >= 5 ? "right" : ci === 0 ? "center" : "left" };
          if (ci >= 6) cell.numFmt = '#,##0.##';
          thinBorder(cell);
        });
        dRow.height = 18;
        r++;
      });

      ws.addRow([]); r++;

      // ── SUMMARY ──────────────────────────────────────────────
      const summaryRows: [string, number][] = [
        ["Cộng tiền hàng (chưa thuế)", Number(invoice.total_before_tax)],
        ["Thuế GTGT",                  Number(invoice.total_tax)],
      ];
      if (Number(invoice.paid_amount) > 0) {
        summaryRows.push(["Đã thanh toán", Number(invoice.paid_amount)]);
        summaryRows.push(["Còn lại", Number(invoice.total_after_tax) - Number(invoice.paid_amount)]);
      }

      summaryRows.forEach(([label, val]) => {
        ws.mergeCells(r, 1, r, 9);
        ws.getCell(r, 10).value     = label;
        ws.getCell(r, 10).font      = { size: 9, color: { argb: "FF374151" } };
        ws.getCell(r, 10).alignment = { horizontal: "right" };
        ws.getCell(r, COL).value    = val;
        ws.getCell(r, COL).font     = { bold: true, size: 9 };
        ws.getCell(r, COL).numFmt   = '#,##0.##';
        ws.getCell(r, COL).alignment = { horizontal: "right" };
        ws.getRow(r).height = 16;
        r++;
      });

      // TOTAL row
      ws.mergeCells(r, 1, r, 9);
      ws.getCell(r, 1).fill = LIGHT;
      ws.getCell(r, 10).value     = "TỔNG CỘNG";
      ws.getCell(r, 10).font      = { bold: true, size: 11, color: { argb: "FFEA580C" } };
      ws.getCell(r, 10).alignment = { horizontal: "right" };
      ws.getCell(r, 10).fill      = LIGHT;
      ws.getCell(r, COL).value    = Number(invoice.total_after_tax);
      ws.getCell(r, COL).font     = { bold: true, size: 11, color: { argb: "FFEA580C" } };
      ws.getCell(r, COL).numFmt   = '#,##0.##';
      ws.getCell(r, COL).alignment = { horizontal: "right" };
      ws.getCell(r, COL).fill      = LIGHT;
      ws.getRow(r).height = 22;
      r += 2;

      // ── SIGNATURES ──────────────────────────────────────────
      ws.mergeCells(r, 1, r, 3);   ws.getCell(r, 1).value   = "Người lập hóa đơn";
      ws.mergeCells(r, 5, r, 7);   ws.getCell(r, 5).value   = "Người duyệt";
      ws.mergeCells(r, 9, r, COL); ws.getCell(r, 9).value   = "Người mua hàng";
      [1, 5, 9].forEach(c => {
        ws.getCell(r, c).font      = { bold: true, size: 9 };
        ws.getCell(r, c).alignment = { horizontal: "center" };
      });
      ws.getRow(r).height = 16;
      r++;

      ws.mergeCells(r, 1, r, 3);   ws.getCell(r, 1).value   = "(Ký, ghi rõ họ tên)";
      ws.mergeCells(r, 5, r, 7);   ws.getCell(r, 5).value   = "(Ký, ghi rõ họ tên)";
      ws.mergeCells(r, 9, r, COL); ws.getCell(r, 9).value   = "(Ký, ghi rõ họ tên)";
      [1, 5, 9].forEach(c => {
        ws.getCell(r, c).font      = { italic: true, size: 8, color: { argb: "FF9CA3AF" } };
        ws.getCell(r, c).alignment = { horizontal: "center" };
      });
      r += 4; // space for signature

      ws.mergeCells(r, 1, r, 3);   ws.getCell(r, 1).value   = invoice.creator?.full_name || "—";
      ws.mergeCells(r, 5, r, 7);   ws.getCell(r, 5).value   = invoice.approver?.full_name || "";
      ws.mergeCells(r, 9, r, COL); ws.getCell(r, 9).value   = customer?.name || "";
      [1, 5, 9].forEach(c => {
        ws.getCell(r, c).font      = { bold: true, size: 9 };
        ws.getCell(r, c).alignment = { horizontal: "center" };
      });

      // ── WRITE ────────────────────────────────────────────────
      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
             `${invoice.invoice_no}.xlsx`);

    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Lỗi xuất Excel. Vui lòng thử lại.");
    } finally {
      setExporting(null);
    }
  };

  return { exporting, exportToPDF, exportToExcel, printInvoice, buildPDFBlob };
};
