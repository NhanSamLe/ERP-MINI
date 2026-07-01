import { GlJournal } from "../models/glJournal.model";

/**
 * Danh mục Sổ nhật ký (GL Journal) chuẩn — dùng chung toàn hệ thống.
 * Code tra cứu trong các service hạch toán (arInvoice, salesReturn, apPayment...).
 */
const DEFAULT_JOURNALS: { code: string; name: string }[] = [
  { code: "SALES", name: "Nhật ký bán hàng" },
  { code: "PURCHASE", name: "Nhật ký mua hàng" },
  { code: "CASH", name: "Nhật ký thu chi tiền mặt" },
  { code: "BANK", name: "Nhật ký ngân hàng" },
];

/**
 * Đảm bảo hệ thống đã có GL Journal nền tảng để hạch toán.
 * Idempotent: chỉ tạo journal còn THIẾU, an toàn khi gọi nhiều lần.
 *
 * GL Journal có code unique toàn hệ thống → seed global (company_id = null),
 * dùng chung cho mọi công ty. Chart of Accounts (gl_accounts) KHÔNG seed ở đây
 * vì mỗi công ty đã có hệ thống tài khoản riêng được tạo lúc khởi tạo.
 *
 * Gọi khi hoàn tất onboarding công ty (completeSetup) hoặc chạy thủ công.
 */
export async function ensureGlSetup(): Promise<{ journalsCreated: number }> {
  let journalsCreated = 0;

  for (const j of DEFAULT_JOURNALS) {
    const [, created] = await GlJournal.findOrCreate({
      where: { code: j.code },
      defaults: { code: j.code, name: j.name, company_id: null } as any,
    });
    if (created) journalsCreated++;
  }

  return { journalsCreated };
}
