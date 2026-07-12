import PDFDocument from "pdfkit";
import fs from "fs";
import * as model from "../../../models";
import { getPayrollEvidence } from "./payrollRun.service";
import { Op } from "sequelize";

function removeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function drawPayslipOnDoc(
  doc: any,
  line: any,
  emp: any,
  period: any,
  presentDays: number,
  absentDays: number,
  leaveDays: number,
  lateDays: number,
  useArial: boolean,
  txt: (str: string) => string,
  fName: (type: "regular" | "bold" | "oblique") => string
) {
  // Lấy chi nhánh của nhân viên
  const branch = emp?.branch;
  const branchName = branch?.name || "CONG TY CO PHAN TAP DOAN ERP MINI";
  const branchAddress = branch?.address ? `Địa chỉ: ${branch.address}` : "Địa chỉ: Đường số 2, Quận 7, Thành phố Hồ Chí Minh";
  const branchPhone = branch?.phone ? `Email: support@erp-mini.local | Hotline: ${branch.phone}` : "Email: support@erp-mini.local | Phone: 0900000001";

  // --- Header / Company Info ---
  doc.fillColor("#1e293b").fontSize(15).font(fName("bold")).text(txt(branchName), 50, 50);
  doc.fontSize(9).font(fName("regular")).text(txt(branchAddress), 50, 72);
  doc.text(txt(branchPhone), 50, 87);
  
  // Draw horizontal line
  doc.moveTo(50, 105).lineTo(545, 105).strokeColor("#cbd5e1").lineWidth(1).stroke();

  // --- Title ---
  doc.fontSize(15).fillColor("#0f172a").font(fName("bold")).text(txt("PHIẾU THANH TOÁN LƯƠNG (PAYSLIP)"), 50, 125, { align: "center" });
  doc.fontSize(10).font(fName("oblique")).text(txt(`Kỳ lương: ${period.period_code} (Từ ${new Date(period.start_date).toLocaleDateString("vi-VN")} đến ${new Date(period.end_date).toLocaleDateString("vi-VN")})`), 50, 145, { align: "center" });

  // --- Employee Info Box ---
  doc.moveTo(50, 175).lineTo(545, 175).lineTo(545, 270).lineTo(50, 270).closePath().fillColor("#f8fafc").fill();
  
  doc.fillColor("#0f172a").fontSize(9).font(fName("bold")).text(txt("THÔNG TIN NHÂN VIÊN (EMPLOYEE INFO)"), 65, 185);
  
  doc.font(fName("regular")).text(txt(`Mã nhân viên (Code): ${emp.emp_code || ""}`), 65, 205);
  doc.text(txt(`Họ và tên (Name): ${emp.full_name || ""}`), 65, 220);
  doc.text(txt(`Loại hợp đồng (Contract): ${emp.contract_type === "official" ? "Chính thức (Official)" : "Thử việc (Probation)"}`), 65, 235);
  
  doc.text(txt(`Bộ phận (Dept): ${emp.department?.name || "N/A"}`), 310, 205);
  doc.text(txt(`Chức vụ (Pos): ${emp.position?.name || "N/A"}`), 310, 220);
  doc.text(txt(`Người phụ thuộc (Dependents): ${emp.dependent || 0}`), 310, 235);

  // --- Workdays / Attendance info ---
  doc.font(fName("bold")).text(txt("CÔNG XÁC MINH (ATTENDANCE SUMMARY)"), 50, 290);
  doc.font(fName("regular"));
  doc.text(txt(`Có mặt (Present): ${presentDays} ngày`), 50, 310);
  doc.text(txt(`Nghỉ phép (Leave): ${leaveDays} ngày`), 180, 310);
  doc.text(txt(`Vắng mặt (Absent): ${absentDays} ngày`), 310, 310);
  doc.text(txt(`Đi muộn (Late): ${lateDays} lần`), 440, 310);

  // --- Table Headers ---
  const startY = 345;
  doc.moveTo(50, startY).lineTo(545, startY).strokeColor("#94a3b8").lineWidth(1.5).stroke();
  
  doc.font(fName("bold")).fillColor("#334155");
  doc.text(txt("KHOẢN MỤC (DESCRIPTION)"), 60, startY + 8);
  doc.text(txt("SỐ TIỀN (AMOUNT in VND)"), 380, startY + 8, { align: "right", width: 150 });
  
  doc.moveTo(50, startY + 28).lineTo(545, startY + 28).strokeColor("#cbd5e1").lineWidth(1).stroke();

  // --- Table Content ---
  const formatVND = (num: number) => Number(num || 0).toLocaleString("vi-VN") + " VND";
  
  // Read from line columns
  const grossVal = Number(line.gross_amount || 0);
  const totalDeductionVal = Number(line.total_deduction || 0);
  const netVal = Number(line.net_amount || line.amount || 0);
  const pitVal = Number(line.pit_amount || 0);
  const lateFineVal = lateDays * (grossVal > 0 ? 40000 : 0);
  const insuranceDeduction = totalDeductionVal - pitVal; 

  const finalItems = [
    { label: "1. Lương cơ bản (Base Salary)", val: Number(line.base_salary || 0) },
    { label: "2. Lương theo ngày công thực tế (Actual Work Salary)", val: Math.round(Number(line.gross_amount || 0) - (presentDays + lateDays) * 30000) },
    { label: "3. Phụ cấp cơm trưa (Meal Allowance)", val: (presentDays + lateDays) * 30000 },
    { label: "4. Lương gross nhận (Gross Earnings)", val: Number(line.gross_amount || 0), isHeader: true },
    { label: "5. Khấu trừ đi muộn (Late Fine)", val: -lateFineVal, isDeduction: true },
    { label: "6. Bảo hiểm xã hội, y tế, thất nghiệp (Insurance 10.5%)", val: -insuranceDeduction, isDeduction: true },
    { label: "7. Thuế thu nhập cá nhân (PIT)", val: -pitVal, isDeduction: true },
    { label: "8. Tổng khấu trừ (Total Deduction)", val: -totalDeductionVal, isHeader: true }
  ];

  let currentY = startY + 35;
  for (const item of finalItems) {
    if (item.isHeader) {
      doc.font(fName("bold")).fillColor("#1e293b");
    } else {
      doc.font(fName("regular")).fillColor("#475569");
    }
    doc.text(txt(item.label), 60, currentY);
    doc.text(formatVND(item.val), 380, currentY, { align: "right", width: 150 });
    currentY += 22;
  }

  // --- Net Salary Row ---
  doc.moveTo(50, currentY + 5).lineTo(545, currentY + 5).strokeColor("#94a3b8").lineWidth(1.5).stroke();
  currentY += 15;
  doc.font(fName("bold")).fontSize(12).fillColor("#ea580c");
  doc.text(txt("THỰC NHẬN (NET SALARY):"), 60, currentY);
  doc.text(formatVND(netVal), 340, currentY, { align: "right", width: 190 });

  doc.moveTo(50, currentY + 22).lineTo(545, currentY + 22).strokeColor("#94a3b8").lineWidth(1.5).stroke();

  // --- Signatures ---
  currentY += 45;
  doc.font(fName("oblique")).fontSize(9).fillColor("#64748b");
  doc.text(txt("Người lập biểu\n(Prepared by)"), 70, currentY, { align: "center", width: 120 });
  doc.text(txt("Người nhận lương\n(Employee signature)"), 240, currentY, { align: "center", width: 120 });
  doc.text(txt("Giám đốc ký duyệt\n(Approved by CEO)"), 410, currentY, { align: "center", width: 120 });
}

/**
 * Sinh Buffer PDF cho phiếu lương của 1 nhân viên trong kỳ lương
 */
export async function generatePayslipPdf(runLineId: number): Promise<Buffer> {
  const line = await model.PayrollRunLine.findByPk(runLineId, {
    include: [
      {
        model: model.Employee,
        as: "employee",
        include: [
          { model: model.Department, as: "department", attributes: ["name"] },
          { model: model.Position, as: "position", attributes: ["name"] },
          { model: model.Branch, as: "branch" },
        ],
      },
      {
        model: model.PayrollRun,
        as: "run",
        include: [{ model: model.PayrollPeriod, as: "period" }],
      },
    ],
  });

  if (!line) {
    throw new Error("Không tìm thấy dòng bảng lương");
  }

  const emp = (line as any).employee;
  const run = (line as any).run;
  const period = run?.period;

  if (!emp || !run || !period) {
    throw new Error("Dữ liệu bảng lương không đầy đủ");
  }

  let presentDays = line.present_days || 0;
  let absentDays = line.absent_days || 0;
  let leaveDays = line.leave_days || 0;
  let lateDays = line.late_days || 0;

  try {
    const evidence = await getPayrollEvidence(line.run_id, line.employee_id);
    presentDays = evidence.summary.presentDays;
    absentDays = evidence.summary.absentDays;
    leaveDays = evidence.summary.leaveDays;
    lateDays = evidence.summary.lateDays;
  } catch (err) {
    console.error("Error getting evidence for PDF:", err);
  }

  let useArial = false;
  const fontDir = "C:/Windows/Fonts";
  const fonts = {
    regular: `${fontDir}/arial.ttf`,
    bold: `${fontDir}/arialbd.ttf`,
    oblique: `${fontDir}/ariali.ttf`
  };

  if (fs.existsSync(fonts.regular) && fs.existsSync(fonts.bold) && fs.existsSync(fonts.oblique)) {
    useArial = true;
  }

  const txt = (str: string): string => {
    return useArial ? str : removeAccents(str);
  };

  const fName = (type: "regular" | "bold" | "oblique"): string => {
    if (useArial) {
      if (type === "bold") return "Arial-Bold";
      if (type === "oblique") return "Arial-Oblique";
      return "Arial";
    } else {
      if (type === "bold") return "Helvetica-Bold";
      if (type === "oblique") return "Helvetica-Oblique";
      return "Helvetica";
    }
  };

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: any) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err: any) => reject(err));

    if (useArial) {
      doc.registerFont("Arial", fonts.regular);
      doc.registerFont("Arial-Bold", fonts.bold);
      doc.registerFont("Arial-Oblique", fonts.oblique);
    }

    drawPayslipOnDoc(doc, line, emp, period, presentDays, absentDays, leaveDays, lateDays, useArial, txt, fName);

    doc.end();
  });
}

/**
 * Sinh Buffer PDF gộp phiếu lương của TẤT CẢ nhân viên trong lượt chạy lương (có hỗ trợ lọc chi nhánh/phòng ban)
 */
export async function generatePayrollRunPdf(
  runId: number,
  branchId?: number,
  departmentId?: number
): Promise<Buffer> {
  const employeeWhere: any = {};
  if (branchId) {
    employeeWhere.branch_id = branchId;
  }
  if (departmentId) {
    employeeWhere.department_id = departmentId;
  }

  const lines = await model.PayrollRunLine.findAll({
    where: { run_id: runId },
    include: [
      {
        model: model.Employee,
        as: "employee",
        where: Object.keys(employeeWhere).length > 0 ? employeeWhere : undefined,
        include: [
          { model: model.Department, as: "department", attributes: ["name"] },
          { model: model.Position, as: "position", attributes: ["name"] },
          { model: model.Branch, as: "branch" },
        ],
      },
      {
        model: model.PayrollRun,
        as: "run",
        include: [{ model: model.PayrollPeriod, as: "period" }],
      },
    ],
    order: [["id", "ASC"]],
  });

  if (lines.length === 0) {
    throw new Error("Không tìm thấy phiếu lương nào phù hợp với bộ lọc chi nhánh/phòng ban");
  }

  let useArial = false;
  const fontDir = "C:/Windows/Fonts";
  const fonts = {
    regular: `${fontDir}/arial.ttf`,
    bold: `${fontDir}/arialbd.ttf`,
    oblique: `${fontDir}/ariali.ttf`
  };

  if (fs.existsSync(fonts.regular) && fs.existsSync(fonts.bold) && fs.existsSync(fonts.oblique)) {
    useArial = true;
  }

  const txt = (str: string): string => {
    return useArial ? str : removeAccents(str);
  };

  const fName = (type: "regular" | "bold" | "oblique"): string => {
    if (useArial) {
      if (type === "bold") return "Arial-Bold";
      if (type === "oblique") return "Arial-Oblique";
      return "Arial";
    } else {
      if (type === "bold") return "Helvetica-Bold";
      if (type === "oblique") return "Helvetica-Oblique";
      return "Helvetica";
    }
  };

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: any) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err: any) => reject(err));

    if (useArial) {
      doc.registerFont("Arial", fonts.regular);
      doc.registerFont("Arial-Bold", fonts.bold);
      doc.registerFont("Arial-Oblique", fonts.oblique);
    }

    // Lặp qua danh sách nhân viên và sinh từng trang phiếu lương
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        doc.addPage();
      }

      const line = lines[i];
      if (!line) continue;
      const emp = (line as any).employee;
      const run = (line as any).run;
      const period = run?.period;

      let presentDays = line.present_days || 0;
      let absentDays = line.absent_days || 0;
      let leaveDays = line.leave_days || 0;
      let lateDays = line.late_days || 0;

      // Không để lỗi một dòng làm ngắt toàn bộ file PDF gộp
      try {
        drawPayslipOnDoc(doc, line, emp, period, presentDays, absentDays, leaveDays, lateDays, useArial, txt, fName);
      } catch (err) {
        console.error(`Error drawing page for employee ${emp?.full_name}:`, err);
      }
    }

    doc.end();
  });
}
