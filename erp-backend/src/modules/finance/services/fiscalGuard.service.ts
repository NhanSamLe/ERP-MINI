import { Op, Transaction } from "sequelize";
import { FiscalPeriod } from "../models/fiscalPeriod.model";
import { FiscalYear } from "../models/fiscalYear.model";

function toDateOnly(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Ngày hạch toán không hợp lệ.");
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Kiểm tra ngày hạch toán không rơi vào kỳ kế toán đã khoá của công ty.
 *
 * @param entryDate  - Ngày chứng từ cần kiểm tra
 * @param companyId  - ID công ty (multi-tenant isolation)
 * @param transaction - Sequelize transaction (optional)
 *
 * Nếu không truyền companyId → chỉ check period toàn cục (backward compatible).
 */
export async function assertPostingPeriodOpen(
  entryDate: Date | string,
  companyId?: number,
  transaction?: Transaction,
): Promise<void> {
  const dateOnly = toDateOnly(entryDate);

  const closedPeriod = await FiscalPeriod.findOne({
    where: {
      start_date: { [Op.lte]: dateOnly },
      end_date: { [Op.gte]: dateOnly },
      status: "closed",
    },
    include: companyId
      ? [
          {
            model: FiscalYear,
            as: "fiscalYear",
            where: { company_id: companyId },
            required: true,
          },
        ]
      : [],
    transaction,
  } as any);

  if (closedPeriod) {
    throw new Error(
      `Kỳ kế toán "${closedPeriod.name}" đã khoá. Không được tạo hoặc ghi sổ chứng từ ngày ${dateOnly}.`,
    );
  }
}
