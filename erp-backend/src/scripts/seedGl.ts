/**
 * Script chạy tay: thiết lập GL Journal + Chart of Accounts nền tảng.
 * Dùng: npx ts-node src/scripts/seedGl.ts
 *
 * GL Journal/Account được seed global (company_id = null) nên áp dụng cho mọi
 * công ty (kể cả company id = 2) qua cơ chế fallback trong requireGlAccount.
 */
import { sequelize } from "../config/db";
import "../models/index";
import { ensureGlSetup } from "../modules/finance/services/glSetup.service";

(async () => {
  try {
    await sequelize.authenticate();
    const result = await ensureGlSetup();
    console.log("✅ GL setup hoàn tất:", result);
    process.exit(0);
  } catch (err) {
    console.error("❌ GL setup thất bại:", err);
    process.exit(1);
  }
})();
