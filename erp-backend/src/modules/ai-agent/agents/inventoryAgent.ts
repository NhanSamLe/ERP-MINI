/**
 * inventoryAgent.ts
 *
 * Scheduled agent kiểm tra tồn kho thấp mỗi sáng.
 * Gửi thông báo cho Purchase Manager với danh sách sản phẩm cần đặt thêm.
 */

import { Op } from "sequelize";
import { QueryTypes } from "sequelize";
import { sequelize } from "../../../config/db";
import { logger } from "../../../config/logger";

interface LowStockItem {
  product_id: number;
  product_name: string;
  sku: string;
  current_quantity: number;
  reorder_point: number;
  reorder_qty: number;
  branch_id: number;
  branch_name: string;
}

interface PurchaseSuggestion extends LowStockItem {
  suggested_supplier?: string;
  suggested_price?: number;
  estimated_total?: number;
}

export const inventoryAgent = {
  /**
   * Chạy kiểm tra tồn kho thấp cho toàn bộ chi nhánh.
   * Trả về danh sách sản phẩm cần đặt và thông báo đã gửi.
   */
  async run(): Promise<{ branchCount: number; alertCount: number }> {
    logger.info("[InventoryAgent] Starting morning inventory check...");

    const lowStockItems = await this._getLowStockItems();
    if (lowStockItems.length === 0) {
      logger.info("[InventoryAgent] No low stock items found.");
      return { branchCount: 0, alertCount: 0 };
    }

    // Nhóm theo branch
    const byBranch = new Map<number, LowStockItem[]>();
    for (const item of lowStockItems) {
      const list = byBranch.get(item.branch_id) ?? [];
      list.push(item);
      byBranch.set(item.branch_id, list);
    }

    let alertCount = 0;
    for (const [branchId, items] of byBranch) {
      await this._sendAlert(branchId, items);
      alertCount += items.length;
    }

    logger.info(
      `[InventoryAgent] Done: ${alertCount} low-stock alerts sent across ${byBranch.size} branches.`,
    );
    return { branchCount: byBranch.size, alertCount };
  },

  async _getLowStockItems(): Promise<LowStockItem[]> {
    try {
      const rows = await sequelize.query<LowStockItem>(
        `SELECT
           p.id          AS product_id,
           p.name        AS product_name,
           p.sku,
           COALESCE(SUM(sb.quantity), 0) AS current_quantity,
           COALESCE(p.reorder_point, 0)  AS reorder_point,
           COALESCE(p.reorder_qty, 10)   AS reorder_qty,
           b.id          AS branch_id,
           b.name        AS branch_name
         FROM products p
         JOIN stock_balances sb ON sb.product_id = p.id
         JOIN branches b        ON b.id = sb.branch_id
         WHERE p.status = 'active'
           AND p.product_type = 'storable'
           AND p.reorder_point IS NOT NULL
           AND p.reorder_point > 0
         GROUP BY p.id, p.name, p.sku, p.reorder_point, p.reorder_qty, b.id, b.name
         HAVING COALESCE(SUM(sb.quantity), 0) < COALESCE(p.reorder_point, 0)`,
        { type: QueryTypes.SELECT },
      );
      return rows;
    } catch (err: any) {
      logger.error(
        `[InventoryAgent] Failed to query low stock: ${err.message}`,
      );
      return [];
    }
  },

  async _sendAlert(branchId: number, items: LowStockItem[]): Promise<void> {
    try {
      // Dynamic import để tránh circular dependency
      const { notificationService } =
        await import("../../../core/services/notification.service");
      const { User } = await import("../../auth/models/user.model");
      const { Role } = await import("../../../core/models/role.model" as any);

      // Lấy Purchase Manager trong branch
      const managers = await User.findAll({
        where: { branch_id: branchId },
        include: [
          {
            model: Role,
            as: "role",
            where: { code: "PURCHASEMANAGER" },
            attributes: [],
          },
        ],
        attributes: ["id"],
      });

      if (managers.length === 0) return;

      const lines = items
        .map(
          (i) =>
            `• ${i.product_name} (${i.sku}): còn **${i.current_quantity}** (ngưỡng: ${i.reorder_point})`,
        )
        .join("\n");

      const branchName = items[0]?.branch_name ?? `Chi nhánh ${branchId}`;
      const message = `📦 **Báo cáo tồn kho thấp — ${branchName}**\n\n${lines}\n\nVui lòng tạo đơn mua hàng để bổ sung.`;

      for (const manager of managers) {
        // Kiểm tra đã gửi hôm nay chưa (dedup)
        const { Notification } =
          await import("../../../core/models/notification.model");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const alreadySent = await Notification.findOne({
          where: {
            user_id: manager.id,
            reference_type: "INVENTORY_ALERT",
            branch_id: branchId,
            created_at: { [Op.gte]: today },
          },
        });
        if (alreadySent) continue;

        await Notification.create({
          user_id: manager.id,
          type: "SYSTEM",
          title: `📦 Tồn kho thấp: ${items.length} sản phẩm`,
          message,
          reference_type: "INVENTORY_ALERT" as any,
          reference_id: branchId,
          reference_no: `INVENTORY-${branchId}`,
          url: "/inventory/stock",
          is_read: false,
          branch_id: branchId,
        } as any);
      }
    } catch (err: any) {
      logger.error(
        `[InventoryAgent] _sendAlert failed for branch ${branchId}: ${err.message}`,
      );
    }
  },
};
