import { Request, Response } from "express";
import * as payrollRunService from "../services/payrollRun.service";
import * as model from "../../../models/index";
import { calculatePayrollRun } from "../services/payrollRun.service";
import { generatePayslipPdf, generatePayrollRunPdf } from "../services/payrollPdf.service";
import { sendEmail2 } from "../../../core/utils/email";

export const getPayrollRuns = async (req: Request, res: Response) => {
  try {
    const { period_id, status } = req.query;

    const filter: payrollRunService.PayrollRunFilter = {};

    if (typeof period_id === "string") {
      filter.period_id = Number(period_id);
    }
    if (typeof status === "string") {
      filter.status = status as any;
    }

    const user = (req as any).user;
    const data = await payrollRunService.getAllPayrollRuns(filter, user?.branch_id);
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getPayrollRunDetail = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const row = await payrollRunService.getPayrollRunById(id);
    return res.json(row);
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
};

export const createPayrollRun = async (req: Request, res: Response) => {
  try {
    const row = await payrollRunService.createPayrollRun(req.body);
    return res.status(201).json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const cancelPayrollRun = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await payrollRunService.cancelPayrollRun(id);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const postPayrollRun = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const row = await payrollRunService.postPayrollRun(id);
    return res.json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

// ====== LINES ======

export const createPayrollRunLine = async (req: Request, res: Response) => {
  try {
    const run_id = Number(req.params.id);
    const payload = { ...req.body, run_id };
    const line = await payrollRunService.createPayrollRunLine(payload);
    return res.status(201).json(line);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const updatePayrollRunLine = async (req: Request, res: Response) => {
  try {
    const lineId = Number(req.params.lineId);
    const line = await payrollRunService.updatePayrollRunLine(
      lineId,
      req.body
    );
    return res.json(line);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const deletePayrollRunLine = async (req: Request, res: Response) => {
  try {
    const lineId = Number(req.params.lineId);
    await payrollRunService.deletePayrollRunLine(lineId);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

// ====== PAYSLIP EMPLOYEE ======

export const getMyPayslips = async (req: Request, res: Response) => {
  try {
    const userJwt = (req as any).user;
    if (!userJwt) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await model.User.findByPk(userJwt.id);
    if (!user || !(user as any).employee_id) {
      return res
        .status(400)
        .json({ message: "User chưa được liên kết với Employee" });
    }

    const data = await payrollRunService.getPayslipsForEmployee(
      (user as any).employee_id
    );
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getMyPayslipInRun = async (req: Request, res: Response) => {
  try {
    const userJwt = (req as any).user;
    if (!userJwt) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await model.User.findByPk(userJwt.id);
    if (!user || !(user as any).employee_id) {
      return res
        .status(400)
        .json({ message: "User chưa được liên kết với Employee" });
    }

    const runId = Number(req.params.id);

    const row = await payrollRunService.getPayslipForEmployeeInRun(
      runId,
      (user as any).employee_id
    );
    return res.json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
export const calculateRun = async (req: Request, res: Response) => {
  try {
    const runId = Number(req.params.id);
    const user = (req as any).user;

    const data = await calculatePayrollRun(runId, user);
    return res.json({ message: "Calculated successfully", data });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
export const getPayrollEvidence = async (req: Request, res: Response) => {
  try {
    const runId = Number(req.params.runId);
    const employeeId = Number(req.params.employeeId);
    const userJwt = (req as any).user;

    const isHrOrAdmin = ["HRMANAGER", "HR_STAFF", "CHACC", "ADMIN", "CEO"].includes(userJwt?.role);
    if (!isHrOrAdmin) {
      const user = await model.User.findByPk(userJwt.id);
      if (!user || (user as any).employee_id !== employeeId) {
        return res.status(403).json({ message: "Bạn không có quyền xem chứng từ của nhân viên này." });
      }
    }

    const data = await payrollRunService.getPayrollEvidence(runId, employeeId);
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const submitPayrollRun = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const row = await payrollRunService.submitForApproval(id, user, req.app);
    return res.json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const approvePayrollRun = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const row = await payrollRunService.approvePayrollRun(id, user, req.app);
    return res.json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const rejectPayrollRun = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;
    const user = (req as any).user;
    const row = await payrollRunService.rejectPayrollRun(id, reason, user, req.app);
    return res.json(row);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getPayslipPdf = async (req: Request, res: Response) => {
  try {
    const runLineId = Number(req.params.id);
    const userJwt = (req as any).user;

    const line = await model.PayrollRunLine.findByPk(runLineId);
    if (!line) {
      return res.status(404).json({ message: "Không tìm thấy dòng bảng lương" });
    }

    const isHrOrAdmin = ["HRMANAGER", "HR_STAFF", "CHACC", "ADMIN", "CEO"].includes(userJwt?.role);
    if (!isHrOrAdmin) {
      const user = await model.User.findByPk(userJwt.id);
      if (!user || (user as any).employee_id !== line.employee_id) {
        return res.status(403).json({ message: "Bạn không có quyền xem phiếu lương này." });
      }
    }

    const pdfBuffer = await generatePayslipPdf(runLineId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=payslip-${runLineId}.pdf`);
    return res.end(pdfBuffer);
  } catch (err: any) {
    console.error("Error generating payslip PDF:", err);
    return res.status(400).json({ message: err.message || "Không thể tạo file PDF" });
  }
};

export const sendPayslipsEmail = async (req: Request, res: Response) => {
  try {
    const runId = Number(req.params.id);
    const run = await model.PayrollRun.findByPk(runId, {
      include: [{ model: model.PayrollPeriod, as: "period" }]
    });
    if (!run) {
      return res.status(404).json({ message: "Không tìm thấy kỳ lương" });
    }

    const lines = await model.PayrollRunLine.findAll({
      where: { run_id: runId },
      include: [
        {
          model: model.Employee,
          as: "employee",
          include: [{ model: model.User, as: "user" }]
        }
      ]
    });

    let sentCount = 0;
    for (const line of lines) {
      const emp = (line as any).employee;
      const email = emp?.email || emp?.user?.email;
      if (!email) {
        console.warn(`Employee ${emp?.full_name} has no email, skipping.`);
        continue;
      }

      const pdfBuffer = await generatePayslipPdf(line.id);
      const periodCode = (run as any).period?.period_code || "";
      const subject = `[ERP Mini] Phieu thanh toan luong ky ${periodCode} - ${emp.full_name}`;
      const text = `Kính gửi ${emp.full_name},\n\nHệ thống xin gửi bạn phiếu thanh toán lương chi tiết cho kỳ lương ${periodCode}.\nChi tiết vui lòng xem trong file PDF đính kèm.\n\nTrân trọng,\nBan Nhân sự.`;

      await sendEmail2(
        email,
        subject,
        text,
        undefined, // html
        null, // cc
        null, // bcc
        [
          {
            filename: `payslip-${periodCode}-${emp.emp_code}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf"
          }
        ]
      );
      sentCount++;
    }

    return res.json({ success: true, count: sentCount, message: `Đã gửi thành công ${sentCount} email phiếu lương cho nhân viên.` });
  } catch (err: any) {
    console.error("Error sending payslip emails:", err);
    return res.status(400).json({ message: err.message || "Không thể gửi email phiếu lương" });
  }
};

export const getPayrollRunPdf = async (req: Request, res: Response) => {
  try {
    const runId = Number(req.params.id);
    const branchId = req.query.branch_id ? Number(req.query.branch_id) : undefined;
    const departmentId = req.query.department_id ? Number(req.query.department_id) : undefined;

    const pdfBuffer = await generatePayrollRunPdf(runId, branchId, departmentId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=payroll-run-${runId}-combined.pdf`);
    return res.send(pdfBuffer);
  } catch (err: any) {
    console.error("Error generating payroll run PDF:", err);
    return res.status(400).json({ message: err.message || "Không thể xuất PDF bảng lương" });
  }
};
