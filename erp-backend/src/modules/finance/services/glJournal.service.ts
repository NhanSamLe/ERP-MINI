import { GlJournal } from "../models/glJournal.model";
import * as model from "../../../models/index";
import { Op } from "sequelize";
import { sequelize } from "../../../config/db";

export async function getAllGlJournals() {
  const rows = await GlJournal.findAll({
    order: [["code", "ASC"]],
  });
  return rows;
}
export async function listJournals() {
  return model.GlJournal.findAll({ order: [["id", "ASC"]] });
}

export async function listEntriesByJournal(
  journalId: number,
  filter: { from?: string; to?: string; status?: string; search?: string }
) {
  const where: any = { journal_id: journalId };

  if (filter.status) where.status = filter.status;

  if (filter.from || filter.to) {
    where.entry_date = {};
    if (filter.from) where.entry_date[Op.gte] = new Date(filter.from + " 00:00:00");
    if (filter.to) where.entry_date[Op.lte] = new Date(filter.to + " 23:59:59");
  }

  if (filter.search) {
    where[Op.or] = [
      { entry_no: { [Op.like]: `%${filter.search}%` } },
      { memo: { [Op.like]: `%${filter.search}%` } },
      { reference_type: { [Op.like]: `%${filter.search}%` } },
    ];
  }

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
  branchId?: number | null
) {
  const { journal_id, entry_date, memo, reference_type, reference_id, lines } = data;

  if (!journal_id) {
    throw new Error("Nhật ký kế toán là bắt buộc.");
  }
  if (!entry_date) {
    throw new Error("Ngày hạch toán là bắt buộc.");
  }
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

  // 3. Tạo mã bút toán JV duy nhất
  const todayStr = new Date(entry_date).toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  const entryNo = `JV-${todayStr}-${rand}`;

  // 4. Lưu vào database thông qua Transaction
  return await sequelize.transaction(async (t) => {
    const entryData: any = {
      journal_id,
      entry_no: entryNo,
      entry_date: new Date(entry_date),
      status: "draft", // Mặc định tạo tay là Draft
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

  if (user.role !== "CHACC" && user.role !== "ADMIN") {
    throw new Error("Chỉ Kế toán trưởng hoặc Admin mới có quyền duyệt/hủy duyệt bút toán.");
  }

  await entry.update({ status });
  return getEntryDetail(id);
}

export async function getTrialBalance(filter: { from: string; to: string; branch_id?: number }) {
  const accounts = await model.GlAccount.findAll({ order: [["code", "ASC"]] });
  
  const entryWhere: any = {
    status: "posted"
  };
  if (filter.branch_id) {
    entryWhere.branch_id = filter.branch_id;
  }

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

export async function getProfitLoss(filter: { from: string; to: string; branch_id?: number }) {
  const trialBalance = await getTrialBalance(filter);
  
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