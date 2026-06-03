import { Op } from "sequelize";
import * as model from "../../../models/index";
import { PAYROLL_RULE } from "../constants/payrollRule";
import dayjs from "dayjs";

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
  return await model.sequelize.transaction(async (t) => {
    const row = await model.PayrollRun.findByPk(id, {
      include: [
        { model: model.PayrollPeriod, as: "period" },
        {
          model: model.PayrollRunLine,
          as: "lines",
          include: [{ model: model.Employee, as: "employee" }],
        },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
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

    const period = (row as any).period;
    if (!period) throw new Error("Payroll period not found");

    // 1. Tự động kiểm tra/tạo các tài khoản tiền lương: 334, 641, 642, 3335
    let acc334 = await model.GlAccount.findOne({ where: { code: "334" }, transaction: t });
    if (!acc334) {
      acc334 = await model.GlAccount.create({
        code: "334",
        name: "Phải trả người lao động",
        type: "liability",
        normal_side: "credit",
      } as any, { transaction: t });
    }

    let acc641 = await model.GlAccount.findOne({ where: { code: "641" }, transaction: t });
    if (!acc641) {
      acc641 = await model.GlAccount.create({
        code: "641",
        name: "Chi phí bán hàng",
        type: "expense",
        normal_side: "debit",
      } as any, { transaction: t });
    }

    let acc642 = await model.GlAccount.findOne({ where: { code: "642" }, transaction: t });
    if (!acc642) {
      acc642 = await model.GlAccount.create({
        code: "642",
        name: "Chi phí quản lý doanh nghiệp",
        type: "expense",
        normal_side: "debit",
      } as any, { transaction: t });
    }

    // 2. Tự động kiểm tra/tạo Nhật ký chung (GENERAL)
    let journal = await model.GlJournal.findOne({ where: { code: "GENERAL" }, transaction: t });
    if (!journal) {
      journal = await model.GlJournal.create({
        code: "GENERAL",
        name: "Nhật ký chung",
      }, { transaction: t });
    }

    // 3. Tính toán tổng lương theo bộ phận để hạch toán chi phí
    let salesSalary = 0; // Chi phí lương bộ phận bán hàng (TK 641)
    let adminSalary = 0; // Chi phí lương bộ phận quản lý (TK 642)
    let totalNet = 0;    // Công nợ phải trả người lao động (TK 334)
    let totalPit = 0;    // Thuế TNCN phải nộp (TK 3335)

    for (const line of lines) {
      const emp = line.employee;
      const gross = Number(line.gross_amount || line.amount || 0);
      const net = Number(line.net_amount || line.amount || 0);
      const pit = Number(line.pit_amount || 0);

      totalNet += net;
      totalPit += pit;

      let deptCode = "";
      if (emp && emp.department_id) {
        const dept = await model.Department.findByPk(emp.department_id, { transaction: t });
        if (dept) {
          deptCode = (dept.code || "").toUpperCase();
        }
      }

      // Phân chia theo mã bộ phận bán hàng hoặc quản lý
      if (deptCode.includes("SALE") || deptCode.includes("KD") || deptCode.includes("BH") || deptCode.includes("SALES")) {
        salesSalary += gross;
      } else {
        adminSalary += gross;
      }
    }

    // Kiểm tra và tạo TK 3335 nếu có thuế TNCN phát sinh
    let acc3335 = null;
    if (totalPit > 0) {
      acc3335 = await model.GlAccount.findOne({ where: { code: "3335" }, transaction: t });
      if (!acc3335) {
        acc3335 = await model.GlAccount.create({
          code: "3335",
          name: "Thuế thu nhập cá nhân phải nộp",
          type: "liability",
          normal_side: "credit",
        } as any, { transaction: t });
      }
    }

    // Cân đối kế toán kép Tổng Nợ = Tổng Có
    const totalDebit = salesSalary + adminSalary;
    const totalCredit = totalNet + totalPit;
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      adminSalary += (totalCredit - totalDebit);
    }

    // 4. Tạo bút toán GL Entry
    const entry = await model.GlEntry.create({
      journal_id: journal.id,
      entry_no: `GL-HRM-PAY-RUN-${row.id}`,
      entry_date: new Date(),
      reference_type: "payroll_run",
      reference_id: row.id,
      memo: `Hạch toán chi phí lương kỳ ${period.period_code} - Bảng lương ${row.run_no}`,
      status: "draft",
      branch_id: period.branch_id,
    } as any, { transaction: t });

    // 5. Tạo các dòng bút toán GL Entry Line
    const entryLines: any[] = [];

    if (salesSalary > 0) {
      entryLines.push({
        entry_id: entry.id,
        account_id: acc641.id,
        debit: salesSalary,
        credit: 0,
      });
    }

    if (adminSalary > 0) {
      entryLines.push({
        entry_id: entry.id,
        account_id: acc642.id,
        debit: adminSalary,
        credit: 0,
      });
    }

    if (totalNet > 0) {
      entryLines.push({
        entry_id: entry.id,
        account_id: acc334.id,
        debit: 0,
        credit: totalNet,
      });
    }

    if (totalPit > 0 && acc3335) {
      entryLines.push({
        entry_id: entry.id,
        account_id: acc3335.id,
        debit: 0,
        credit: totalPit,
      });
    }

    await model.GlEntryLine.bulkCreate(entryLines, { transaction: t });

    // 6. Cập nhật trạng thái bảng lương sang "posted"
    (row as any).status = "posted";
    await row.save({ transaction: t });
    return row;
  });
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

// ========== CALCULATE PAYROLL ==========

export async function calculatePayrollRun(runId: number, user: any) {
  const t = await model.sequelize.transaction();

  try {
    // 1) Load run + period
    const run = await model.PayrollRun.findByPk(runId, {
      include: [{ model: model.PayrollPeriod, as: "period" }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!run) throw new Error("Payroll run not found");
    if ((run as any).status === "posted")
      throw new Error("Run đã post, không thể tính lại");

    const period = (run as any).period;
    if (!period) throw new Error("Payroll period not found");

    // (optional) chặn cross-branch nếu bạn muốn
    // if (user?.branch_id && period.branch_id !== user.branch_id) throw new Error("Cross-branch denied");

    // 2) Lấy nhân viên active hoặc đã nghỉ việc trong kỳ của payroll period
    const employees = await model.Employee.findAll({
      where: {
        branch_id: period.branch_id,
        [Op.or]: [
          { status: "active" },
          {
            status: "resigned",
            resign_date: { [Op.gte]: period.start_date },
          },
        ],
      },
      transaction: t,
    });

    if (!employees.length) {
      throw new Error("Không có nhân viên active hoặc resigned hợp lệ trong chi nhánh");
    }

    const empIds = employees.map((e: any) => e.id);

    // 3) Lấy attendance theo kỳ bằng cách so sánh trực tiếp chuỗi ngày
    const attendances = await model.Attendance.findAll({
      where: {
        employee_id: { [Op.in]: empIds },
        work_date: { [Op.between]: [period.start_date, period.end_date] },
      },
      transaction: t,
    });

    // 4) Group attendance theo employee_id
    const attByEmp = new Map<number, any[]>();
    for (const a of attendances as any[]) {
      const eid = Number(a.employee_id);
      if (!attByEmp.has(eid)) attByEmp.set(eid, []);
      attByEmp.get(eid)!.push(a);
    }

    const results: any[] = [];

    // 5) Tính NET cho từng nhân viên và UPSERT payroll_run_lines
    for (const emp of employees as any[]) {
      const rows = attByEmp.get(Number(emp.id)) || [];

      let presentDays = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let lateDays = 0;

      for (const a of rows) {
        if (a.status === "present") presentDays++;
        else if (a.status === "absent") absentDays++;
        else if (a.status === "leave") leaveDays++;
        else if (a.status === "late") lateDays++;
      }

      const dailyRate =
        Number(emp.base_salary || 0) / PAYROLL_RULE.STANDARD_WORK_DAYS;

      const paidLeaveDays = PAYROLL_RULE.PAID_LEAVE ? leaveDays : 0;

      const basePay = dailyRate * (presentDays + paidLeaveDays);
      const absentDeduction = dailyRate * absentDays;
      const lateDeduction = lateDays * PAYROLL_RULE.LATE_FINE_PER_DAY;
      const allowance = presentDays * PAYROLL_RULE.MEAL_ALLOWANCE_PER_DAY;

      const gross = basePay + allowance;

const totalDeductionBeforeTax =
  absentDeduction + lateDeduction;

const pit = await calculatePIT(
  emp.contract_type,
  gross,
  emp.dependent || 0
);

let net = gross - totalDeductionBeforeTax - pit;

      // làm tròn tiền nếu muốn
      net = Math.round(net);

      // upsert line: (run_id + employee_id) chỉ 1 dòng
      const existed = await model.PayrollRunLine.findOne({
        where: { run_id: run.id, employee_id: emp.id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (existed) {
        await existed.update({
  amount: net,
  present_days: presentDays,
  absent_days: absentDays,
  leave_days: leaveDays,
  late_days: lateDays,
  base_salary: emp.base_salary,
  daily_rate: dailyRate,
  gross_amount: gross,
  total_earning: gross,
  total_deduction: totalDeductionBeforeTax + pit,
  pit_amount: pit,
  net_amount: net,
}, { transaction: t });
      } else {
        await model.PayrollRunLine.create({
  run_id: run.id,
  employee_id: emp.id,
  amount: net,
  present_days: presentDays,
  absent_days: absentDays,
  leave_days: leaveDays,
  late_days: lateDays,
  base_salary: emp.base_salary,
  daily_rate: dailyRate,
  gross_amount: gross,
  total_earning: gross,
  total_deduction: totalDeductionBeforeTax + pit,
  pit_amount: pit,
  net_amount: net,
}, { transaction: t });
      }

      results.push({
  employee_id: emp.id,
  employee_name: emp.full_name,
  base_salary: Number(emp.base_salary || 0),
  presentDays,
  leaveDays,
  absentDays,
  lateDays,
  dailyRate: Math.round(dailyRate),
  gross: Math.round(gross),
  pit: Math.round(pit),
  net,
});
    }

    await t.commit();

    // trả về run detail luôn cho FE refresh
    const updatedRun = await getPayrollRunById(run.id);
    return { run: updatedRun, preview: results };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

// ========== EVIDENCE ==========

export async function getPayrollEvidence(runId: number, employeeId: number) {
  // 1) load run + period
  const run = await model.PayrollRun.findByPk(runId, {
    include: [{ model: model.PayrollPeriod, as: "period" }],
  });

  if (!run) throw new Error("Payroll run not found");
  const period = (run as any).period;
  if (!period) throw new Error("Run/Period not found");

  // 2) load employee
  const employee = await model.Employee.findByPk(employeeId);
  if (!employee) throw new Error("Employee not found");

  // 3) filter attendance theo kỳ lương - dùng Date object để consistency với calculatePayrollRun
  const attendance = await model.Attendance.findAll({
    where: {
      employee_id: employeeId,
      work_date: { [Op.between]: [period.start_date, period.end_date] },
    },
    order: [["work_date", "ASC"]],
  });

  // 4) summary
  const presentDays = attendance.filter((a: any) => a.status === "present").length;
  const leaveDays = attendance.filter((a: any) => a.status === "leave").length;
  const absentDays = attendance.filter((a: any) => a.status === "absent").length;
  const lateDays = attendance.filter((a: any) => a.status === "late").length;

  const summary = { presentDays, leaveDays, absentDays, lateDays };

  // 5) breakdown giống logic calculate
  const baseSalary = Number((employee as any).base_salary || 0);
  const dailyRateRaw = baseSalary / PAYROLL_RULE.STANDARD_WORK_DAYS;

  const paidLeaveDays = PAYROLL_RULE.PAID_LEAVE ? leaveDays : 0;

  const basePayRaw = dailyRateRaw * (presentDays + paidLeaveDays);
  const absentDeductionRaw = dailyRateRaw * absentDays;
  const lateDeductionRaw = lateDays * PAYROLL_RULE.LATE_FINE_PER_DAY;
  const allowanceRaw = presentDays * PAYROLL_RULE.MEAL_ALLOWANCE_PER_DAY;

  const grossRaw = basePayRaw + allowanceRaw;

const pitRaw = await calculatePIT(
  (employee as any).contract_type,
  grossRaw,
  (employee as any).dependent || 0
);

let netRaw =
  grossRaw -
  absentDeductionRaw -
  lateDeductionRaw -
  pitRaw;

  // làm tròn theo kiểu bạn đang dùng ở calculatePayrollRun
  const dailyRate = Math.round(dailyRateRaw);
  const basePay = Math.round(basePayRaw);
  const absentDeduction = Math.round(absentDeductionRaw);
  const lateDeduction = Math.round(lateDeductionRaw);
  const allowance = Math.round(allowanceRaw);
  const net = Math.round(netRaw);

  // 6) amount đang lưu trong payroll_run_lines (nếu có)
  const line = await model.PayrollRunLine.findOne({
    where: { run_id: runId, employee_id: employeeId },
  });

  // Fix logic check null properly
  const storedAmount = line && (line as any).amount != null 
    ? Number((line as any).amount) 
    : null;
  const diff = storedAmount === null ? null : Math.round(net - storedAmount);

  return {
    run: {
      id: (run as any).id,
      run_no: (run as any).run_no,
      status: (run as any).status,
    },
    period: {
      id: period.id,
      branch_id: period.branch_id,
      start_date: period.start_date,
      end_date: period.end_date,
      period_code: period.period_code,
    },
    employee: {
      id: (employee as any).id,
      code: (employee as any).code,
      full_name: (employee as any).full_name,
      base_salary: baseSalary,
      contract_type: (employee as any).contract_type,
dependent: (employee as any).dependent || 0,
    },
    
    attendance,
    summary,
   breakdown: {
  dailyRate,
  basePay,
  allowance,
  absentDeduction,
  lateDeduction,
  gross: Math.round(grossRaw),
  pit: Math.round(pitRaw),
  net,
  storedAmount,
  diff,
},
  };
}
async function calculatePIT(
  contractType: string,
  gross: number,
  dependents: number = 0
) {
  if (gross <= 0) return 0;

  // Hợp đồng thử việc hoặc thời vụ từ 2 triệu trở lên bị khấu trừ 10%
  if (["trial", "seasonal"].includes(contractType)) {
    return gross >= 2000000 ? gross * 0.1 : 0;
  }

  // Hợp đồng chính thức áp dụng Biểu thuế lũy tiến từng phần
  const personalDeduction = 11000000;
  const dependentDeduction = dependents * 4400000;

  const taxableIncome = Math.max(
    gross - personalDeduction - dependentDeduction,
    0
  );

  if (taxableIncome <= 0) return 0;

  // Tính thuế TNCN lũy tiến từng phần theo quy định Việt Nam
  let pit = 0;
  if (taxableIncome <= 5000000) {
    pit = taxableIncome * 0.05;
  } else if (taxableIncome <= 10000000) {
    pit = taxableIncome * 0.10 - 250000;
  } else if (taxableIncome <= 18000000) {
    pit = taxableIncome * 0.15 - 750000;
  } else if (taxableIncome <= 32000000) {
    pit = taxableIncome * 0.20 - 1650000;
  } else if (taxableIncome <= 52000000) {
    pit = taxableIncome * 0.25 - 3250000;
  } else if (taxableIncome <= 80000000) {
    pit = taxableIncome * 0.30 - 5850000;
  } else {
    pit = taxableIncome * 0.35 - 9850000;
  }

  return pit;
}