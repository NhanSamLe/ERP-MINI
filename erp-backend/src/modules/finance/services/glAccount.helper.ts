import { Transaction } from "sequelize";
import { Op } from "sequelize";
import { GlAccount } from "../models/glAccount.model";

/**
 * Tìm GL Account theo (company_id, code).
 * Nếu không tìm thấy → throw rõ lỗi để không bao giờ post sai tài khoản.
 *
 * Dùng thống nhất trong tất cả services thay vì GlAccount.findOne({ where: { code } })
 * để đảm bảo multi-tenant isolation (mỗi công ty có chart of accounts riêng).
 */
export async function requireGlAccount(
  companyId: number,
  code: string,
  t?: Transaction,
): Promise<GlAccount> {
  const acc = await GlAccount.findOne({
    where: { code, [Op.or]: [{ company_id: companyId }, { company_id: null }] },
    order: [["company_id", "DESC"]],
    transaction: t ?? null,
  });
  if (!acc) {
    throw new Error(
      `Tài khoản kế toán "${code}" không tồn tại trong hệ thống tài khoản của công ty này. ` +
      `Vui lòng thiết lập Chart of Accounts trước khi hạch toán.`,
    );
  }
  return acc;
}

/**
 * Tìm nhiều GL Account cùng lúc — throw nếu thiếu bất kỳ tài khoản nào.
 */
export async function requireGlAccounts(
  companyId: number,
  codes: string[],
  t?: Transaction,
): Promise<Record<string, GlAccount>> {
  const options: any = {
    where: {
      code: codes,
      [Op.or]: [{ company_id: companyId }, { company_id: null }],
    },
    order: [["company_id", "DESC"]],
  };
  if (t) options.transaction = t;
  const accounts = await GlAccount.findAll(options);

  const map: Record<string, GlAccount> = {};
  for (const acc of accounts) {
    if (!map[acc.code] || acc.company_id === companyId) {
      map[acc.code] = acc;
    }
  }

  const missing = codes.filter((c) => !map[c]);
  if (missing.length > 0) {
    throw new Error(
      `Thiếu tài khoản kế toán: ${missing.join(", ")}. ` +
      `Vui lòng thiết lập Chart of Accounts cho công ty này.`,
    );
  }

  return map;
}
