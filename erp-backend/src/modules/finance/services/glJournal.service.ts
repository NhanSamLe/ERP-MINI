import { GlJournal } from "../models/glJournal.model";
import * as model from "../../../models/index";
import { Op } from "sequelize";
import { sequelize } from "../../../config/db";
import { assertPostingPeriodOpen } from "./fiscalGuard.service";
import { getCompanyIdFromUserBranch } from "./companyScope.service";

export async function getAllGlJournals(companyId?: number) {
  const where: any = {};
  if (companyId) where[Op.or] = [{ company_id: companyId }, { company_id: null }];
  return GlJournal.findAll({ where, order: [["code", "ASC"]] });
}

export async function listJournals(companyId?: number) {
  const where: any = {};
  if (companyId) where[Op.or] = [{ company_id: companyId }, { company_id: null }];
  return model.GlJournal.findAll({ where, order: [["id", "ASC"]] });
}

export async function listEntriesByJournal(
  journalId: number,
  filter: { from?: string; to?: string; status?: string; search?: string; branch_id?: number }
) {
  const where: any = { journal_id: journalId };
  const andConditions: any[] = [];
  if (filter.branch_id) where.branch_id = filter.branch_id;

  if (filter.status) where.status = filter.status;

  if (filter.from || filter.to) {
    where.entry_date = {};
    if (filter.from) where.entry_date[Op.gte] = new Date(filter.from + " 00:00:00");
    if (filter.to) where.entry_date[Op.lte] = new Date(filter.to + " 23:59:59");
  }

  if (filter.search) {
    andConditions.push({ [Op.or]: [
      { entry_no: { [Op.like]: `%${filter.search}%` } },
      { memo: { [Op.like]: `%${filter.search}%` } },
      { reference_type: { [Op.like]: `%${filter.search}%` } },
    ] });
  }

  if (andConditions.length > 0) where[Op.and] = andConditions;

  return model.GlEntry.findAll({
    where,
    order: [["entry_date", "DESC"], ["id", "DESC"]],
    include: [
      { model: model.GlJournal, as: "journal" },
    ],
  });
}

export async function getEntryDetail(id: number) {
  const row = await model.GlEntry.findByPk(id, {
    include: [
      { model: model.GlJournal, as: "journal" },
      {
        model: model.GlEntryLine,
        as: "lines",
        include: [
          { model: model.GlAccount, as: "account" },
          { model: model.Partner, as: "partner", attributes: ["id", "name"] },
        ],
      },
    ],
    order: [[{ model: model.GlEntryLine, as: "lines" }, "id", "ASC"]],
  });

  if (!row) throw new Error("Entry not found");
  return row;
}

export async function createManualEntry(
  data: {
    journal_id: number;
    entry_date: string | Date;
    memo?: string;
    reference_type?: string;
    reference_id?: number;
    lines: {
      account_id: number;
      partner_id?: number;
      debit: number;
      credit: number;
    }[];
  },
  branchId?: number | null,
  companyId?: number | null,
) {
  const { journal_id, entry_date, memo, reference_type, reference_id, lines } = data;

  if (!journal_id) {
    throw new Error("Nhật ký kế toán là bắt buộc.");
  }
  if (!entry_date) {
    throw new Error("Ngày hạch toán là bắt buộc.");
  }
  await checkPeriodLocked(entry_date);

  if (!lines || !Array.isArray(lines) || lines.length < 2) {
    throw new Error("Bút toán phải có ít nhất 2 dòng định khoản.");
  }

  // 1. Kiểm tra từng dòng
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    if (!line.account_id) {
      throw new Error("Mỗi dòng định khoản phải chọn một tài khoản kế toán.");
    }
    const debitVal = Number(line.debit || 0);
    const creditVal = Number(line.credit || 0);

    if (debitVal < 0 || creditVal < 0) {
      throw new Error("Số tiền hạch toán không được nhỏ hơn 0.");
    }
    if (debitVal > 0 && creditVal > 0) {
      throw new Error("Một dòng hạch toán không thể có cả số tiền Nợ và Có.");
    }
    if (debitVal === 0 && creditVal === 0) {
      throw new Error("Mỗi dòng hạch toán phải có số tiền Nợ hoặc Có lớn hơn 0.");
    }

    totalDebit += debitVal;
    totalCredit += creditVal;
  }

  // 2. Kiểm tra cân đối Nợ - Có
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Bút toán không cân đối. Tổng Nợ (${totalDebit.toLocaleString()}) phải bằng Tổng Có (${totalCredit.toLocaleString()}).`);
  }

  // companyId chỉ dùng để kiểm tra kỳ kế toán; GlEntry lấy scope theo branch_id.
  await assertPostingPeriodOpen(entry_date, companyId ?? undefined);

  // 3. Tạo mã bút toán JV duy nhất
  const todayStr = new Date(entry_date).toISOString().slice(0, 10).replace(/-/g, "");
  const count = await model.GlEntry.count({
    where: {
      entry_no: { [Op.like]: `JV-${todayStr}-%` }
    }
  });
  const nextSeq = String(count + 1).padStart(4, "0");
  const entryNo = `JV-${todayStr}-${nextSeq}`;

  // 4. Lưu vào database thông qua Transaction
  return await sequelize.transaction(async (t) => {
    const entryData: any = {
      journal_id,
      entry_no: entryNo,
      entry_date: new Date(entry_date),
      status: "draft",
    };
    if (memo !== undefined) entryData.memo = memo;
    if (branchId !== undefined && branchId !== null) entryData.branch_id = branchId;
    if (reference_type !== undefined) entryData.reference_type = reference_type;
    if (reference_id !== undefined) entryData.reference_id = reference_id;

    const entry = await model.GlEntry.create(entryData, { transaction: t });

    const lineRecords = lines.map((l) => {
      const lineData: any = {
        entry_id: entry.id,
        account_id: l.account_id,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
      };
      if (l.partner_id !== undefined && l.partner_id !== null) {
        lineData.partner_id = l.partner_id;
      }
      return lineData;
    });

    await model.GlEntryLine.bulkCreate(lineRecords, { transaction: t });

    // Trả về chi tiết bút toán mới tạo
    return await model.GlEntry.findByPk(entry.id, {
      include: [
        { model: model.GlJournal, as: "journal" },
        {
          model: model.GlEntryLine,
          as: "lines",
          include: [
            { model: model.GlAccount, as: "account" },
            { model: model.Partner, as: "partner", attributes: ["id", "name"] },
          ],
        },
      ],
      transaction: t,
    });
  });
}

export async function updateEntryStatus(id: number, status: "draft" | "posted", user: any) {
  const entry = await model.GlEntry.findByPk(id);
  if (!entry) throw new Error("Bút toán không tồn tại.");
  const companyId = await getCompanyIdFromUserBranch(user ?? {});

  await checkPeriodLocked(entry.entry_date);
  if (user?.branch_id && entry.branch_id && entry.branch_id !== user.branch_id) {
    throw new Error("Không được phép thao tác bút toán của chi nhánh khác.");
  }

  if (user.role !== "CHACC" && user.role !== "ADMIN") {
    throw new Error("Chỉ Kế toán trưởng hoặc Admin mới có quyền duyệt/hủy duyệt bút toán.");
  }

  if (status === "posted") {
    await assertPostingPeriodOpen(entry.entry_date, companyId);
  }

  await entry.update({ status });
  return getEntryDetail(id);
}

export async function getTrialBalance(filter: { from: string; to: string; branch_id?: number; company_id?: number; excludeClosing?: boolean }) {
  const accountWhere: any = {};
  if (filter.company_id) accountWhere[Op.or] = [{ company_id: filter.company_id }, { company_id: null }];
  const entryWhere: any = {
    status: "posted"
  };
  if (filter.excludeClosing) {
    entryWhere.reference_type = { [Op.ne]: "period_closing" };
  }
  if (filter.branch_id) {
    entryWhere.branch_id = filter.branch_id;
  }

  const entryWhere: any = { status: "posted" };
  if (filter.branch_id) entryWhere.branch_id = filter.branch_id;

  const entries = await model.GlEntry.findAll({
    where: entryWhere,
    include: [{
      model: model.GlEntryLine,
      as: "lines"
    }]
  });
  
  const fromDate = new Date(filter.from + " 00:00:00");
  const toDate = new Date(filter.to + " 23:59:59");
  
  const trialBalance = accounts.map(acc => {
    let openingDebit = 0;
    let openingCredit = 0;
    let periodDebit = 0;
    let periodCredit = 0;
    
    for (const entry of entries) {
      const entryDate = new Date(entry.entry_date);
      const isBefore = entryDate < fromDate;
      const isWithin = entryDate >= fromDate && entryDate <= toDate;
      
      const lines = (entry as any).lines || [];
      for (const line of lines) {
        if (Number(line.account_id) === acc.id) {
          if (isBefore) {
            openingDebit += Number(line.debit || 0);
            openingCredit += Number(line.credit || 0);
          } else if (isWithin) {
            periodDebit += Number(line.debit || 0);
            periodCredit += Number(line.credit || 0);
          }
        }
      }
    }
    
    let openingBalance = 0;
    // Báo cáo tạm thời (Doanh thu & Chi phí) đầu 5, 6, 7, 8, 9 không có số dư chuyển kỳ (số dư đầu kỳ luôn bằng 0)
    const isNominalAccount = acc.code.startsWith("5") || acc.code.startsWith("6") || acc.code.startsWith("7") || acc.code.startsWith("8") || acc.code.startsWith("9");
    
    if (!isNominalAccount) {
      if (acc.normal_side === "debit") {
        openingBalance = openingDebit - openingCredit;
      } else {
        openingBalance = openingCredit - openingDebit;
      }
    }
    
    let closingBalance = 0;
    if (isNominalAccount) {
      if (acc.normal_side === "debit") {
        closingBalance = periodDebit - periodCredit;
      } else {
        closingBalance = periodCredit - periodDebit;
      }
    } else {
      if (acc.normal_side === "debit") {
        closingBalance = openingBalance + periodDebit - periodCredit;
      } else {
        closingBalance = openingBalance + periodCredit - periodDebit;
      }
    }
    
    return {
      id: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      normal_side: acc.normal_side,
      openingBalance,
      periodDebit,
      periodCredit,
      closingBalance
    };
  });
  
  return trialBalance;
}

export async function getProfitLoss(filter: { from: string; to: string; branch_id?: number; company_id?: number }) {
  const trialBalance = await getTrialBalance({ ...filter, excludeClosing: true });
  
  // Doanh thu (Revenue): TK đầu 5 (511)
  const revenueAccounts = trialBalance.filter(acc => acc.code.startsWith("5"));
  const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.periodCredit - acc.periodDebit, 0);
  
  // Giá vốn (COGS): Chỉ lấy TK 632
  const cogsAccounts = trialBalance.filter(acc => acc.code === "632");
  const totalCogs = cogsAccounts.reduce((sum, acc) => sum + acc.periodDebit - acc.periodCredit, 0);
  
  // Chi phí bán hàng: TK 641
  const sellingAccounts = trialBalance.filter(acc => acc.code === "641");
  const totalSelling = sellingAccounts.reduce((sum, acc) => sum + acc.periodDebit - acc.periodCredit, 0);

  // Chi phí quản lý doanh nghiệp: TK 642
  const adminAccounts = trialBalance.filter(acc => acc.code === "642");
  const totalAdmin = adminAccounts.reduce((sum, acc) => sum + acc.periodDebit - acc.periodCredit, 0);

  const grossProfit = totalRevenue - totalCogs;
  const netOperatingProfit = grossProfit - totalSelling - totalAdmin;
  
  return {
    revenueAccounts,
    totalRevenue,
    cogsAccounts,
    totalCogs,
    grossProfit,
    sellingAccounts,
    totalSelling,
    adminAccounts,
    totalAdmin,
    netOperatingProfit
  };
}

/**
 * Kiểm tra xem ngày hạch toán có rơi vào kỳ kế toán đã khóa sổ hay không.
 * Nếu đã khóa sổ, ném ra lỗi để chặn mọi thao tác ghi/sửa dữ liệu.
 */
export async function checkPeriodLocked(date: Date | string, transaction?: any) {
  const targetDate = new Date(date).toISOString().slice(0, 10);
  const closedPeriod = await model.FiscalPeriod.findOne({
    where: {
      status: "closed",
      start_date: { [Op.lte]: targetDate },
      end_date: { [Op.gte]: targetDate }
    },
    transaction
  });

  if (closedPeriod) {
    throw new Error(
      `Kỳ kế toán [${closedPeriod.name}] đã khóa sổ. Không thể thực hiện hạch toán hoặc chỉnh sửa dữ liệu vào ngày ${targetDate}.`
    );
  }
}

/**
 * Thực hiện kết chuyển số dư các tài khoản doanh thu, chi phí cuối kỳ về tài khoản 911,
 * sau đó chuyển số dư lãi/lỗ sang tài khoản 421.
 */
export async function closeBranchPeriod(periodId: number, branchId: number, userId: number) {
  // 1. Lấy FiscalPeriod
  const period = await model.FiscalPeriod.findByPk(periodId);
  if (!period) throw new Error("Kỳ kế toán không tồn tại.");
  if (period.status === "closed") {
    throw new Error("Kỳ kế toán đã khóa sổ. Không thể tạo bút toán kết chuyển.");
  }

  // Tránh kết chuyển trùng cho chi nhánh trong kỳ này
  const existed = await model.GlEntry.findOne({
    where: {
      reference_type: "period_closing",
      reference_id: periodId,
      branch_id: branchId,
    }
  });
  if (existed) {
    throw new Error("Bút toán kết chuyển của chi nhánh này trong kỳ đã tồn tại.");
  }

  // 2. Lấy Trial Balance cho khoảng thời gian của kỳ kế toán
  const trialBalance = await getTrialBalance({
    from: period.start_date,
    to: period.end_date,
    branch_id: branchId,
    excludeClosing: true
  });

  // 3. Tự động kiểm tra/tạo tài khoản 911 và 421 làm fallback
  let acc911 = await model.GlAccount.findOne({ where: { code: "911" } });
  if (!acc911) {
    acc911 = await model.GlAccount.create({
      code: "911",
      name: "Xác định kết quả hoạt động kinh doanh",
      type: "equity",
      normal_side: "debit"
    } as any);
  }

  let acc421 = await model.GlAccount.findOne({ where: { code: "421" } });
  if (!acc421) {
    acc421 = await model.GlAccount.create({
      code: "421",
      name: "Lợi nhuận sau thuế chưa phân phối",
      type: "equity",
      normal_side: "credit"
    } as any);
  }

  // 4. Lọc các tài khoản doanh thu (đầu 5, 7) và chi phí (đầu 6, 8, 9)
  // có phát sinh số dư (cần kết chuyển về 911)
  const nominalAccounts = trialBalance.filter(acc => {
    const isNominal = acc.code.startsWith("5") || acc.code.startsWith("6") || acc.code.startsWith("7") || acc.code.startsWith("8") || acc.code.startsWith("9");
    return isNominal && acc.closingBalance !== 0;
  });

  if (nominalAccounts.length === 0) {
    throw new Error("Không có số dư tài khoản doanh thu/chi phí nào cần kết chuyển trong kỳ này.");
  }

  // 5. Chạy bút toán kết chuyển trong transaction
  return await sequelize.transaction(async (t) => {
    const journal = await model.GlJournal.findOne({ where: { code: "GENERAL" }, transaction: t });
    if (!journal) throw new Error("GL Journal 'GENERAL' not found");

    // Tạo mã JV kết chuyển: JV-CLOSE-P[id]-B[branch]
    const entryNo = `JV-CLOSE-P${periodId}-B${branchId}`;

    const entry = await model.GlEntry.create({
      journal_id: journal.id,
      entry_no: entryNo,
      entry_date: new Date(period.end_date), // Kết chuyển vào ngày cuối kỳ
      reference_type: "period_closing",
      reference_id: periodId,
      memo: `Kết chuyển xác định kết quả kinh doanh kỳ ${period.name}`,
      status: "posted", // Bút toán kết chuyển mặc định ở trạng thái posted
      branch_id: branchId
    } as any, { transaction: t });

    const linesToInsert: any[] = [];
    let netIncomeTo911 = 0; // Số tiền kết chuyển sang 911 (Doanh thu - Chi phí)

    for (const acc of nominalAccounts) {
      const balance = acc.closingBalance;
      const isRevenue = acc.code.startsWith("5") || acc.code.startsWith("7");

      if (isRevenue) {
        // Doanh thu (phát sinh Có): kết chuyển ghi Nợ tài khoản doanh thu, ghi Có 911
        linesToInsert.push({
          entry_id: entry.id,
          account_id: acc.id,
          debit: balance,
          credit: 0
        });
        linesToInsert.push({
          entry_id: entry.id,
          account_id: acc911.id,
          debit: 0,
          credit: balance
        });
        netIncomeTo911 += balance;
      } else {
        // Chi phí (phát sinh Nợ): kết chuyển ghi Có tài khoản chi phí, ghi Nợ 911
        linesToInsert.push({
          entry_id: entry.id,
          account_id: acc.id,
          debit: 0,
          credit: balance
        });
        linesToInsert.push({
          entry_id: entry.id,
          account_id: acc911.id,
          debit: balance,
          credit: 0
        });
        netIncomeTo911 -= balance;
      }
    }

    // Kết chuyển Lợi nhuận từ 911 sang 421
    if (netIncomeTo911 > 0) {
      // Có lãi: ghi Nợ 911 / ghi Có 421
      linesToInsert.push({
        entry_id: entry.id,
        account_id: acc911.id,
        debit: netIncomeTo911,
        credit: 0
      });
      linesToInsert.push({
        entry_id: entry.id,
        account_id: acc421.id,
        debit: 0,
        credit: netIncomeTo911
      });
    } else if (netIncomeTo911 < 0) {
      // Lỗ: ghi Có 911 / ghi Nợ 421
      const absLoss = Math.abs(netIncomeTo911);
      linesToInsert.push({
        entry_id: entry.id,
        account_id: acc911.id,
        debit: 0,
        credit: absLoss
      });
      linesToInsert.push({
        entry_id: entry.id,
        account_id: acc421.id,
        debit: absLoss,
        credit: 0
      });
    }

    await model.GlEntryLine.bulkCreate(linesToInsert, { transaction: t });
    return entry;
  });
}
