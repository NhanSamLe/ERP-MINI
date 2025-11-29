import { Op } from "sequelize";
import { PayrollPeriod } from "../models/payrollPeriod.model";

export type PayrollPeriodStatus = "open" | "processed" | "closed";

export interface PayrollPeriodFilter {
  branch_id?: number | undefined;
  status?: PayrollPeriodStatus | "all" | undefined;
  search?: string | undefined;
}

export interface PayrollPeriodPayload {
  branch_id: number;
  period_code: string;
  start_date: Date | string;
  end_date: Date | string;
  status?: PayrollPeriodStatus;
}

export async function getAllPayrollPeriods(filter: PayrollPeriodFilter = {}) {
  const where: any = {};

  if (filter.branch_id) {
    where.branch_id = filter.branch_id;
  }

  if (filter.status && filter.status !== "all") {
    where.status = filter.status;
  }

  if (filter.search) {
    where.period_code = { [Op.like]: `%${filter.search}%` };
  }

  const rows = await PayrollPeriod.findAll({
    where,
    order: [["start_date", "DESC"]],
  });

  return rows;
}

export async function getPayrollPeriodById(id: number) {
  const row = await PayrollPeriod.findByPk(id);
  if (!row) {
    throw new Error("Payroll period not found");
  }
  return row;
}

export async function createPayrollPeriod(payload: PayrollPeriodPayload) {
  const { branch_id, period_code, start_date, end_date, status } = payload;

  if (!branch_id || !period_code || !start_date || !end_date) {
    throw new Error("branch_id, period_code, start_date, end_date are required");
  }

  const start = new Date(start_date);
  const end = new Date(end_date);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid start_date or end_date");
  }

  if (end < start) {
    throw new Error("end_date must be greater than or equal to start_date");
  }

  const exists = await PayrollPeriod.findOne({
    where: { branch_id, period_code },
  });

  if (exists) {
    throw new Error("Period code already exists for this branch");
  }

  const row = await PayrollPeriod.create({
    branch_id,
    period_code,
    start_date: start,
    end_date: end,
    status: status ?? "open", // 👈 default open nếu không gửi
  });

  return row;
}


export async function updatePayrollPeriod(
  id: number,
  payload: Partial<PayrollPeriodPayload>
) {
  const row = await PayrollPeriod.findByPk(id);
  if (!row) {
    throw new Error("Payroll period not found");
  }

  if (row.status === "closed") {
    throw new Error("Closed payroll period cannot be updated");
  }

  if (payload.period_code) {
    const exists = await PayrollPeriod.findOne({
      where: {
        branch_id: row.branch_id,
        period_code: payload.period_code,
        id: { [Op.ne]: id },
      },
    });
    if (exists) {
      throw new Error("Period code already exists for this branch");
    }
    row.period_code = payload.period_code;
  }

  if (payload.start_date) {
    const start = new Date(payload.start_date);
    if (isNaN(start.getTime())) throw new Error("Invalid start_date");
    row.start_date = start;
  }

  if (payload.end_date) {
    const end = new Date(payload.end_date);
    if (isNaN(end.getTime())) throw new Error("Invalid end_date");
    row.end_date = end;
  }

  if (row.end_date < row.start_date) {
    throw new Error("end_date must be greater than or equal to start_date");
  }

  if (payload.status) {
    row.status = payload.status; // cho phép đổi open/closed/processed
  }

  await row.save();
  return row;
}


export async function closePayrollPeriod(id: number) {
  const row = await PayrollPeriod.findByPk(id);
  if (!row) {
    throw new Error("Payroll period not found");
  }

  if (row.status === "closed") {
    throw new Error("Payroll period is already closed");
  }

  // Tùy bạn muốn check thêm: đã có payroll_run posted chưa, v.v.
  row.status = "closed";
  await row.save();
  return row;
}
export async function deletePayrollPeriod(id: number) {
  const row = await PayrollPeriod.findByPk(id);
  if (!row) {
    throw new Error("Payroll period not found");
  }

  // nếu muốn check ràng buộc có payroll_run thì thêm logic ở đây
  await row.destroy();
}
