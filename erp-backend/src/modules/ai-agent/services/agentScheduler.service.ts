/**
 * agentScheduler.service.ts
 *
 * Đăng ký và chạy các scheduled agents bằng node-cron.
 *
 * Lịch mặc định:
 *  - 08:00 sáng hằng ngày → inventory check (tồn kho thấp)
 *  - 09:00 sáng hằng ngày → overdue PO check (PO trễ giao)
 *  - 07:30 sáng hằng ngày → invoice due check (hóa đơn sắp đến hạn)
 */

import cron from "node-cron";
import { inventoryAgent } from "../agents/inventoryAgent";
import { overduePoAgent } from "../agents/overduePoAgent";
import { invoiceDueAgent } from "../agents/invoiceDueAgent";
import { logger } from "../../../config/logger";

export function startAgentScheduler(): void {
  // ── Inventory Check — 08:00 sáng hằng ngày ──────────────────────────────
  cron.schedule(
    "0 8 * * *",
    async () => {
      logger.info("[AgentScheduler] Running inventory check...");
      try {
        const result = await inventoryAgent.run();
        logger.info("[AgentScheduler] Inventory check done:", result);
      } catch (err: any) {
        logger.error(`[AgentScheduler] Inventory check failed: ${err.message}`);
      }
    },
    { timezone: "Asia/Ho_Chi_Minh" },
  );

  // ── Overdue PO Check — 09:00 sáng hằng ngày ─────────────────────────────
  cron.schedule(
    "0 9 * * *",
    async () => {
      logger.info("[AgentScheduler] Running overdue PO check...");
      try {
        const result = await overduePoAgent.run();
        logger.info("[AgentScheduler] Overdue PO check done:", result);
      } catch (err: any) {
        logger.error(
          `[AgentScheduler] Overdue PO check failed: ${err.message}`,
        );
      }
    },
    { timezone: "Asia/Ho_Chi_Minh" },
  );

  // ── Invoice Due Check — 07:30 sáng hằng ngày ────────────────────────────
  cron.schedule(
    "30 7 * * *",
    async () => {
      logger.info("[AgentScheduler] Running invoice due check...");
      try {
        const result = await invoiceDueAgent.run();
        logger.info("[AgentScheduler] Invoice due check done:", result);
      } catch (err: any) {
        logger.error(
          `[AgentScheduler] Invoice due check failed: ${err.message}`,
        );
      }
    },
    { timezone: "Asia/Ho_Chi_Minh" },
  );

  logger.info("[AgentScheduler] All scheduled agents registered.");
}
