/**
 * purchaseNotification.service.ts
 *
 * Gửi thông báo cho các sự kiện nghiệp vụ Purchase module.
 *
 * Hai loại:
 *  A. Event-based  — gọi trực tiếp từ service khi action xảy ra (có io)
 *  B. Scheduled    — gọi từ cron job (không có io, chỉ lưu DB)
 *
 * Cả hai đều dùng hàm sendDirect() để lưu DB, sau đó emit socket nếu có io.
 */

import { Notification } from "../../../core/models/notification.model";
import { User } from "../../auth/models/user.model";
import { Op } from "sequelize";
import { Server as SocketIOServer } from "socket.io";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DirectNotificationParams {
  userIds: number[];
  title: string;
  message: string;
  referenceType: string;
  referenceId: number;
  referenceNo: string;
  url: string;
  branchId: number;
  io?: SocketIOServer | null;
}

// ─── Helper: lưu DB + emit socket ─────────────────────────────────────────────

async function sendDirect(params: DirectNotificationParams): Promise<void> {
  const {
    userIds,
    title,
    message,
    referenceType,
    referenceId,
    referenceNo,
    url,
    branchId,
    io,
  } = params;

  if (!userIds.length) return;

  const notifications = await Promise.all(
    userIds.map((userId) =>
      Notification.create({
        user_id: userId,
        type: "SYSTEM",
        title,
        message,
        reference_type: referenceType as any,
        reference_id: referenceId,
        reference_no: referenceNo,
        url,
        is_read: false,
        branch_id: branchId,
      }),
    ),
  );

  // Emit real-time nếu có io
  if (io) {
    notifications.forEach((n) => {
      io.to(`user:${n.user_id}`).emit("new_notification", {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        reference_type: n.reference_type,
        reference_id: n.reference_id,
        reference_no: n.reference_no,
        url: n.url,
        is_read: n.is_read,
        created_at: n.created_at,
      });
    });
  }
}

// ─── Helper: lấy user IDs theo role trong branch ──────────────────────────────

async function getUserIdsByRole(
  branchId: number,
  roleCodes: string[],
): Promise<number[]> {
  const { Role } = await import("../../auth/models/role.model");
  const users = await User.findAll({
    where: { branch_id: branchId },
    include: [
      {
        model: Role,
        as: "role",
        where: { code: { [Op.in]: roleCodes } },
        attributes: [],
      },
    ],
    attributes: ["id"],
  });
  return users.map((u) => u.id);
}

// ─── Purchase Notification Service ────────────────────────────────────────────

export const purchaseNotificationService = {
  // ─── EVENT-BASED (Triggers 5, 6, 7) ────────────────────────────────────────

  /**
   * Trigger 5: PRA được duyệt → thông báo người tạo PRA tạo Purchase Return
   */
  async onPraApproved(params: {
    praId: number;
    praNo: string;
    branchId: number;
    createdById: number;
    io?: SocketIOServer | null;
  }): Promise<void> {
    try {
      await sendDirect({
        userIds: [params.createdById],
        title: `PRA ${params.praNo} đã được duyệt`,
        message: `Yêu cầu trả hàng ${params.praNo} đã được phê duyệt. Vui lòng tạo Purchase Return để tiến hành trả hàng cho nhà cung cấp.`,
        referenceType: "PURCHASE_ORDER",
        referenceId: params.praId,
        referenceNo: params.praNo,
        url: `/purchase/return-authorizations/${params.praId}`,
        branchId: params.branchId,
        io: params.io,
      });
    } catch (err: any) {
      console.error(
        `[PurchaseNotification] onPraApproved failed: ${err.message}`,
      );
    }
  },

  /**
   * Trigger 6: Purchase Return confirmed → thông báo kế toán tạo Debit Note
   */
  async onReturnConfirmed(params: {
    returnId: number;
    returnNo: string;
    branchId: number;
    io?: SocketIOServer | null;
  }): Promise<void> {
    try {
      const accountantIds = await getUserIdsByRole(params.branchId, [
        "ACCOUNT",
        "CHACC",
      ]);
      await sendDirect({
        userIds: accountantIds,
        title: `Return ${params.returnNo} NCC đã xác nhận`,
        message: `Nhà cung cấp đã xác nhận nhận hàng trả cho phiếu ${params.returnNo}. Vui lòng tạo AP Debit Note để giảm công nợ phải trả.`,
        referenceType: "AP_INVOICE",
        referenceId: params.returnId,
        referenceNo: params.returnNo,
        url: `/purchase/returns/${params.returnId}`,
        branchId: params.branchId,
        io: params.io,
      });
    } catch (err: any) {
      console.error(
        `[PurchaseNotification] onReturnConfirmed failed: ${err.message}`,
      );
    }
  },

  /**
   * Trigger 7: AP Debit Note posted → thông báo kế toán + buyer
   */
  async onDebitNotePosted(params: {
    debitNoteId: number;
    debitNoteNo: string;
    totalAfterTax: number;
    branchId: number;
    buyerId?: number | null;
    io?: SocketIOServer | null;
  }): Promise<void> {
    try {
      const accountantIds = await getUserIdsByRole(params.branchId, [
        "ACCOUNT",
        "CHACC",
      ]);
      const recipientIds = [
        ...new Set([
          ...accountantIds,
          ...(params.buyerId ? [params.buyerId] : []),
        ]),
      ];

      const amount = Number(params.totalAfterTax).toLocaleString("vi-VN");
      await sendDirect({
        userIds: recipientIds,
        title: `Debit Note ${params.debitNoteNo} đã được post`,
        message: `AP Debit Note ${params.debitNoteNo} (${amount} VND) đã được ghi sổ. Công nợ phải trả nhà cung cấp đã được giảm tương ứng.`,
        referenceType: "AP_INVOICE",
        referenceId: params.debitNoteId,
        referenceNo: params.debitNoteNo,
        url: `/purchase/debit-notes/${params.debitNoteId}`,
        branchId: params.branchId,
        io: params.io,
      });
    } catch (err: any) {
      console.error(
        `[PurchaseNotification] onDebitNotePosted failed: ${err.message}`,
      );
    }
  },

  // ─── SCHEDULED (Triggers 1, 2, 3, 4) — gọi từ cron, không có io ───────────

  /**
   * Trigger 1: RFQ sắp hết hạn (valid_until còn <= 3 ngày)
   * Gửi cho buyer_id của từng RFQ
   */
  async checkRfqExpiringSoon(): Promise<void> {
    try {
      const { PurchaseRfq } = await import("../models/purchaseRfq.model");
      const today = new Date();
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);

      const rfqs = await PurchaseRfq.findAll({
        where: {
          status: { [Op.in]: ["sent", "received"] },
          valid_until: {
            [Op.between]: [
              today.toISOString().split("T")[0]!,
              in3Days.toISOString().split("T")[0]!,
            ],
          },
        },
        attributes: ["id", "rfq_no", "valid_until", "branch_id", "buyer_id"],
      });

      for (const rfq of rfqs) {
        if (!rfq.buyer_id) continue;

        // Tránh gửi trùng: kiểm tra đã có notification hôm nay chưa
        const alreadySent = await Notification.findOne({
          where: {
            reference_type: "PURCHASE_ORDER",
            reference_id: rfq.id,
            reference_no: rfq.rfq_no,
            user_id: rfq.buyer_id,
            created_at: { [Op.gte]: new Date(today.toDateString()) },
          },
        });
        if (alreadySent) continue;

        await sendDirect({
          userIds: [rfq.buyer_id],
          title: `RFQ ${rfq.rfq_no} sắp hết hạn`,
          message: `Báo giá ${rfq.rfq_no} sẽ hết hạn vào ${rfq.valid_until}. Vui lòng xem xét và tạo PO hoặc gia hạn.`,
          referenceType: "PURCHASE_ORDER",
          referenceId: rfq.id,
          referenceNo: rfq.rfq_no,
          url: `/purchase/rfqs/${rfq.id}`,
          branchId: rfq.branch_id,
          io: null,
        });
      }
    } catch (err: any) {
      console.error(
        `[PurchaseNotification] checkRfqExpiringSoon failed: ${err.message}`,
      );
    }
  },

  /**
   * Trigger 2: PO quá hạn giao hàng (expected_delivery_date < today, chưa fully_received)
   * Gửi cho buyer_id + PURCHASEMANAGER trong branch
   */
  async checkPoOverdueDelivery(): Promise<void> {
    try {
      const { PurchaseOrder } = await import("../models/purchaseOrder.model");
      const today = new Date().toISOString().split("T")[0]!;

      const pos = await PurchaseOrder.findAll({
        where: {
          expected_delivery_date: { [Op.lt]: today },
          receipt_status: { [Op.notIn]: ["fully_received"] },
          status: { [Op.in]: ["confirmed", "partially_received"] },
        } as any,
        attributes: [
          "id",
          "po_no",
          "expected_delivery_date",
          "branch_id",
          "buyer_id",
        ],
      });

      for (const po of pos) {
        const recipientIds: number[] = [];
        if ((po as any).buyer_id) recipientIds.push((po as any).buyer_id);

        const managerIds = await getUserIdsByRole(po.branch_id!, [
          "PURCHASEMANAGER",
        ]);
        recipientIds.push(...managerIds);

        const uniqueIds = [...new Set(recipientIds)];
        if (!uniqueIds.length) continue;

        // Tránh gửi trùng hôm nay
        const alreadySent = await Notification.findOne({
          where: {
            reference_type: "PURCHASE_ORDER",
            reference_id: po.id,
            user_id: { [Op.in]: uniqueIds },
            created_at: { [Op.gte]: new Date(new Date().toDateString()) },
          },
        });
        if (alreadySent) continue;

        const overdueDays = Math.floor(
          (new Date().getTime() -
            new Date((po as any).expected_delivery_date).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        await sendDirect({
          userIds: uniqueIds,
          title: `PO ${po.po_no} quá hạn giao hàng`,
          message: `Đơn mua hàng ${po.po_no} đã quá hạn giao hàng ${overdueDays} ngày (dự kiến: ${(po as any).expected_delivery_date}). Vui lòng liên hệ nhà cung cấp để xử lý.`,
          referenceType: "PURCHASE_ORDER",
          referenceId: po.id!,
          referenceNo: po.po_no,
          url: `/purchase-orders/view/${po.id}`,
          branchId: po.branch_id!,
          io: null,
        });
      }
    } catch (err: any) {
      console.error(
        `[PurchaseNotification] checkPoOverdueDelivery failed: ${err.message}`,
      );
    }
  },

  /**
   * Trigger 3: AP Invoice sắp đến hạn thanh toán (due_date còn <= 7 ngày, chưa paid)
   * Gửi cho ACCOUNT + CHACC trong branch
   */
  async checkApInvoiceDueSoon(): Promise<void> {
    try {
      const { ApInvoice } = await import("../models/apInvoice.model");
      const today = new Date();
      const in7Days = new Date();
      in7Days.setDate(in7Days.getDate() + 7);

      const invoices = await ApInvoice.findAll({
        where: {
          due_date: {
            [Op.between]: [today, in7Days],
          },
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

      for (const inv of invoices) {
        const accountantIds = await getUserIdsByRole(inv.branch_id, [
          "ACCOUNT",
          "CHACC",
        ]);
        if (!accountantIds.length) continue;

        // Tránh gửi trùng hôm nay
        const alreadySent = await Notification.findOne({
          where: {
            reference_type: "AP_INVOICE",
            reference_id: inv.id,
            user_id: { [Op.in]: accountantIds },
            created_at: { [Op.gte]: new Date(today.toDateString()) },
          },
        });
        if (alreadySent) continue;

        const remaining =
          Number(inv.total_after_tax ?? 0) - Number(inv.paid_amount ?? 0);
        const remainingStr = remaining.toLocaleString("vi-VN");
        const dueDate =
          inv.due_date instanceof Date
            ? inv.due_date.toISOString().split("T")[0]
            : String(inv.due_date);

        await sendDirect({
          userIds: accountantIds,
          title: `Hóa đơn ${inv.invoice_no} sắp đến hạn TT`,
          message: `Hóa đơn ${inv.invoice_no} đến hạn thanh toán vào ${dueDate}. Còn phải trả: ${remainingStr} VND.`,
          referenceType: "AP_INVOICE",
          referenceId: inv.id,
          referenceNo: inv.invoice_no,
          url: `/purchase/invoices/${inv.id}`,
          branchId: inv.branch_id,
          io: null,
        });
      }
    } catch (err: any) {
      console.error(
        `[PurchaseNotification] checkApInvoiceDueSoon failed: ${err.message}`,
      );
    }
  },

  /**
   * Trigger 4: AP Payment chưa phân bổ sau 24h (allocation_status = unallocated)
   * Gửi cho ACCOUNT + CHACC trong branch
   */
  async checkUnallocatedPayments(): Promise<void> {
    try {
      const { ApPayment } = await import("../models/apPayment.model");
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      const payments = await ApPayment.findAll({
        where: {
          allocation_status: "unallocated",
          status: "posted",
          approval_status: "approved",
          created_at: { [Op.lte]: yesterday },
        } as any,
        attributes: ["id", "payment_no", "amount", "branch_id"],
      });

      for (const pay of payments) {
        const accountantIds = await getUserIdsByRole(pay.branch_id, [
          "ACCOUNT",
          "CHACC",
        ]);
        if (!accountantIds.length) continue;

        // Tránh gửi trùng hôm nay
        const today = new Date();
        const alreadySent = await Notification.findOne({
          where: {
            reference_type: "AP_PAYMENT",
            reference_id: pay.id,
            user_id: { [Op.in]: accountantIds },
            created_at: { [Op.gte]: new Date(today.toDateString()) },
          },
        });
        if (alreadySent) continue;

        const amountStr = Number(pay.amount ?? 0).toLocaleString("vi-VN");

        await sendDirect({
          userIds: accountantIds,
          title: `Payment ${pay.payment_no} chưa được phân bổ`,
          message: `Phiếu chi ${pay.payment_no} (${amountStr} VND) đã được duyệt hơn 24 giờ nhưng chưa được phân bổ vào hóa đơn nào. Vui lòng xử lý.`,
          referenceType: "AP_PAYMENT",
          referenceId: pay.id,
          referenceNo: pay.payment_no,
          url: `/purchase/payments/${pay.id}`,
          branchId: pay.branch_id,
          io: null,
        });
      }
    } catch (err: any) {
      console.error(
        `[PurchaseNotification] checkUnallocatedPayments failed: ${err.message}`,
      );
    }
  },
};
