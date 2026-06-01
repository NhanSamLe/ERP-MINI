// arReceipt.service.ts
import { ArInvoice, Currency, Partner, User } from "../../../models";
import { ArReceipt } from "../models/arReceipt.model";
import { ArReceiptAllocation } from "../models/arReceiptAllocation.model";
import { generateReceiptNo } from "../../../core/utils/receipt.util";
import { Op } from "sequelize";
import { sequelize } from "../../../config/db";
import { Transaction } from "sequelize";
import { GlJournal } from "../../finance/models/glJournal.model";
import { GlEntry } from "../../finance/models/glEntry.model";
import { GlEntryLine } from "../../finance/models/glEntryLine.model";
import { GlAccount } from "../../finance/models/glAccount.model";
import { notificationService } from "../../../core/services/notification.service";

export const arReceiptService = {
  /** GET ALL — lọc theo branch và quyền */
  async getAll(user: any, filters: any = {}) {

    // Extract pagination input
    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    // Default filter
    const where: any = {
      branch_id: user.branch_id
    };
    console.log("FILTER WHERE:", where);


    if (user.role === "ACCOUNT") {
      where.created_by = user.id;
    }

    // ========== Search & filters ==========
    if (filters.search) {
      where.receipt_no = { [Op.like]: `%${filters.search}%` };
    }

    if (filters.customer_id) {
      where.customer_id = Number(filters.customer_id);
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.approval_status) {
      where.approval_status = filters.approval_status;
    }

    if (filters.date_from || filters.date_to) {
      where.receipt_date = {};
      if (filters.date_from) where.receipt_date[Op.gte] = filters.date_from;
      if (filters.date_to) where.receipt_date[Op.lte] = filters.date_to;
    }

    // Query with pagination
    const { count, rows } = await ArReceipt.findAndCountAll({
      where,
      include: [
        { model: Partner, as: "customer", attributes: ["id", "name", "phone"] },
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol", "name"] },
        { model: User, as: "creator", attributes: ["id", "username", "full_name"] },
        { model: User, as: "approver", attributes: ["id", "username", "full_name"] },
        {
          model: ArReceiptAllocation,
          as: "allocations",
          include: [{ model: ArInvoice, as: "invoice", attributes: ["id", "invoice_no", "total_after_tax"] }]
        }
      ],
      order: [["id", "DESC"]],
      offset,
      limit
    });

    return {
      items: rows,
      total: count,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(count / pageSize),
    };
  },
  /** GET DETAIL */
  async getById(id: number, user: any) {
    const receipt = await ArReceipt.findByPk(id, {
      include: [
        {
          model: Partner,
          as: "customer",
          attributes: ["id", "name", "phone"],
        },
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol", "name"] },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "full_name"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "username", "full_name"],
        },
        {
          model: ArReceiptAllocation,
          as: "allocations",
          include: [
            {
              model: ArInvoice,
              as: "invoice",
              attributes: ["id", "invoice_no", "total_after_tax", "total_before_tax", "total_tax"],
            },
          ],
        },
      ],
    });

    if (!receipt) throw new Error("Receipt not found");
    if (receipt.branch_id !== user.branch_id)
      throw new Error("Cross-branch denied");

    if (user.role === "ACCOUNT" && receipt.created_by !== user.id)
      throw new Error("You can only view your own receipts");

    return receipt;
  },

  /** CREATE — Accountant */
  async create(data: any, user: any) {
    const receipt_no = await generateReceiptNo(); // auto
    return ArReceipt.create({
      branch_id: user.branch_id,
      receipt_no,
      receipt_date: data.receipt_date,
      customer_id: data.customer_id,
      amount: data.amount,
      method: data.method,
      created_by: user.id,
      approval_status: "draft",
      allocation_status: "unallocated",
      status: "draft",
      currency_id: data.currency_id || null,
      exchange_rate: data.exchange_rate || 1,
    });
  },

  /** SUBMIT — Accountant */
  async submit(id: number, user: any, app?: any) {
    const receipt = await ArReceipt.findByPk(id);

    if (!receipt) throw new Error("Receipt not found");
    if (receipt.branch_id !== user.branch_id)
      throw new Error("Cross-branch denied");
    if (receipt.approval_status !== "draft")
      throw new Error("Already submitted");

    await receipt.update({
      approval_status: "waiting_approval",
      submitted_at: new Date(),
    });

    // Gửi thông báo
    if (app) {
      const io = app.get("io");
      await notificationService.createNotification({
        type: "SUBMIT",
        referenceType: "AR_RECEIPT",
        referenceId: receipt.id!,
        referenceNo: receipt.receipt_no!,
        branchId: receipt.branch_id!,
        submitterId: user.id,
        submitterName: user.fullName || user.username,
        io,
      });
    }

    return receipt;
  },

  /** APPROVE — Chief Accountant + POST to GL */
  async approve(id: number, approver: any, app?: any) {
    const t: Transaction = await sequelize.transaction();

    try {
      // 1. Load receipt trong transaction
      const receipt = await ArReceipt.findByPk(id, { transaction: t });

      if (!receipt) throw new Error("Receipt not found");
      if (receipt.approval_status !== "waiting_approval")
        throw new Error("Wrong approval stage");

      if (receipt.branch_id !== approver.branch_id)
        throw new Error("Cross-branch denied");

      // 2. Cập nhật trạng thái receipt: approved + posted
      await receipt.update(
        {
          approval_status: "approved",
          approved_by: approver.id,
          approved_at: new Date(),
          status: "posted",
        },
        { transaction: t }
      );

      // 3. Xác định tài khoản Nợ/Có theo method
      const debitAccCode = receipt.method === "cash" ? "111" : "112";
      const creditAccCode = "131";

      const [debitAcc, creditAcc] = await Promise.all([
        GlAccount.findOne({ where: { code: debitAccCode }, transaction: t }),
        GlAccount.findOne({ where: { code: creditAccCode }, transaction: t }),
      ]);

      if (!debitAcc || !creditAcc) {
        throw new Error(`Missing GL Accounts ${debitAccCode} / ${creditAccCode}`);
      }

      const debitAccountId = debitAcc.id;
      const creditAccountId = creditAcc.id;

      // 4. Lấy journal: CASH hoặc BANK
      const journalCode = receipt.method === "cash" ? "CASH" : "BANK";

      const journal = await GlJournal.findOne({
        where: { code: journalCode },
        transaction: t,
      });

      if (!journal) {
        throw new Error(`${journalCode} journal not found`);
      }

      // 👇 FIX 1: đảm bảo là Date, không undefined
      const entryDate: Date = receipt.receipt_date || new Date();

      // 5. Tạo GL Entry (chứng từ thu tiền)
      const entry = await GlEntry.create(
        {
          journal_id: journal.id,
          entry_no: `GL-AR-REC-${receipt.id}`,
          entry_date: entryDate,
          reference_type: "ar_receipt",
          reference_id: receipt.id,
          memo: `AR Receipt ${receipt.receipt_no}`,
          status: "posted",
        },
        { transaction: t }
      );

      const rate = Number(receipt.exchange_rate || 1);
      const amountBase = Number(receipt.amount || 0) * rate;

      // 👇 FIX 2: ép kiểu partnerId sang number cho TS vui
      const partnerId = receipt.customer_id as number | undefined;

      const lineDebit: any = {
        entry_id: entry.id,
        account_id: debitAccountId,
        debit: amountBase,
        credit: 0,
      };

      const lineCredit: any = {
        entry_id: entry.id,
        account_id: creditAccountId,
        debit: 0,
        credit: amountBase,
      };

      // chỉ set partner_id nếu có customer_id
      if (partnerId) {
        lineDebit.partner_id = partnerId;
        lineCredit.partner_id = partnerId;
      }

      // 6. Tạo GL Entry Lines (Nợ 111/112, Có 131)
      await GlEntryLine.bulkCreate([lineDebit, lineCredit], {
        transaction: t,
      });

      // 7. Commit transaction
      await t.commit();

      // Gửi thông báo (sau khi commit)
      if (app && receipt.created_by) {
        const io = app.get("io");
        setImmediate(async () => {
          await notificationService.createNotification({
            type: "APPROVE",
            referenceType: "AR_RECEIPT",
            referenceId: receipt.id!,
            referenceNo: receipt.receipt_no!,
            branchId: receipt.branch_id!,
            submitterId: receipt.created_by!,
            approverName: approver.fullName || approver.username,
            io,
          });
        });
      }

      // Trả lại detail mới nhất
      return this.getById(receipt.id, approver);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },


  /** REJECT — Chief Accountant */
  async reject(id: number, approver: any, reason: string, app?: any) {
    const receipt = await ArReceipt.findByPk(id);

    if (!receipt) throw new Error("Not found");

    await receipt.update({
      approval_status: "rejected",
      reject_reason: reason,
      approved_by: approver.id,
    });

    // Gửi thông báo
    if (app && receipt.created_by) {
      const io = app.get("io");
      await notificationService.createNotification({
        type: "REJECT",
        referenceType: "AR_RECEIPT",
        referenceId: receipt.id!,
        referenceNo: receipt.receipt_no!,
        branchId: receipt.branch_id!,
        submitterId: receipt.created_by,
        approverName: approver.fullName || approver.username,
        rejectReason: reason,
        io,
      });
    }

    return receipt;
  },

  async allocate(receiptId: number, allocations: any[], user: any) {
    const t = await sequelize.transaction();

    try {
      /* ===============================
       * 1. Load receipt & validate
       * =============================== */
      const receipt = await ArReceipt.findByPk(receiptId, { transaction: t });
      if (!receipt) throw new Error("Receipt not found");

      if (receipt.status !== "posted") {
        throw new Error("Receipt must be posted before allocation");
      }

      const receiptAmount = Number(receipt.amount || 0);
      if (receiptAmount <= 0) {
        throw new Error("Receipt amount must be greater than 0");
      }

      const totalAllocInput = allocations.reduce(
        (s, a) => s + Number(a.applied_amount || 0),
        0
      );

      if (totalAllocInput > receiptAmount) {
        throw new Error(
          `Tổng tiền phân bổ (${totalAllocInput}) không được vượt quá số tiền thực thu (${receiptAmount})`
        );
      }

      /* ===============================
       * 2. Allocation từng invoice
       * =============================== */
      let totalAllocated = 0;

      for (const a of allocations) {
        if (!a.invoice_id || !a.applied_amount) continue;

        const invoice = await ArInvoice.findByPk(a.invoice_id, {
          transaction: t,
        });
        if (!invoice) throw new Error("Invoice not found");

        if (invoice.branch_id !== receipt.branch_id) {
          throw new Error(`Invoice ${invoice.invoice_no} belongs to a different branch.`);
        }

        if (invoice.status === "paid") {
          throw new Error(
            `Invoice ${invoice.invoice_no} has already been fully paid`
          );
        }

        const prevAllocated =
          (await ArReceiptAllocation.sum("applied_amount", {
            where: { invoice_id: a.invoice_id },
            transaction: t,
          })) || 0;

        const invoiceTotal = Number(invoice.total_after_tax || 0);
        const unpaid = invoiceTotal - prevAllocated;

        if (a.applied_amount > unpaid) {
          throw new Error(
            `Allocation exceeds unpaid amount for invoice ${invoice.invoice_no}`
          );
        }

        // Create allocation
        await ArReceiptAllocation.create(
          {
            receipt_id: receiptId,
            invoice_id: a.invoice_id,
            applied_amount: a.applied_amount,
          },
          { transaction: t }
        );

        totalAllocated += Number(a.applied_amount);

        const newAllocated = prevAllocated + Number(a.applied_amount);
        const remaining = invoiceTotal - newAllocated;
        let newInvoiceStatus: ArInvoice["status"] = "posted";

        if (remaining <= 0) {
          newInvoiceStatus = "paid";
        } else if (remaining < invoiceTotal) {
          newInvoiceStatus = "partially_paid";
        }

        const paymentDateStr = receipt.receipt_date 
          ? new Date(receipt.receipt_date).toISOString().substring(0, 10)
          : new Date().toISOString().substring(0, 10);

        await invoice.update(
          { 
            status: newInvoiceStatus,
            paid_amount: newAllocated,
            last_payment_date: paymentDateStr
          },
          { transaction: t }
        );
      }
      let allocationStatus: ArReceipt["allocation_status"] = "unallocated";

      const previousAllocOfReceipt =
        (await ArReceiptAllocation.sum("applied_amount", {
          where: { receipt_id: receiptId },
          transaction: t,
        })) || 0;
        
      const currentGrandTotal = previousAllocOfReceipt + totalAllocated;

      if (currentGrandTotal >= receiptAmount) {
        allocationStatus = "fully_allocated";
      } else if (currentGrandTotal > 0) {
        allocationStatus = "partially_allocated" as any; // Ep kiểu vì model cần thêm enum
      }
      
      await receipt.update(
        { allocation_status: allocationStatus },
        { transaction: t }
      );

      /* ===============================
       * 5. Commit
       * =============================== */
      await t.commit();

      return this.getById(receiptId, user);
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
  // UPDATE RECEIPT — only when draft
  async update(id: number, data: any, user: any) {
    const receipt = await ArReceipt.findByPk(id);

    if (!receipt) throw new Error("Receipt not found");

    // Chặn cross-branch
    if (receipt.branch_id !== user.branch_id)
      throw new Error("Cross-branch access denied");

    // Chỉ accountant được sửa
    if (user.role !== "ACCOUNT" && user.role !== "CHACC" && user.role !== "BRMN")
      throw new Error("Permission denied");

    // Chỉ khi DRAFT
    if (receipt.approval_status !== "draft" || receipt.status !== "draft")
      throw new Error("Only draft receipts can be updated");

    await receipt.update({
      receipt_date: data.receipt_date,
      customer_id: data.customer_id,
      amount: data.amount,
      method: data.method,
      currency_id: data.currency_id,
      exchange_rate: data.exchange_rate,
    });

    return this.getById(id, user);
  },


};
