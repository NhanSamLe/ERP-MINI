import { Role } from "../../../core/types/enum";
import { ApPayment } from "../models/apPayment.model";
import { User } from "../../auth/models/user.model";
import { Branch } from "../../company/models/branch.model";
import { Transaction } from "sequelize";
import { GlJournal } from "../../finance/models/glJournal.model";
import { GlEntry } from "../../finance/models/glEntry.model";
import { GlEntryLine } from "../../finance/models/glEntryLine.model";
import {
  ApInvoice,
  ApPaymentAllocation,
  Partner,
  sequelize,
} from "../../../models";
import { QueryTypes } from "sequelize";
import { notificationService } from "../../../core/services/notification.service";

export const apPaymentService = {
  async getAll(query: any, user: any) {
    const { status, approval_status } = query;

    const where: any = {
      branch_id: user.branch_id,
    };

    if (user.role === Role.ACCOUNT) {
      where.created_by = user.id;
    }

    if (status) where.status = status;
    if (approval_status) where.approval_status = approval_status;

    return ApPayment.findAll({
      where,
      include: [
        { model: Branch, as: "branch" },
        {
          model: Partner,
          as: "supplier",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "email", "phone", "avatar_url"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "full_name", "email", "phone", "avatar_url"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
  },

  async getById(id: number, user: any) {
    const where: any = {
      id,
      branch_id: user.branch_id,
    };

    if (user.role === Role.ACCOUNT) {
      where.created_by = user.id;
    }

    return ApPayment.findOne({
      where,
      include: [
        { model: Branch, as: "branch" },
        {
          model: Partner,
          as: "supplier",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "email", "phone", "avatar_url"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "full_name", "email", "phone", "avatar_url"],
        },
      ],
    });
  },

  async create(payload: any, user: any) {
    if (user.role !== Role.ACCOUNT) {
      throw {
        status: 403,
        message: "You do not have permission to create AP Payment",
      };
    }

    if (!payload.supplier_id) {
      throw { status: 400, message: "Supplier is required" };
    }

    if (!payload.amount || payload.amount <= 0) {
      throw { status: 400, message: "Amount must be greater than zero" };
    }

    const paymentNo = `PAY-${Date.now()}`;

    const payment = await ApPayment.create({
      payment_no: paymentNo,
      supplier_id: payload.supplier_id,
      payment_date: payload.payment_date || new Date(),
      amount: payload.amount,
      method: payload.method,
      status: "draft",
      approval_status: "draft",
      created_by: user.id,
      approved_by: null,
      submitted_at: null,
      approved_at: null,
      reject_reason: null,
      branch_id: user.branch_id,
    });

    return this.getById(payment.id, user);
  },

  async submitForApproval(id: number, user: any, app?: any) {
    const payment = await this.getById(id, user);
    if (!payment) throw new Error("AP Payment not found");

    if (payment.created_by !== user.id) {
      throw new Error("Only creator can submit payment");
    }

    if (payment.status !== "draft") {
      throw new Error("Only draft payment can be submitted");
    }

    payment.approval_status = "waiting_approval";
    payment.submitted_at = new Date();

    await payment.save();

    // Gửi thông báo
    if (app) {
      const io = app.get("io");
      await notificationService.createNotification({
        type: "SUBMIT",
        referenceType: "AP_PAYMENT",
        referenceId: payment.id!,
        referenceNo: payment.payment_no!,
        branchId: payment.branch_id!,
        submitterId: user.id,
        submitterName: user.fullName || user.username,
        io,
      });
    }

    return this.getById(payment.id, user);
  },

  async approve(id: number, user: any) {
    if (user.role !== Role.CHACC) throw new Error("Only Chief Accountant can approve");

    const t: Transaction = await sequelize.transaction();
    try {
      const payment = await ApPayment.findByPk(id, { transaction: t });
      if (!payment) throw new Error("AP Payment not found");

      if (payment.branch_id !== user.branch_id)
        throw new Error("You cannot approve payment from another branch");

      if (payment.approval_status !== "waiting_approval")
        throw new Error("Payment is not waiting for approval");

      // 1) update trạng thái payment
      await payment.update(
        {
          approval_status: "approved",
          status: "posted",
          approved_by: user.id,
          approved_at: new Date(),
          reject_reason: null,
        },
        { transaction: t }
      );

      // 2) Xác định account Có theo method
      // giả sử: cash->111 (id=1), bank/transfer->112 (id=2)
      const creditAccountId =
        payment.method === "cash"
          ? 1  // 111
          : 2; // 112

      const debitAccountId = 3; // 331 - Phải trả NCC (bạn mapping id theo hệ thống bạn)

      // 3) Journal: CASH/BANK
      const journalCode = payment.method === "cash" ? "CASH" : "BANK";
      const journal = await GlJournal.findOne({ where: { code: journalCode }, transaction: t });
      if (!journal) throw new Error(`${journalCode} journal not found`);

      const entryDate: Date = payment.payment_date || new Date();
      const amount = Number(payment.amount || 0);
      if (amount <= 0) throw new Error("Payment amount must be > 0");

      // 4) Create GL Entry
      const entry = await GlEntry.create(
        {
          journal_id: journal.id,
          entry_no: `GL-AP-PAY-${payment.id}`,
          entry_date: entryDate,
          reference_type: "ap_payment",
          reference_id: payment.id,
          memo: `AP Payment ${payment.payment_no}`,
          status: "posted",
        },
        { transaction: t }
      );

      const supplierId = payment.supplier_id as number | undefined;

      // 5) Create GL Lines: Nợ 331 / Có 111-112
      const lineDebit: any = {
        entry_id: entry.id,
        account_id: debitAccountId,
        debit: amount,
        credit: 0,
      };
      const lineCredit: any = {
        entry_id: entry.id,
        account_id: creditAccountId,
        debit: 0,
        credit: amount,
      };

      if (supplierId) {
        lineDebit.partner_id = supplierId;
        lineCredit.partner_id = supplierId;
      }

      await GlEntryLine.bulkCreate([lineDebit, lineCredit], { transaction: t });

      await t.commit();
      return this.getById(payment.id, user);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async reject(id: number, reason: string, user: any, app?: any) {
    if (user.role !== Role.CHACC) {
      throw new Error("Only Chief Accountant can reject");
    }

    const payment = await ApPayment.findByPk(id);
    if (!payment) throw new Error("AP Payment not found");

    if (payment.branch_id !== user.branch_id) {
      throw new Error("You cannot reject payment from another branch");
    }

    if (payment.approval_status !== "waiting_approval") {
      throw new Error("Payment is not waiting for approval");
    }

    payment.approval_status = "rejected";
    payment.status = "cancelled";
    payment.approved_by = user.id;
    payment.approved_at = new Date();
    payment.reject_reason = reason;

    await payment.save();

    // Gửi thông báo
    if (app && payment.created_by) {
      const io = app.get("io");
      await notificationService.createNotification({
        type: "REJECT",
        referenceType: "AP_PAYMENT",
        referenceId: payment.id!,
        referenceNo: payment.payment_no!,
        branchId: payment.branch_id!,
        submitterId: payment.created_by,
        approverName: user.fullName || user.username,
        rejectReason: reason,
        io,
      });
    }

    return this.getById(payment.id, user);
  },

  async getAvailableAmount(id: number, user: any) {
    const payment = await ApPayment.findOne({
      where: {
        id,
        branch_id: user.branch_id,
        status: "posted",
        approval_status: "approved",
      },
    });

    if (!payment) {
      throw new Error("Payment not available for allocation");
    }

    const [result]: any = await sequelize.query(
      `
    SELECT
      ap.amount - COALESCE(SUM(apa.applied_amount), 0) AS available_amount
    FROM ap_payments ap
    LEFT JOIN ap_payment_allocations apa
      ON apa.payment_id = ap.id
    WHERE ap.id = ?
    GROUP BY ap.id
    `,
      { replacements: [id], type: "SELECT" }
    );

    return {
      payment_id: id,
      available_amount: Number(result.available_amount),
    };
  },

  async getUnpaidInvoices(paymentId: number, user: any) {
    const payment = await ApPayment.findOne({
      where: {
        id: paymentId,
        branch_id: user.branch_id,
        status: "posted",
        approval_status: "approved",
      },
    });

    if (!payment) {
      throw new Error("Payment not available for allocation");
    }

    const rows = await sequelize.query(
      `
  SELECT
    ai.id,
    ai.invoice_no,
    ai.total_after_tax,
    COALESCE(SUM(apa.applied_amount), 0) AS allocated_amount,
    ai.total_after_tax - COALESCE(SUM(apa.applied_amount), 0) AS unpaid_amount
  FROM ap_invoices ai
  JOIN purchase_orders po ON po.id = ai.po_id
  LEFT JOIN ap_payment_allocations apa ON apa.ap_invoice_id = ai.id
  WHERE ai.status = 'posted'
    AND po.supplier_id = ?
  GROUP BY ai.id
  HAVING unpaid_amount > 0
  `,
      {
        replacements: [payment.supplier_id],
        type: QueryTypes.SELECT,
      }
    );

    return rows;
  },

  async allocate(
    paymentId: number,
    allocations: { invoice_id: number; amount: number }[],
    user: any
  ) {
    const t = await sequelize.transaction();

    try {
      const payment = await ApPayment.findOne({
        where: {
          id: paymentId,
          branch_id: user.branch_id,
          status: "posted",
          approval_status: "approved",
        },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!payment) {
        throw new Error("Payment not available for allocation");
      }

      // available amount
      const [result]: any = await sequelize.query(
        `
      SELECT
        ap.amount - COALESCE(SUM(apa.applied_amount), 0) AS available_amount
      FROM ap_payments ap
      LEFT JOIN ap_payment_allocations apa
        ON apa.payment_id = ap.id
      WHERE ap.id = ?
      GROUP BY ap.id
      `,
        { replacements: [paymentId], transaction: t, type: "SELECT" }
      );

      const availableAmount = Number(result.available_amount);

      const totalAllocate = allocations.reduce(
        (sum, a) => sum + Number(a.amount),
        0
      );

      if (totalAllocate <= 0) {
        throw new Error("Allocation amount must be greater than zero");
      }

      if (totalAllocate > availableAmount) {
        throw new Error("Allocated amount exceeds available payment amount");
      }

      // process each invoice
      for (const item of allocations) {
        if (item.amount <= 0) continue;

        // unpaid amount of invoice
        const [invoice]: any = await sequelize.query(
          `
        SELECT
          ai.id,
          ai.total_after_tax -
          COALESCE(SUM(apa.applied_amount), 0) AS unpaid_amount
        FROM ap_invoices ai
        LEFT JOIN ap_payment_allocations apa
          ON apa.ap_invoice_id = ai.id
        WHERE ai.id = ?
        GROUP BY ai.id
        `,
          { replacements: [item.invoice_id], transaction: t, type: "SELECT" }
        );

        if (!invoice) {
          throw new Error(`Invoice ${item.invoice_id} not found`);
        }

        if (item.amount > invoice.unpaid_amount) {
          throw new Error(
            `Allocated amount exceeds unpaid amount of invoice ${item.invoice_id}`
          );
        }

        await ApPaymentAllocation.create(
          {
            payment_id: paymentId,
            ap_invoice_id: item.invoice_id,
            applied_amount: item.amount,
          },
          { transaction: t }
        );

        // update invoice status if fully paid
        if (invoice.unpaid_amount - item.amount === 0) {
          await sequelize.query(
            `UPDATE ap_invoices SET status = 'paid' WHERE id = ?`,
            { replacements: [item.invoice_id], transaction: t }
          );
        }
      }

      // check remaining
      const remaining = availableAmount - totalAllocate;

      if (remaining === 0) {
        payment.status = "completed";
        await payment.save({ transaction: t });
      }

      await t.commit();
      return { success: true };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
