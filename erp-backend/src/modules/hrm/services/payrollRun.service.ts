import { Op } from "sequelize";
import * as model from "../../../models/index";
import { PAYROLL_RULE } from "../constants/payrollRule";
import dayjs from "dayjs";
import { notificationService } from "../../../core/services/notification.service";
import { getPayrollConfigMap } from "./payrollConfig.service";
import { checkPeriodLocked } from "../../finance/services/glJournal.service";
import { requireGlAccounts } from "../../finance/services/glAccount.helper";
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

export async function getAllPayrollRuns(filter: PayrollRunFilter = {}, branchId?: number) {
  const where: any = {};

  if (typeof filter.period_id === "number") {
    where.period_id = filter.period_id;
  }

  if (filter.status && filter.status !== "all") {
    where.status = filter.status;
  }

  const periodWhere: any = {};
  if (branchId) periodWhere.branch_id = branchId;

  const rows = await model.PayrollRun.findAll({
    where,
    order: [["created_at", "DESC"]],
    include: [
      {
        model: model.PayrollPeriod,
        as: "period",
        where: Object.keys(periodWhere).length > 0 ? periodWhere : undefined,
        required: !!branchId,
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
  const row = await model.PayrollRun.findByPk(id, {
    include: [{ model: model.PayrollPeriod, as: "period" }]
  });
  if (!row) throw new Error("Payroll run not found");

  if ((row as any).status === "posted") {
    throw new Error("Không thể hủy bảng lương đã post");
  }
  if ((row as any).period?.status === "closed") {
    throw new Error("Không thể hủy bảng lương trong kỳ đã khóa");
  }

  await row.destroy();
}

export async function postPayrollRun(id: number, transaction?: any) {
  const executePost = async (t: any) => {
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

    // Kiểm tra kỳ kế toán đã khóa sổ hay chưa
    await checkPeriodLocked(period.start_date, t);

    // Load configurations from DB
    const configMap = await getPayrollConfigMap();
    const insBaseMax = Number(configMap.INSURANCE_BASE_MAX || 46800000);
    const insBaseBhtnMax = Number(configMap.INSURANCE_BASE_BHTN_MAX || 99200000);
    const insEmpSocial = Number(configMap.INS_EMP_SOCIAL_RATE || 0.08);
    const insEmpHealth = Number(configMap.INS_EMP_HEALTH_RATE || 0.015);
    const insEmpUnemp = Number(configMap.INS_EMP_UNEMP_RATE || 0.01);
    const insCompSocial = Number(configMap.INS_COMP_SOCIAL_RATE || 0.175);
    const insCompHealth = Number(configMap.INS_COMP_HEALTH_RATE || 0.03);
    const insCompUnemp = Number(configMap.INS_COMP_UNEMP_RATE || 0.01);
    const branchRecord = await model.Branch.findByPk(period.branch_id, {
      attributes: ["id", "company_id"],
      transaction: t,
    });
    if (!branchRecord || !(branchRecord as any).company_id) {
      throw new Error("Không xác định được công ty từ chi nhánh — không thể hạch toán lương");
    }
    const companyId = (branchRecord as any).company_id;

    const totalPit = lines.reduce((sum, l) => sum + Number(l.pit_amount || 0), 0);
    if (totalPit > 0) {
      const checkAcc3335 = await model.GlAccount.findOne({
        where: { company_id: companyId, code: "3335" },
        transaction: t,
      });
      if (!checkAcc3335) {
        throw new Error(
          `Tài khoản "3335 - Thuế TNCN phải nộp" chưa được thiết lập cho công ty này. ` +
          `Vui lòng thêm vào Chart of Accounts trước khi post bảng lương có phát sinh thuế TNCN.`,
        );
      }
    }

    // 1. Tự động kiểm tra/tạo các tài khoản tiền lương hệ thống làm fallback
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

    let acc338 = await model.GlAccount.findOne({ where: { code: "338" }, transaction: t });
    if (!acc338) {
      acc338 = await model.GlAccount.create({
        code: "338",
        name: "Phải trả phải nộp khác (Bảo hiểm xã hội)",
        type: "liability",
        normal_side: "credit",
      } as any, { transaction: t });
    }

    let acc3335 = await model.GlAccount.findOne({ where: { code: "3335" }, transaction: t });
    if (!acc3335) {
      acc3335 = await model.GlAccount.create({
        code: "3335",
        name: "Thuế thu nhập cá nhân phải nộp",
        type: "liability",
        normal_side: "credit",
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

    // 3. Load Mappings & Departments
    const mappings = await model.PayrollAccountMapping.findAll({
      where: { branch_id: period.branch_id },
      transaction: t,
    });

    const departments = await model.Department.findAll({
      where: { branch_id: period.branch_id },
      transaction: t,
    });

    const getMappedAccount = (deptId: number | undefined, itemType: string, defaultCode: string) => {
      if (deptId) {
        const mapping = mappings.find(
          (m: any) => m.department_id === deptId && m.item_type === itemType
        );
        if (mapping) return mapping.account_id;
      }
      const globalMapping = mappings.find(
        (m: any) => m.department_id === null && m.item_type === itemType
      );
      if (globalMapping) return globalMapping.account_id;

      if (defaultCode === "334") return acc334.id;
      if (defaultCode === "641") return acc641.id;
      if (defaultCode === "642") return acc642.id;
      if (defaultCode === "338") return acc338.id;
      if (defaultCode === "3335") return acc3335.id;
      return acc334.id;
    };

    const getDeptCostCenter = (deptId: number | undefined) => {
      if (!deptId) return null;
      const dept = departments.find((d: any) => d.id === deptId);
      return dept ? (dept as any).cost_center_id || null : null;
    };

    const getSystemDefaultExpenseCode = (deptId: number | undefined) => {
      if (deptId) {
        const dept = departments.find((d: any) => d.id === deptId);
        if (dept) {
          const code = (dept.code || "").toUpperCase();
          if (code.includes("SALE") || code.includes("KD") || code.includes("BH") || code.includes("SALES")) {
            return "641";
          }
        }
      }
      return "642";
    };

    // 4. Tính toán tích lũy bút toán
    const entryLinesMap = new Map<string, { account_id: number; cost_center_id: number | null; partner_id: number | null; debit: number; credit: number }>();

    const addEntryLine = (account_id: number, cost_center_id: number | null, partner_id: number | null, debit: number, credit: number) => {
      const key = `${account_id}_${cost_center_id ?? ''}_${partner_id ?? ''}`;
      if (!entryLinesMap.has(key)) {
        entryLinesMap.set(key, { account_id, cost_center_id, partner_id, debit: 0, credit: 0 });
      }
      const existing = entryLinesMap.get(key)!;
      existing.debit += debit;
      existing.credit += credit;
    };

    for (const line of lines) {
      const emp = line.employee;
      const gross = Number(line.gross_amount || line.amount || 0);
      const net = Number(line.net_amount || line.amount || 0);
      const pit = Number(line.pit_amount || 0);
      const baseSalary = Number(emp?.base_salary || 0);

      let empIns = 0;
      let compIns = 0;

      const totalWorkDays = Number(line.present_days || 0) + Number(line.late_days || 0) + Number(line.leave_days || 0);
      if (emp && emp.contract_type === "official" && totalWorkDays >= 14) {
        const insuranceBase = Math.min(baseSalary, insBaseMax);
        const insuranceBaseBhtn = Math.min(baseSalary, insBaseBhtnMax);
        empIns = insuranceBase * (insEmpSocial + insEmpHealth) + insuranceBaseBhtn * insEmpUnemp;
        compIns = insuranceBase * (insCompSocial + insCompHealth) + insuranceBaseBhtn * insCompUnemp;
      }

      const costCenterId = getDeptCostCenter(emp?.department_id);
      const salaryDefaultCode = getSystemDefaultExpenseCode(emp?.department_id);

      // Debit salary expense (Gross - Late Deduction)
      const lateDeduction = Number(line.late_days || 0) * 50000; // 50k fine per late day
      const netSalaryExpense = gross - lateDeduction;

      if (netSalaryExpense > 0) {
        const salaryAccId = getMappedAccount(emp?.department_id, "salary", salaryDefaultCode);
        addEntryLine(salaryAccId, costCenterId, null, netSalaryExpense, 0);
      }

      // Debit company insurance expense
      if (compIns > 0) {
        const compInsAccId = getMappedAccount(emp?.department_id, "social_insurance_company", salaryDefaultCode);
        addEntryLine(compInsAccId, costCenterId, null, compIns, 0);
      }

      // Credit Net payable (TK 334)
      if (net > 0) {
        const netAccId = getMappedAccount(emp?.department_id, "net_payable", "334");
        addEntryLine(netAccId, null, null, 0, net);
      }

      // Credit PIT (TK 3335)
      if (pit > 0) {
        const pitAccId = getMappedAccount(emp?.department_id, "pit", "3335");
        addEntryLine(pitAccId, null, null, 0, pit);
      }

      // Credit Social insurance (TK 338) - both employee & company
      const totalInsLiability = empIns + compIns;
      if (totalInsLiability > 0) {
        const insAccId = getMappedAccount(emp?.department_id, "social_insurance_employee", "338");
        addEntryLine(insAccId, null, null, 0, totalInsLiability);
      }
    }

    // 5. Cân đối kép
    const linesToInsert = Array.from(entryLinesMap.values());
    const sumDebit = linesToInsert.reduce((sum, l) => sum + l.debit, 0);
    const sumCredit = linesToInsert.reduce((sum, l) => sum + l.credit, 0);
    const diff = sumCredit - sumDebit;
    if (Math.abs(diff) > 0.01 && linesToInsert.length > 0) {
      const debitLine = linesToInsert.find(l => l.debit > 0);
      if (debitLine) {
        debitLine.debit += diff;
      }
    }

    // 6. Tạo bút toán GL Entry
    const entry = await model.GlEntry.create({
      journal_id: journal.id,
      entry_no: `GL-HRM-PAY-RUN-${row.id}`,
      entry_date: new Date(),
      reference_type: "payroll_run",
      reference_id: row.id,
      memo: `Hạch toán chi phí lương kỳ ${period.period_code} - Bảng lương ${(row as any).run_no}`,
      status: "posted",
      branch_id: period.branch_id,
    } as any, { transaction: t });

    // 7. Tạo các dòng bút toán GL Entry Line
    const bulkLines = linesToInsert.map(l => ({
      entry_id: entry.id,
      account_id: l.account_id,
      cost_center_id: l.cost_center_id,
      partner_id: l.partner_id,
      debit: l.debit,
      credit: l.credit,
    }));

    await model.GlEntryLine.bulkCreate(bulkLines as any[], { transaction: t });

    // 8. Cập nhật trạng thái bảng lương sang "posted"
    (row as any).status = "posted";
    await row.save({ transaction: t });
    return row;
  };

  if (transaction) {
    return await executePost(transaction);
  } else {
    return await model.sequelize.transaction(async (t) => {
      return await executePost(t);
    });
  }
}

// ========== LINES ==========

export async function createPayrollRunLine(payload: PayrollRunLinePayload) {
  const { run_id, employee_id, amount } = payload;

  if (!run_id || !employee_id) {
    throw new Error("run_id và employee_id là bắt buộc");
  }

  const run = await model.PayrollRun.findByPk(run_id, {
    include: [{ model: model.PayrollPeriod, as: "period" }]
  });
  if (!run) throw new Error("Payroll run not found");
  if ((run as any).status === "posted") {
    throw new Error("Không thể thêm dòng cho bảng lương đã post");
  }
  if ((run as any).period?.status === "closed") {
    throw new Error("Không thể thêm dòng cho bảng lương trong kỳ đã khóa");
  }

  const employee = await model.Employee.findByPk(employee_id);
  if (!employee) throw new Error("Employee not found");

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
    include: [
      {
        model: model.PayrollRun,
        as: "run",
        include: [{ model: model.PayrollPeriod, as: "period" }],
      },
    ],
  });
  if (!line) throw new Error("Payroll line not found");

  const run = (line as any).run;
  if (run && run.status === "posted") {
    throw new Error("Không thể sửa dòng lương của bảng đã post");
  }
  if (run && run.period?.status === "closed") {
    throw new Error("Không thể sửa dòng lương của kỳ lương đã khóa");
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
    include: [
      {
        model: model.PayrollRun,
        as: "run",
        include: [{ model: model.PayrollPeriod, as: "period" }],
      },
    ],
  });
  if (!line) throw new Error("Payroll line not found");

  const run = (line as any).run;
  if (run && run.status === "posted") {
    throw new Error("Không thể xóa dòng lương của bảng đã post");
  }
  if (run && run.period?.status === "closed") {
    throw new Error("Không thể xóa dòng lương của kỳ lương đã khóa");
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

    // Load configurations from DB
    const configMap = await getPayrollConfigMap();
    const standardWorkDays = Number(configMap.STANDARD_WORK_DAYS || 26);
    const paidLeave = configMap.PAID_LEAVE === "true";
    const lateFinePerDay = Number(configMap.LATE_FINE_PER_DAY || 50000);
    const mealAllowancePerDay = Number(configMap.MEAL_ALLOWANCE_PER_DAY || 30000);
    const insBaseMax = Number(configMap.INSURANCE_BASE_MAX || 46800000);
    const insBaseBhtnMax = Number(configMap.INSURANCE_BASE_BHTN_MAX || 99200000);
    const insEmpSocial = Number(configMap.INS_EMP_SOCIAL_RATE || 0.08);
    const insEmpHealth = Number(configMap.INS_EMP_HEALTH_RATE || 0.015);
    const insEmpUnemp = Number(configMap.INS_EMP_UNEMP_RATE || 0.01);
    const personalDeductionVal = Number(configMap.PERSONAL_DEDUCTION || 11000000);
    const dependentDeductionVal = Number(configMap.DEPENDENT_DEDUCTION || 4400000);

    // 5) Tính NET cho từng nhân viên và UPSERT payroll_run_lines
    for (const emp of employees as any[]) {
      const rows = attByEmp.get(Number(emp.id)) || [];

      let presentDays = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let lateDays = 0;

      for (const a of rows) {
        if (a.status === "present") presentDays++;
        else if (a.status === "leave") leaveDays++;
        else if (a.status === "late") lateDays++;
      }

      // Tính số ngày nghỉ không phép theo công thức trừ lùi động
      const calculatedAbsent = standardWorkDays - (presentDays + lateDays + leaveDays);
      absentDays = Math.max(0, calculatedAbsent);

      const dailyRate =
        Number(emp.base_salary || 0) / standardWorkDays;

      const paidLeaveDays = paidLeave ? leaveDays : 0;
      // Trả lương cho cả ngày đi muộn
      const paidDays = presentDays + lateDays + paidLeaveDays;

      const basePay = dailyRate * paidDays;
      const absentDeduction = 0; // Bỏ trừ kép (đã không làm thì không trả lương ở basePay)
      const lateDeduction = lateDays * lateFinePerDay;
      const allowance = (presentDays + lateDays) * mealAllowancePerDay;

      const gross = basePay + allowance;

      // Tính bảo hiểm bắt buộc trích từ lương NLĐ đóng (10.5%)
      // Theo luật Lao động Việt Nam: làm dưới 14 ngày thực tế không đóng BH bắt buộc
      const totalWorkDays = presentDays + lateDays + leaveDays;
      let insuranceEmp = 0;
      if (emp.contract_type === "official" && totalWorkDays >= 14) {
        const insuranceBase = Math.min(Number(emp.base_salary || 0), insBaseMax);
        const insuranceBaseBhtn = Math.min(Number(emp.base_salary || 0), insBaseBhtnMax);
        insuranceEmp = insuranceBase * (insEmpSocial + insEmpHealth) + insuranceBaseBhtn * insEmpUnemp;
      }

      const totalDeductionBeforeTax = lateDeduction; // Bỏ absentDeduction khỏi khấu trừ kép

      const pit = await calculatePIT(
        emp.contract_type,
        gross,
        emp.dependent || 0,
        insuranceEmp,
        personalDeductionVal,
        dependentDeductionVal
      );

      let net = gross - totalDeductionBeforeTax - insuranceEmp - pit;
      if (net < 0) net = 0;

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
          total_deduction: totalDeductionBeforeTax + insuranceEmp + pit,
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
          total_deduction: totalDeductionBeforeTax + insuranceEmp + pit,
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
  // Load configurations from DB
  const configMap = await getPayrollConfigMap();
  const standardWorkDays = Number(configMap.STANDARD_WORK_DAYS || 26);
  const paidLeave = configMap.PAID_LEAVE === "true";
  const lateFinePerDay = Number(configMap.LATE_FINE_PER_DAY || 50000);
  const mealAllowancePerDay = Number(configMap.MEAL_ALLOWANCE_PER_DAY || 30000);
  const insBaseMax = Number(configMap.INSURANCE_BASE_MAX || 46800000);
  const insBaseBhtnMax = Number(configMap.INSURANCE_BASE_BHTN_MAX || 99200000);
  const insEmpSocial = Number(configMap.INS_EMP_SOCIAL_RATE || 0.08);
  const insEmpHealth = Number(configMap.INS_EMP_HEALTH_RATE || 0.015);
  const insEmpUnemp = Number(configMap.INS_EMP_UNEMP_RATE || 0.01);
  const personalDeductionVal = Number(configMap.PERSONAL_DEDUCTION || 11000000);
  const dependentDeductionVal = Number(configMap.DEPENDENT_DEDUCTION || 4400000);

  // 4) summary
  const presentDays = attendance.filter((a: any) => a.status === "present").length;
  const leaveDays = attendance.filter((a: any) => a.status === "leave").length;
  const lateDays = attendance.filter((a: any) => a.status === "late").length;
  
  // Tính số ngày nghỉ không phép theo công thức trừ lùi động
  const calculatedAbsent = standardWorkDays - (presentDays + lateDays + leaveDays);
  const absentDays = Math.max(0, calculatedAbsent);

  const summary = { presentDays, leaveDays, absentDays, lateDays };

  // 5) breakdown giống logic calculate
  const baseSalary = Number((employee as any).base_salary || 0);
  const dailyRateRaw = baseSalary / standardWorkDays;

  const paidLeaveDays = paidLeave ? leaveDays : 0;
  const paidDays = presentDays + lateDays + paidLeaveDays;

  const basePayRaw = dailyRateRaw * paidDays;
  const absentDeductionRaw = 0; // Bỏ trừ kép
  const lateDeductionRaw = lateDays * lateFinePerDay;
  const allowanceRaw = (presentDays + lateDays) * mealAllowancePerDay;

  const grossRaw = basePayRaw + allowanceRaw;

  // Tính bảo hiểm bắt buộc trích từ lương NLĐ đóng (10.5%)
  // Theo luật Lao động Việt Nam: làm dưới 14 ngày thực tế không đóng BH bắt buộc
  const totalWorkDays = presentDays + lateDays + leaveDays;
  let insuranceEmpRaw = 0;
  if ((employee as any).contract_type === "official" && totalWorkDays >= 14) {
    const insuranceBase = Math.min(baseSalary, insBaseMax);
    const insuranceBaseBhtn = Math.min(baseSalary, insBaseBhtnMax);
    insuranceEmpRaw = insuranceBase * (insEmpSocial + insEmpHealth) + insuranceBaseBhtn * insEmpUnemp;
  }

  const pitRaw = await calculatePIT(
    (employee as any).contract_type,
    grossRaw,
    (employee as any).dependent || 0,
    insuranceEmpRaw,
    personalDeductionVal,
    dependentDeductionVal
  );

  let netRaw = grossRaw - lateDeductionRaw - insuranceEmpRaw - pitRaw;
  if (netRaw < 0) netRaw = 0;

  // làm tròn theo kiểu bạn đang dùng ở calculatePayrollRun
  const dailyRate = Math.round(dailyRateRaw);
  const basePay = Math.round(basePayRaw);
  const absentDeduction = Math.round(absentDeductionRaw);
  const lateDeduction = Math.round(lateDeductionRaw);
  const allowance = Math.round(allowanceRaw);
  const insuranceEmp = Math.round(insuranceEmpRaw);
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
      insuranceEmp,
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
  dependents: number = 0,
  insuranceDeduction: number = 0,
  personalDeductionVal: number = 11000000,
  dependentDeductionVal: number = 4400000
) {
  if (gross <= 0) return 0;

  // Hợp đồng thử việc hoặc thời vụ từ 2 triệu trở lên bị khấu trừ 10%
  if (["trial", "seasonal"].includes(contractType)) {
    return gross >= 2000000 ? gross * 0.1 : 0;
  }

  // Hợp đồng chính thức áp dụng Biểu thuế lũy tiến từng phần
  const personalDeduction = personalDeductionVal;
  const dependentDeduction = dependents * dependentDeductionVal;

  const taxableIncome = Math.max(
    gross - insuranceDeduction - personalDeduction - dependentDeduction,
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

export async function submitForApproval(id: number, user: any, app?: any) {
  const run = await model.PayrollRun.findByPk(id, {
    include: [{ model: model.PayrollPeriod, as: "period" }],
  });
  if (!run) throw new Error("Payroll run not found");

  if ((run as any).status === "posted") {
    throw new Error("Không thể submit bảng lương đã posted");
  }
  if ((run as any).period?.status === "closed") {
    throw new Error("Không thể submit bảng lương trong kỳ đã khóa");
  }
  if ((run as any).approval_status !== "draft" && (run as any).approval_status !== "rejected") {
    throw new Error("Chỉ bảng lương nháp hoặc bị từ chối mới được submit");
  }

  (run as any).approval_status = "waiting_chief_accountant";
  (run as any).submitted_at = new Date();
  await run.save();

  // Gửi thông báo
  if (app) {
    const io = app.get("io");
    setImmediate(async () => {
      await notificationService.createNotification({
        type: "SUBMIT",
        referenceType: "PAYROLL_RUN",
        referenceId: run.id!,
        referenceNo: (run as any).run_no!,
        branchId: (run as any).period?.branch_id!,
        submitterId: user.id,
        submitterName: user.fullName || user.username,
        targetRoles: ["CHIEF_ACCOUNTANT", "CHACC"],
        io,
      });
    });
  }

  return run;
}

export async function approvePayrollRun(id: number, user: any, app?: any) {
  const userRole = user.role?.code ?? user.role;
  const isChiefAcc = userRole === "CHACC" || userRole === "ADMIN";
  const isCEO = userRole === "CEO" || userRole === "ADMIN";

  if (!isChiefAcc && !isCEO) {
    throw new Error("Bạn không có quyền duyệt bảng lương");
  }

  return await model.sequelize.transaction(async (t) => {
    const run = await model.PayrollRun.findByPk(id, {
      include: [{ model: model.PayrollPeriod, as: "period" }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!run) throw new Error("Payroll run not found");

    if ((run as any).period?.status === "closed") {
      throw new Error("Kỳ lương đã khóa");
    }

    const currentStatus = (run as any).approval_status;
    let nextStatus = "";

    if (currentStatus === "waiting_chief_accountant") {
      if (!isChiefAcc) throw new Error("Chỉ Kế toán trưởng mới được duyệt cấp này");
      (run as any).approval_status = "waiting_ceo";
      nextStatus = "waiting_ceo";
      await run.save({ transaction: t });
    } else if (currentStatus === "waiting_ceo") {
      if (!isCEO) throw new Error("Chỉ CEO mới được duyệt cấp này");
      (run as any).approval_status = "approved";
      (run as any).approved_by = user.id;
      (run as any).approved_at = new Date();
      (run as any).reject_reason = null;
      nextStatus = "approved";
      await run.save({ transaction: t });

      // CEO duyệt xong tự động ghi sổ hạch toán
      await postPayrollRun(id, t);
    } else {
      throw new Error("Trạng thái bảng lương không hợp lệ để duyệt");
    }

    // Gửi thông báo
    if (app) {
      const io = app.get("io");
      setImmediate(async () => {
        if (nextStatus === "waiting_ceo") {
          await notificationService.createNotification({
            type: "SUBMIT",
            referenceType: "PAYROLL_RUN",
            referenceId: run.id!,
            referenceNo: (run as any).run_no!,
            branchId: (run as any).period?.branch_id!,
            submitterId: user.id,
            submitterName: user.fullName || user.username,
            targetRoles: ["CEO"],
            io,
          });
        } else if (nextStatus === "approved") {
          await notificationService.createNotification({
            type: "APPROVE",
            referenceType: "PAYROLL_RUN",
            referenceId: run.id!,
            referenceNo: (run as any).run_no!,
            branchId: (run as any).period?.branch_id!,
            submitterId: user.id,
            approverName: user.fullName || user.username,
            io,
          });
        }
      });
    }

    return await model.PayrollRun.findByPk(id, {
      include: [
        { model: model.PayrollPeriod, as: "period" },
        { model: model.PayrollRunLine, as: "lines", include: [{ model: model.Employee, as: "employee" }] },
      ],
      transaction: t,
    });
  });
}

export async function rejectPayrollRun(id: number, reason: string, user: any, app?: any) {
  const userRole = user.role?.code ?? user.role;
  const isChiefAcc = userRole === "CHACC" || userRole === "ADMIN";
  const isCEO = userRole === "CEO" || userRole === "ADMIN";

  if (!isChiefAcc && !isCEO) {
    throw new Error("Bạn không có quyền từ chối bảng lương");
  }

  const run = await model.PayrollRun.findByPk(id, {
    include: [{ model: model.PayrollPeriod, as: "period" }],
  });
  if (!run) throw new Error("Payroll run not found");

  if ((run as any).period?.status === "closed") {
    throw new Error("Kỳ lương đã khóa");
  }

  const currentStatus = (run as any).approval_status;
  if (currentStatus !== "waiting_chief_accountant" && currentStatus !== "waiting_ceo") {
    throw new Error("Bảng lương không ở trạng thái chờ duyệt");
  }

  (run as any).approval_status = "rejected";
  (run as any).reject_reason = reason;
  await run.save();

  // Gửi thông báo
  if (app) {
    const io = app.get("io");
    setImmediate(async () => {
      await notificationService.createNotification({
        type: "REJECT",
        referenceType: "PAYROLL_RUN",
        referenceId: run.id!,
        referenceNo: (run as any).run_no!,
        branchId: (run as any).period?.branch_id!,
        submitterId: user.id,
        approverName: user.fullName || user.username,
        rejectReason: reason,
        io,
      });
    });
  }

  return run;
}