/**
 * overduePoAgent.ts
 *
 * Scheduled agent kiểm tra PO quá hạn giao hàng mỗi sáng.
 * Gửi thông báo cho buyer và Purchase Manager.
 */

import { Op } from "sequelize";
import { sequelize } from "../../../config/db";
import { logger } from "../../../config/logger";

export const overduePoAgent = {
  async run(): Promise<{ alertCount: number }> {
    logger.info("[OverduePoAgent] Checking overdue purchase orders...");

    const today = new Date().toISOString().split("T")[0]!;

    const overduePOs: any[] = await sequelize.query(
      `SELECT
         po.id,
         po.po_no,
         po.expected_delivery_date,
         po.branch_id,
         po.buyer_id,
         po.created_by,
         DATEDIFF(CURDATE(), po.expected_delivery_date) AS overdue_days,
         v.name AS supplier_name,
         b.name AS branch_name
       FROM purchase_orders po
       JOIN partners v ON v.id = po.supplier_id
       JOIN branches b ON b.id = po.branch_id
       WHERE po.expected_delivery_date < :today
         AND po.receipt_status NOT IN ('fully_received')
         AND po.status IN ('confirmed', 'partially_received')`,
      {
        replacements: { today },
        type: "SELECT" as any,
      },
    );

    if (overduePOs.length === 0) {
      logger.info("[OverduePoAgent] No overdue POs found.");
      return { alertCount: 0 };
    }

    let alertCount = 0;
    for (const po of overduePOs) {
      await this._sendAlert(po);
      alertCount++;
    }

    logger.info(`[OverduePoAgent] Done: ${alertCount} overdue PO alerts sent.`);
    return { alertCount };
  },

  async _sendAlert(po: any): Promise<void> {
    try {
      const { Notification } =
        await import("../../../core/models/notification.model");

      // Dedup: đã gửi hôm nay chưa
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const alreadySent = await Notification.findOne({
        where: {
          reference_type: "PURCHASE_ORDER",
          reference_id: po.id,
          title: { [Op.like]: "%quá hạn%" },
          created_at: { [Op.gte]: today },
        },
      });
      if (alreadySent) return;

      const recipients = new Set<number>();
      if (po.buyer_id) recipients.add(po.buyer_id);
      if (po.created_by) recipients.add(po.created_by);

      // Lấy Purchase Manager
      const { User } = await import("../../auth/models/user.model");
      const { Role } = await import("../../../core/models/role.model" as any);
      const managers = await User.findAll({
        where: { branch_id: po.branch_id },
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
      managers.forEach((m) => recipients.add(m.id));

      const formattedDate = new Date(
        po.expected_delivery_date,
      ).toLocaleDateString("vi-VN");
      const title = `⚠️ PO ${po.po_no} quá hạn ${po.overdue_days} ngày`;
      const message =
        `Đơn mua hàng **${po.po_no}** từ **${po.supplier_name}** đã quá hạn giao hàng **${po.overdue_days} ngày** ` +
        `(dự kiến: ${formattedDate}). Vui lòng liên hệ nhà cung cấp để xử lý.`;

      for (const userId of recipients) {
        await Notification.create({
          user_id: userId,
          type: "SYSTEM",
          title,
          message,
          reference_type: "PURCHASE_ORDER" as any,
          reference_id: po.id,
          reference_no: po.po_no,
          url: `/purchase/orders/view/${po.id}`,
          is_read: false,
          branch_id: po.branch_id,
        } as any);
      }
    } catch (err: any) {
      logger.error(
        `[OverduePoAgent] _sendAlert failed for PO ${po.po_no}: ${err.message}`,
      );
    }
  },
};
