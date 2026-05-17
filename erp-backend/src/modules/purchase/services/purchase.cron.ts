/**
 * purchase.cron.ts
 *
 * Scheduled notification triggers cho Purchase module.
 * Chạy mỗi ngày lúc 8:00 sáng.
 *
 * Triggers:
 *  1. RFQ sắp hết hạn (valid_until còn <= 3 ngày)
 *  2. PO quá hạn giao hàng (expected_delivery_date < today)
 *  3. AP Invoice sắp đến hạn TT (due_date còn <= 7 ngày)
 *  4. AP Payment chưa phân bổ sau 24h
 */

import cron from "node-cron";
import { purchaseNotificationService } from "./purchaseNotification.service";
import { logger } from "../../../config/logger";

// Chạy mỗi ngày lúc 8:00 sáng
cron.schedule("0 8 * * *", async () => {
  logger.info("[PurchaseCron] Running daily purchase notification checks...");

  // Trigger 1 — RFQ sắp hết hạn
  try {
    await purchaseNotificationService.checkRfqExpiringSoon();
    logger.info("[PurchaseCron] ✅ checkRfqExpiringSoon done");
  } catch (err: any) {
    logger.error(`[PurchaseCron] ❌ checkRfqExpiringSoon: ${err.message}`);
  }

  // Trigger 2 — PO quá hạn giao hàng
  try {
    await purchaseNotificationService.checkPoOverdueDelivery();
    logger.info("[PurchaseCron] ✅ checkPoOverdueDelivery done");
  } catch (err: any) {
    logger.error(`[PurchaseCron] ❌ checkPoOverdueDelivery: ${err.message}`);
  }

  // Trigger 3 — AP Invoice sắp đến hạn TT
  try {
    await purchaseNotificationService.checkApInvoiceDueSoon();
    logger.info("[PurchaseCron] ✅ checkApInvoiceDueSoon done");
  } catch (err: any) {
    logger.error(`[PurchaseCron] ❌ checkApInvoiceDueSoon: ${err.message}`);
  }

  // Trigger 4 — AP Payment chưa phân bổ
  try {
    await purchaseNotificationService.checkUnallocatedPayments();
    logger.info("[PurchaseCron] ✅ checkUnallocatedPayments done");
  } catch (err: any) {
    logger.error(`[PurchaseCron] ❌ checkUnallocatedPayments: ${err.message}`);
  }

  logger.info("[PurchaseCron] Daily purchase notification checks completed.");
});
