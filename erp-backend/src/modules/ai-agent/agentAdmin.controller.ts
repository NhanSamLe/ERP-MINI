/**
 * agentAdmin.controller.ts
 *
 * API endpoints để trigger agents thủ công — dùng cho demo và debugging.
 * Chỉ ADMIN mới được gọi.
 */

import { Request, Response } from "express";
import { inventoryAgent } from "./agents/inventoryAgent";
import { overduePoAgent } from "./agents/overduePoAgent";
import { invoiceDueAgent } from "./agents/invoiceDueAgent";
import { logger } from "../../config/logger";

export const agentAdminController = {
  /** POST /api/ai-agent/run/inventory — trigger inventory check ngay */
  async runInventory(_req: Request, res: Response): Promise<void> {
    try {
      logger.info("[AgentAdmin] Manual trigger: inventory check");
      const result = await inventoryAgent.run();
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /** POST /api/ai-agent/run/overdue-po — trigger overdue PO check ngay */
  async runOverduePo(_req: Request, res: Response): Promise<void> {
    try {
      logger.info("[AgentAdmin] Manual trigger: overdue PO check");
      const result = await overduePoAgent.run();
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /** POST /api/ai-agent/run/invoice-due — trigger invoice due check ngay */
  async runInvoiceDue(_req: Request, res: Response): Promise<void> {
    try {
      logger.info("[AgentAdmin] Manual trigger: invoice due check");
      const result = await invoiceDueAgent.run();
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /** POST /api/ai-agent/run/all — trigger tất cả agents */
  async runAll(_req: Request, res: Response): Promise<void> {
    try {
      logger.info("[AgentAdmin] Manual trigger: all agents");
      const [inventory, overduePo, invoiceDue] = await Promise.allSettled([
        inventoryAgent.run(),
        overduePoAgent.run(),
        invoiceDueAgent.run(),
      ]);
      res.json({
        success: true,
        results: {
          inventory:
            inventory.status === "fulfilled"
              ? inventory.value
              : { error: (inventory as any).reason?.message },
          overdue_po:
            overduePo.status === "fulfilled"
              ? overduePo.value
              : { error: (overduePo as any).reason?.message },
          invoice_due:
            invoiceDue.status === "fulfilled"
              ? invoiceDue.value
              : { error: (invoiceDue as any).reason?.message },
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
