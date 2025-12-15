import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ExcelReportOptions } from "./types";

export async function exportExcelReport<T extends object>(
  options: ExcelReportOptions<T>
) {
  const { title, subtitle, meta, columns, data, fileName } = options;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Report", {
    views: [{ state: "frozen", ySplit: 6 }],
  });

  let rowIndex = 1;

  // ===== TITLE =====
  const titleRow = sheet.addRow([title]);
  sheet.mergeCells(rowIndex, 1, rowIndex, columns.length);
  titleRow.font = { bold: true, size: 16 };
  titleRow.alignment = { horizontal: "center" };
  rowIndex += 2;

  // ===== SUBTITLE =====
  if (subtitle) {
    const subRow = sheet.addRow([subtitle]);
    sheet.mergeCells(rowIndex, 1, rowIndex, columns.length);
    subRow.font = { italic: true, size: 11 };
    subRow.alignment = { horizontal: "center" };
    rowIndex += 2;
  }

  // ===== META INFO =====
  if (meta) {
    Object.entries(meta).forEach(([k, v]) => {
      const r = sheet.addRow([k, v]);
      r.getCell(1).font = { bold: true };
      rowIndex++;
    });
    rowIndex++;
  }

  // ===== HEADER =====
  const headerRow = sheet.addRow(columns.map((c) => c.header));
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: "center" };

  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };
  });

  // ===== SET COLUMN WIDTH =====
  columns.forEach((c, i) => {
    sheet.getColumn(i + 1).width = c.width ?? 20;
  });

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

  row.eachCell((cell, colNumber) => {
    const col = columns[colNumber - 1];

    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    cell.alignment = {
      horizontal: col.align ?? "left",
      vertical: "middle",
    };

    if (col.format === "currency") {
      cell.numFmt = '#,##0" ₫"';
    }
  });
});


  // ===== EXPORT =====
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName);
}
