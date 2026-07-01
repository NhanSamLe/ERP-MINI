/**
 * invoiceDueAgent.ts
 *
 * Scheduled agent kiểm tra AP Invoice sắp đến hạn thanh toán mỗi sáng.
 * Gửi thông báo cho ACCOUNT và CHACC.
 */

import { Op } from "sequelize";
import { logger } from "../../../config/logger";

export const invoiceDueAgent = {
  async run(): Promise<{ alertCount: number }> {
    logger.info("[InvoiceDueAgent] Checking invoices due soon...");

    try {
      const { ApInvoice } =
        await import("../../purchase/models/apInvoice.model");
      const { Notification } =
        await import("../../../core/models/notification.model");
      const { User } = await import("../../auth/models/user.model");
      const { Role } = await import("../../../core/models/role.model" as any);

      const today = new Date();
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);

      const invoices = await ApInvoice.findAll({
        where: {
          due_date: { [Op.between]: [today, in3Days] },
          status: { [Op.notIn]: ["paid", "cancelled"] },
          approval_status: "approved",
        },
        attributes: [
          "id",
          "invoice_no",
          "due_date",
          "total_after_tax",
          "paid_amount",
          "branch_id",
        ],
      });

      if (invoices.length === 0) {
        logger.info("[InvoiceDueAgent] No invoices due soon.");
        return { alertCount: 0 };
      }

      let alertCount = 0;

      for (const inv of invoices) {
        // Lấy kế toán trong branch
        const accountants = await User.findAll({
          where: { branch_id: inv.branch_id },
          include: [
            {
              model: Role,
              as: "role",
              where: { code: { [Op.in]: ["ACCOUNT", "CHACC"] } },
              attributes: [],
            },
          ],
          attributes: ["id"],
        });

        if (accountants.length === 0) continue;

        // Dedup: đã gửi hôm nay chưa
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const alreadySent = await Notification.findOne({
          where: {
            reference_type: "AP_INVOICE",
            reference_id: inv.id,
            title: { [Op.like]: "%đến hạn%" },
            created_at: { [Op.gte]: todayStart },
          },
        });
        if (alreadySent) continue;

        const remaining =
          Number(inv.total_after_tax ?? 0) - Number(inv.paid_amount ?? 0);
        const remainingStr = remaining.toLocaleString("vi-VN");
        const dueDate =
          inv.due_date instanceof Date
            ? inv.due_date.toLocaleDateString("vi-VN")
            : String(inv.due_date);

        const daysUntilDue = Math.ceil(
          (new Date(inv.due_date!).getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        for (const acc of accountants) {
          await Notification.create({
            user_id: acc.id,
            type: "SYSTEM",
            title: `💰 Hóa đơn ${inv.invoice_no} đến hạn trong ${daysUntilDue} ngày`,
            message:
              `Hóa đơn **${inv.invoice_no}** đến hạn thanh toán vào **${dueDate}** ` +
              `(còn ${daysUntilDue} ngày). Số tiền còn phải trả: **${remainingStr} VND**.`,
            reference_type: "AP_INVOICE" as any,
            reference_id: inv.id,
            reference_no: inv.invoice_no,
            url: `/purchase/invoices/${inv.id}`,
            is_read: false,
            branch_id: inv.branch_id,
          } as any);
        }

        alertCount++;
      }

      logger.info(
        `[InvoiceDueAgent] Done: ${alertCount} invoice due alerts sent.`,
      );
      return { alertCount };
    } catch (err: any) {
      logger.error(`[InvoiceDueAgent] run failed: ${err.message}`);
      return { alertCount: 0 };
    }
  },
};
