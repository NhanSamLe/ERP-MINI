import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ExcelReportOptions } from "./types";

export async function exportExcelReport<T extends object>(
  options: ExcelReportOptions<T>
) {
  const { title, subtitle, meta, columns, data, fileName, companyInfo, footer } = options;

  const info = companyInfo || {
    name: "CÔNG TY TNHH MTV ERP MINI",
    address: "01 Võ Văn Ngân, Linh Chiểu, Thủ Đức, TP.HCM",
    taxId: "0312345678",
    phone: "0909 123 456",
    email: "contact@erpmini.vn",
  };

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Report", {
    views: [{ state: "frozen", ySplit: 8 }], // Freeze after header
  });

  let rowIndex = 1;

  // ===== 1. COMPANY INFO (Left) =====
  sheet.mergeCells(rowIndex, 1, rowIndex, 4);
  const companyNameRow = sheet.getCell(rowIndex, 1);
  companyNameRow.value = info.name.toUpperCase();
  companyNameRow.font = { bold: true, size: 12 };
  rowIndex++;

  sheet.mergeCells(rowIndex, 1, rowIndex, 4);
  sheet.getCell(rowIndex, 1).value = `Đ/c: ${info.address}`;
  rowIndex++;

  sheet.mergeCells(rowIndex, 1, rowIndex, 4);
  sheet.getCell(rowIndex, 1).value = `MST: ${info.taxId} - SĐT: ${info.phone}`;
  rowIndex += 2; // Space

  // ===== 2. REPORT TITLE (Center) =====
  const titleRow = sheet.addRow([title.toUpperCase()]);
  sheet.mergeCells(rowIndex, 1, rowIndex, columns.length);
  titleRow.getCell(1).font = { bold: true, size: 16 };
  titleRow.getCell(1).alignment = { horizontal: "center" };
  rowIndex++;

  if (subtitle) {
    const subRow = sheet.addRow([subtitle]);
    sheet.mergeCells(rowIndex, 1, rowIndex, columns.length);
    subRow.getCell(1).font = { italic: true, size: 11 };
    subRow.getCell(1).alignment = { horizontal: "center" };
    rowIndex++;
  }

  // Current Date
  const now = new Date();
  const dateStr = `Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  const dateRow = sheet.addRow([dateStr]);
  sheet.mergeCells(rowIndex, 1, rowIndex, columns.length);
  dateRow.getCell(1).alignment = { horizontal: "right" };
  dateRow.getCell(1).font = { italic: true };
  rowIndex += 2;

  // ===== Meta Info =====
  if (meta) {
    Object.entries(meta).forEach(([k, v]) => {
      const r = sheet.addRow([`${k}: ${v}`]);
      sheet.mergeCells(rowIndex, 1, rowIndex, 3);
      r.getCell(1).font = { bold: true };
      rowIndex++;
    });
    rowIndex++;
  }

  // ===== 3. TABLE HEADER =====
  const headerRow = sheet.addRow(columns.map((c) => c.header));
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F2937" }, // Gray-800
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
  rowIndex++;

  // ===== DATA =====
  data.forEach((item) => {
    const row = sheet.addRow(
      columns.map((c) => {
        const rawValue = item[c.key];
        return c.formatter
          ? c.formatter(rawValue, item)
          : rawValue ?? "";
      })
    );
    rowIndex++;

    row.eachCell((cell, colNumber) => {
      const col = columns[colNumber - 1]; // 1-based index
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = {
        horizontal: col.align ?? "left",
        vertical: "middle",
        wrapText: true,
      };

      if (col.format === "currency") {
        cell.numFmt = '#,##0" ₫"';
      }
    });
  });

  // ===== 4. FOOTER (Signatures) =====
  rowIndex += 2;
  // Date in footer
  // sheet.mergeCells(rowIndex, columns.length - 2, rowIndex, columns.length);
  // sheet.getCell(rowIndex, columns.length - 2).value = dateStr;
  // sheet.getCell(rowIndex, columns.length - 2).alignment = { horizontal: "center" };
  // sheet.getCell(rowIndex, columns.length - 2).font = { italic: true };
  // rowIndex++;

  // Signature Titles
  sheet.addRow([]);
  // Simple layout: Creator (Left), Accountant (Center), Approver (Right)
  // Depends on column count. Assume at least 3 cols.

  if (columns.length >= 3) {
    const leftCol = 1;
    const rightCol = columns.length;
    const centerCol = Math.floor(columns.length / 2) + 1;

    sheet.getCell(rowIndex, leftCol).value = "Người lập phiếu";
    sheet.getCell(rowIndex, leftCol).font = { bold: true };
    sheet.getCell(rowIndex, leftCol).alignment = { horizontal: "center" };

    if (columns.length > 3) {
      sheet.getCell(rowIndex, centerCol).value = "Kế toán trưởng";
      sheet.getCell(rowIndex, centerCol).font = { bold: true };
      sheet.getCell(rowIndex, centerCol).alignment = { horizontal: "center" };
    }

    sheet.getCell(rowIndex, rightCol).value = "Thủ trưởng đơn vị";
    sheet.getCell(rowIndex, rightCol).font = { bold: true };
    sheet.getCell(rowIndex, rightCol).alignment = { horizontal: "center" };

    rowIndex++;

    // Signatures
    sheet.getCell(rowIndex, leftCol).value = "(Ký, họ tên)";
    sheet.getCell(rowIndex, leftCol).font = { italic: true };
    sheet.getCell(rowIndex, leftCol).alignment = { horizontal: "center" };

    if (columns.length > 3) {
      sheet.getCell(rowIndex, centerCol).value = "(Ký, họ tên)";
      sheet.getCell(rowIndex, centerCol).font = { italic: true };
      sheet.getCell(rowIndex, centerCol).alignment = { horizontal: "center" };
    }

    sheet.getCell(rowIndex, rightCol).value = "(Ký, họ tên, đóng dấu)";
    sheet.getCell(rowIndex, rightCol).font = { italic: true };
    sheet.getCell(rowIndex, rightCol).alignment = { horizontal: "center" };

    rowIndex += 5; // Space for signature

    // Names
    if (footer?.creator) {
      sheet.getCell(rowIndex, leftCol).value = footer.creator;
      sheet.getCell(rowIndex, leftCol).font = { bold: true };
      sheet.getCell(rowIndex, leftCol).alignment = { horizontal: "center" };
    }
    if (footer?.approver) {
      sheet.getCell(rowIndex, rightCol).value = footer.approver;
      sheet.getCell(rowIndex, rightCol).font = { bold: true };
      sheet.getCell(rowIndex, rightCol).alignment = { horizontal: "center" };
    }
  }

  // ===== SET COLUMN WIDTH =====
  columns.forEach((c, i) => {
    sheet.getColumn(i + 1).width = c.width ?? 20;
  });

  // ===== EXPORT =====
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName);
}
