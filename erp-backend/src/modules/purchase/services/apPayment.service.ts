import { Role } from "../../../core/types/enum";
import { ApPayment } from "../models/apPayment.model";
import { ApPaymentAuditLog } from "../models/apPaymentAuditLog.model";
import { User } from "../../auth/models/user.model";
import { Branch } from "../../company/models/branch.model";
import { Transaction } from "sequelize";
import { GlJournal } from "../../finance/models/glJournal.model";
import { GlEntry } from "../../finance/models/glEntry.model";
import { GlEntryLine } from "../../finance/models/glEntryLine.model";
import { GlAccount } from "../../finance/models/glAccount.model";
import { ApPaymentAllocation, Partner, sequelize, BankAccount } from "../../../models";
import { Op, QueryTypes } from "sequelize";
import { notificationService } from "../../../core/services/notification.service";

export const apPaymentService = {
  // ─── READ ──────────────────────────────────────────────────────────────────

  async getAll(query: any, user: any) {
    const { status, approval_status, allocation_status, supplier_id } = query;

    const where: any = { branch_id: user.branch_id };

    if (user.role === Role.ACCOUNT) {
      where.created_by = user.id;
    }

    if (status) where.status = status;
    if (approval_status) where.approval_status = approval_status;
    if (allocation_status) where.allocation_status = allocation_status;
    if (supplier_id) where.supplier_id = Number(supplier_id);

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
        {
          model: BankAccount,
          as: "bankAccount",
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });
  },

  async getById(id: number, user: any) {
    const where: any = { id, branch_id: user.branch_id };

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
        {
          model: BankAccount,
          as: "bankAccount",
          required: false,
        },
      ],
    });
  },

  // ─── AUDIT LOG ─────────────────────────────────────────────────────────────

  async getAuditLogs(paymentId: number, user: any) {
    const payment = await ApPayment.findOne({
      where: { id: paymentId, branch_id: user.branch_id },
    });

    if (!payment) throw new Error("AP Payment not found");

    return ApPaymentAuditLog.findAll({
      where: { payment_id: paymentId },
      include: [
        {
          model: User,
          as: "actor",
          attributes: ["id", "full_name", "email", "avatar_url"],
        },
      ],
      order: [["created_at", "ASC"]],
    });
  },

  // ─── CREATE ────────────────────────────────────────────────────────────────

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
      allocation_status: "unallocated",
      currency_id: payload.currency_id ?? null,
      exchange_rate: payload.exchange_rate ?? 1.0,
      bank_account_id: payload.bank_account_id ?? null,
      transaction_reference: payload.transaction_reference ?? null,
      created_by: user.id,
      approved_by: null,
      submitted_at: null,
      approved_at: null,
      reject_reason: null,
      branch_id: user.branch_id,
    });

    await ApPaymentAuditLog.create({
      payment_id: payment.id,
      action: "CREATE",
      old_status: null,
      new_status: "draft/draft",
      details: {
        amount: payload.amount,
        method: payload.method,
        supplier_id: payload.supplier_id,
      },
      created_by: user.id,
    });

    return this.getById(payment.id, user);
  },

  // ─── SUBMIT ────────────────────────────────────────────────────────────────

  async submitForApproval(id: number, user: any, app?: any) {
    const payment = await this.getById(id, user);
    if (!payment) throw new Error("AP Payment not found");

    if (payment.created_by !== user.id) {
      throw new Error("Only creator can submit payment");
    }

    if (payment.status !== "draft") {
      throw new Error("Only draft payment can be submitted");
    }

    const oldStatus = `${payment.status}/${payment.approval_status}`;

    payment.approval_status = "waiting_approval";
    payment.submitted_at = new Date();
    await payment.save();

    await ApPaymentAuditLog.create({
      payment_id: payment.id,
      action: "SUBMIT",
      old_status: oldStatus,
      new_status: "draft/waiting_approval",
      details: { submitted_at: payment.submitted_at },
      created_by: user.id,
    });

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

  // ─── APPROVE ───────────────────────────────────────────────────────────────

  async approve(id: number, user: any, app?: any) {
    if (user.role !== Role.CHACC)
      throw new Error("Only Chief Accountant can approve");

    const t: Transaction = await sequelize.transaction();
    try {
      const payment = await ApPayment.findByPk(id, { transaction: t });
      if (!payment) throw new Error("AP Payment not found");

      if (payment.branch_id !== user.branch_id)
        throw new Error("You cannot approve payment from another branch");

      if (payment.approval_status !== "waiting_approval")
        throw new Error("Payment is not waiting for approval");

      const oldStatus = `${payment.status}/${payment.approval_status}`;

      await payment.update(
        {
          approval_status: "approved",
          status: "posted",
          approved_by: user.id,
          approved_at: new Date(),
          reject_reason: null,
        },
        { transaction: t },
      );

      // GL: cash->111, bank/transfer->112
      const creditAccCode = payment.method === "cash" ? "111" : "112";
      const debitAccCode = "331";

      const [debitAcc, creditAcc] = await Promise.all([
        GlAccount.findOne({ where: { code: debitAccCode }, transaction: t }),
        GlAccount.findOne({ where: { code: creditAccCode }, transaction: t }),
      ]);

      if (!debitAcc || !creditAcc) {
        throw new Error(`Missing GL Accounts ${debitAccCode} / ${creditAccCode}`);
      }

      const creditAccountId = creditAcc.id;
      const debitAccountId = debitAcc.id;

      const journalCode = payment.method === "cash" ? "CASH" : "BANK";
      const journal = await GlJournal.findOne({
        where: { code: journalCode },
        transaction: t,
      });
      if (!journal) throw new Error(`${journalCode} journal not found`);

      const entryDate: Date = payment.payment_date || new Date();
      const amount = Number(payment.amount || 0);
      if (amount <= 0) throw new Error("Payment amount must be > 0");
      const exchangeRate = Number(payment.exchange_rate ?? 1.0);
      const baseAmount = amount * exchangeRate; // Quy đổi ra VND để ghi sổ cái

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
        { transaction: t },
      );

      const supplierId = payment.supplier_id as number | undefined;

      const lineDebit: any = {
        entry_id: entry.id,
        account_id: debitAccountId,
        debit: baseAmount,
        credit: 0,
      };
      const lineCredit: any = {
        entry_id: entry.id,
        account_id: creditAccountId,
        debit: 0,
        credit: baseAmount,
      };

      if (supplierId) {
        lineDebit.partner_id = supplierId;
        lineCredit.partner_id = supplierId;
      }

      await GlEntryLine.bulkCreate([lineDebit, lineCredit], { transaction: t });

      await ApPaymentAuditLog.create(
        {
          payment_id: id,
          action: "APPROVE",
          old_status: oldStatus,
          new_status: "posted/approved",
          details: {
            approved_by: user.id,
            approved_at: new Date(),
            gl_entry_no: entry.entry_no,
          },
          created_by: user.id,
        },
        { transaction: t },
      );

      await t.commit();

      if (app) {
        const io = app.get("io");
        await notificationService.createNotification({
          type: "APPROVE",
          referenceType: "AP_PAYMENT",
          referenceId: id,
          referenceNo: payment.payment_no!,
          branchId: payment.branch_id!,
          submitterId: payment.created_by,
          approverName: user.fullName || user.username,
          io,
        });
      }

      return this.getById(id, user);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  // ─── REJECT ────────────────────────────────────────────────────────────────

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

    const oldStatus = `${payment.status}/${payment.approval_status}`;

    payment.approval_status = "rejected";
    payment.status = "cancelled";
    payment.approved_by = user.id;
    payment.approved_at = new Date();
    payment.reject_reason = reason;
    await payment.save();

    await ApPaymentAuditLog.create({
      payment_id: id,
      action: "REJECT",
      old_status: oldStatus,
      new_status: "cancelled/rejected",
      details: { reject_reason: reason, rejected_by: user.id },
      created_by: user.id,
    });

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

  // ─── AVAILABLE AMOUNT ──────────────────────────────────────────────────────

  async getAvailableAmount(id: number, user: any) {
    const payment = await ApPayment.findOne({
      where: {
        id,
        branch_id: user.branch_id,
        status: "posted",
        approval_status: "approved",
      },
    });

    if (!payment) throw new Error("Payment not available for allocation");

    const [result]: any = await sequelize.query(
      `SELECT ap.amount - COALESCE(SUM(apa.applied_amount), 0) AS available_amount
       FROM ap_payments ap
       LEFT JOIN ap_payment_allocations apa ON apa.payment_id = ap.id
       WHERE ap.id = ?
       GROUP BY ap.id`,
      { replacements: [id], type: "SELECT" },
    );

    return {
      payment_id: id,
      available_amount: Number(result.available_amount),
    };
  },

  // ─── UNPAID INVOICES ───────────────────────────────────────────────────────

  async getUnpaidInvoices(paymentId: number, user: any) {
    const payment = await ApPayment.findOne({
      where: {
        id: paymentId,
        branch_id: user.branch_id,
        status: "posted",
        approval_status: "approved",
      },
    });

    if (!payment) throw new Error("Payment not available for allocation");

    return sequelize.query(
      `SELECT
         ai.id,
         ai.invoice_no,
         ai.total_after_tax,
         COALESCE(SUM(apa.applied_amount), 0) AS allocated_amount,
         ai.total_after_tax - COALESCE(SUM(apa.applied_amount), 0) AS unpaid_amount
       FROM ap_invoices ai
       JOIN purchase_orders po ON po.id = ai.po_id
       LEFT JOIN ap_payment_allocations apa ON apa.ap_invoice_id = ai.id
       WHERE ai.status IN ('posted', 'partially_paid')
         AND ai.approval_status = 'approved'
         AND po.supplier_id = ?
         AND ai.branch_id = ?
       GROUP BY ai.id
       HAVING unpaid_amount > 0`,
      {
        replacements: [payment.supplier_id, user.branch_id],
        type: QueryTypes.SELECT,
      },
    );
  },

  // ─── ALLOCATE ──────────────────────────────────────────────────────────────

  async allocate(
    paymentId: number,
    allocations: { invoice_id: number; amount: number }[],
    user: any,
    app?: any,
  ) {
    const t = await sequelize.transaction();

    try {
      // Lock payment row
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

      if (!payment) throw new Error("Payment not available for allocation");

      // Calculate available amount
      const [result]: any = await sequelize.query(
        `SELECT ap.amount - COALESCE(SUM(apa.applied_amount), 0) AS available_amount
         FROM ap_payments ap
         LEFT JOIN ap_payment_allocations apa ON apa.payment_id = ap.id
         WHERE ap.id = ?
         GROUP BY ap.id`,
        { replacements: [paymentId], transaction: t, type: "SELECT" },
      );

      const availableAmount = Number(result.available_amount);
      const totalAllocate = allocations.reduce(
        (sum, a) => sum + Number(a.amount),
        0,
      );

      if (totalAllocate <= 0)
        throw new Error("Allocation amount must be greater than zero");
      if (totalAllocate > availableAmount)
        throw new Error("Allocated amount exceeds available payment amount");

      const allocatedInvoices: {
        invoice_id: number;
        amount: number;
        status: string;
      }[] = [];

      for (const item of allocations) {
        if (item.amount <= 0)
          throw new Error("Allocation amount must be greater than zero");

        // Validate invoice: supplier + status + approval + branch + lock
        const [invoice]: any = await sequelize.query(
          `SELECT ai.id,
                  ai.total_after_tax - COALESCE(SUM(apa.applied_amount), 0) AS unpaid_amount
           FROM ap_invoices ai
           JOIN purchase_orders po ON po.id = ai.po_id
           LEFT JOIN ap_payment_allocations apa ON apa.ap_invoice_id = ai.id
           WHERE ai.id = ?
             AND po.supplier_id = ?
             AND ai.status IN ('posted', 'partially_paid')
             AND ai.approval_status = 'approved'
             AND ai.branch_id = ?
           GROUP BY ai.id
           FOR UPDATE`,
          {
            replacements: [
              item.invoice_id,
              payment.supplier_id,
              user.branch_id,
            ],
            transaction: t,
            type: "SELECT",
          },
        );

        if (!invoice) {
          throw new Error(
            `Invoice ${item.invoice_id} not found, not posted/partially_paid, not approved, or belongs to different supplier/branch`,
          );
        }

        // Check duplicate from same payment -> update amount instead of throwing error
        const existingAllocation = await ApPaymentAllocation.findOne({
          where: { payment_id: paymentId, ap_invoice_id: item.invoice_id },
          transaction: t,
        });

        if (item.amount > invoice.unpaid_amount) {
          throw new Error(
            `Allocated amount exceeds unpaid amount of invoice ${item.invoice_id}`,
          );
        }

        if (existingAllocation) {
          existingAllocation.applied_amount = Number(existingAllocation.applied_amount || 0) + item.amount;
          await existingAllocation.save({ transaction: t });
        } else {
          await ApPaymentAllocation.create(
            {
              payment_id: paymentId,
              ap_invoice_id: item.invoice_id,
              applied_amount: item.amount,
            },
            { transaction: t },
          );
        }

        // Update invoice paid_amount and status
        const unpaidAfter = invoice.unpaid_amount - item.amount;
        let newInvoiceStatus: string;

        if (unpaidAfter <= 0) {
          newInvoiceStatus = "paid";
        } else {
          newInvoiceStatus = "partially_paid";
        }

        // Recalculate paid_amount from allocations (source of truth)
        const [paidResult]: any = await sequelize.query(
          `SELECT COALESCE(SUM(applied_amount), 0) AS total_paid
           FROM ap_payment_allocations WHERE ap_invoice_id = ?`,
          { replacements: [item.invoice_id], transaction: t, type: "SELECT" },
        );
        const newPaidAmount = Number(paidResult?.total_paid ?? 0);

        await sequelize.query(
          `UPDATE ap_invoices SET status = ?, paid_amount = ?, last_payment_date = CURDATE() WHERE id = ?`,
          {
            replacements: [newInvoiceStatus, newPaidAmount, item.invoice_id],
            transaction: t,
          },
        );

        allocatedInvoices.push({
          invoice_id: item.invoice_id,
          amount: item.amount,
          status: newInvoiceStatus,
        });
      }

      // Update payment status if fully allocated
      const remaining = availableAmount - totalAllocate;
      const newPaymentStatus = remaining <= 0 ? "completed" : "posted";
      const newAllocationStatus =
        remaining <= 0 ? "fully_allocated" : "partially_allocated";

      if (remaining <= 0) {
        payment.status = "completed";
      }
      (payment as any).allocation_status = newAllocationStatus;
      await payment.save({ transaction: t });

      // Audit log for allocation
      await ApPaymentAuditLog.create(
        {
          payment_id: paymentId,
          action: "ALLOCATE",
          old_status: "posted/approved",
          new_status: `${newPaymentStatus}/approved`,
          details: {
            allocations: allocatedInvoices,
            total_allocated: totalAllocate,
            remaining,
          },
          created_by: user.id,
        },
        { transaction: t },
      );

      await t.commit();

      // ✅ Phase 3: Notification on allocate
      if (app) {
        try {
          const io = app.get("io");
          await notificationService.createNotification({
            type: "SYSTEM",
            referenceType: "AP_PAYMENT",
            referenceId: paymentId,
            referenceNo: payment.payment_no!,
            branchId: payment.branch_id!,
            submitterId: user.id,
            io,
          });
        } catch {
          // notification failure không block response
        }
      }

      return { success: true };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
