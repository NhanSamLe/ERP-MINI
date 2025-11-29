import { Op } from "sequelize";
import * as model from "../../../models/index";

export type PayrollRunStatus = "draft" | "posted";

export interface PayrollRunFilter {
  period_id?: number;
  status?: PayrollRunStatus | "all";
}

export interface PayrollRunPayload {
  period_id: number;
  run_no: string;
}

export interface PayrollRunLinePayload {
  run_id: number;
  employee_id: number;
  amount: number;
}

// ========== RUN LIST ==========

export async function getAllPayrollRuns(filter: PayrollRunFilter = {}) {
  const where: any = {};

  if (typeof filter.period_id === "number") {
    where.period_id = filter.period_id;
  }

  if (filter.status && filter.status !== "all") {
    where.status = filter.status;
  }

  const rows = await model.PayrollRun.findAll({
    where,
    order: [["created_at", "DESC"]],
    include: [
      {
        model: model.PayrollPeriod,
        as: "period",
        include: [
          {
            model: model.Branch,
            as: "branch",
            attributes: ["id", "code", "name"],
          },
        ],
      },
    ],
  });

  return rows;
}

// ========== RUN DETAIL ==========

export async function getPayrollRunById(id: number) {
  const row = await model.PayrollRun.findByPk(id, {
    include: [
      {
        model: model.PayrollPeriod,
        as: "period",
        include: [
          {
            model: model.Branch,
            as: "branch",
            attributes: ["id", "code", "name"],
          },
        ],
      },
      {
        model: model.PayrollRunLine,
        as: "lines",
        include: [
          {
            model: model.Employee,
            as: "employee",
          },
        ],
      },
    ],
  });

  if (!row) throw new Error("Payroll run not found");
  return row;
}

// ========== CREATE / CANCEL / POST RUN ==========

export async function createPayrollRun(payload: PayrollRunPayload) {
  const { period_id, run_no } = payload;

  if (!period_id || !run_no) {
    throw new Error("period_id và run_no là bắt buộc");
  }

  const period = await model.PayrollPeriod.findByPk(period_id);
  if (!period) throw new Error("Payroll period not found");
  if ((period as any).status === "closed") {
    throw new Error("Không thể lập bảng lương cho kỳ đã đóng");
  }

  // không cho trùng run_no trong cùng period
  const exists = await model.PayrollRun.findOne({
    where: { period_id, run_no },
  });
  if (exists) {
    throw new Error("Mã bảng lương đã tồn tại trong kỳ này");
  }

  const row = await model.PayrollRun.create({
    period_id,
    run_no,
  });

  return row;
}

export async function cancelPayrollRun(id: number) {
  const row = await model.PayrollRun.findByPk(id);
  if (!row) throw new Error("Payroll run not found");

  if ((row as any).status === "posted") {
    throw new Error("Không thể hủy bảng lương đã post");
  }

  await row.destroy();
}

export async function postPayrollRun(id: number) {
  const row = await model.PayrollRun.findByPk(id, {
    include: [{ model: model.PayrollRunLine, as: "lines" }],
  });
  if (!row) throw new Error("Payroll run not found");

  const status = (row as any).status as PayrollRunStatus;
  if (status === "posted") {
    throw new Error("Bảng lương đã được post");
  }

  const lines = (row as any).lines as any[] | undefined;
  if (!lines || lines.length === 0) {
    throw new Error("Không thể post bảng lương chưa có dòng lương");
  }

  // TODO: sau này thêm logic ghi vào sổ cái
  (row as any).status = "posted";
  await row.save();
  return row;
}

// ========== LINES ==========

export async function createPayrollRunLine(payload: PayrollRunLinePayload) {
  const { run_id, employee_id, amount } = payload;

  if (!run_id || !employee_id) {
    throw new Error("run_id và employee_id là bắt buộc");
  }

  const run = await model.PayrollRun.findByPk(run_id);
  if (!run) throw new Error("Payroll run not found");
  if ((run as any).status === "posted") {
    throw new Error("Không thể thêm dòng cho bảng lương đã post");
  }

  const employee = await model.Employee.findByPk(employee_id);
  if (!employee) throw new Error("Employee not found");

  // mỗi run + employee chỉ có 1 dòng
  const exists = await model.PayrollRunLine.findOne({
    where: { run_id, employee_id },
  });
  if (exists) {
    throw new Error(
      "Nhân viên này đã có dòng lương trong bảng, hãy cập nhật thay vì tạo mới"
    );
  }

  const line = await model.PayrollRunLine.create({
    run_id,
    employee_id,
    amount,
  });

  return line;
}

export async function updatePayrollRunLine(
  id: number,
  payload: Partial<PayrollRunLinePayload>
) {
  const line = await model.PayrollRunLine.findByPk(id, {
    include: [{ model: model.PayrollRun, as: "run" }],
  });
  if (!line) throw new Error("Payroll line not found");

  const run = (line as any).run;
  if (run && run.status === "posted") {
    throw new Error("Không thể sửa dòng lương của bảng đã post");
  }

  if (payload.amount !== undefined) {
    (line as any).amount = payload.amount;
  }
  if (payload.employee_id) {
    (line as any).employee_id = payload.employee_id;
  }

  await line.save();
  return line;
}

export async function deletePayrollRunLine(id: number) {
  const line = await model.PayrollRunLine.findByPk(id, {
    include: [{ model: model.PayrollRun, as: "run" }],
  });
  if (!line) throw new Error("Payroll line not found");

  const run = (line as any).run;
  if (run && run.status === "posted") {
    throw new Error("Không thể xóa dòng lương của bảng đã post");
  }

  await line.destroy();
}

// ========== PAYSLIP EMPLOYEE ==========

export async function getPayslipsForEmployee(employeeId: number) {
  const rows = await model.PayrollRunLine.findAll({
    where: { employee_id: employeeId },
    include: [
      {
        model: model.PayrollRun,
        as: "run",
        include: [
          {
            model: model.PayrollPeriod,
            as: "period",
          },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return rows;
}

export async function getPayslipForEmployeeInRun(
  runId: number,
  employeeId: number
) {
  const row = await model.PayrollRunLine.findOne({
    where: { run_id: runId, employee_id: employeeId },
    include: [
      {
        model: model.PayrollRun,
        as: "run",
        include: [
          {
            model: model.PayrollPeriod,
            as: "period",
          },
        ],
      },
    ],
  });

  if (!row) throw new Error("Payslip not found");
  return row;
}
