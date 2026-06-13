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
import { notificationService } from "../../../core/services/notification.service";
import { assertPostingPeriodOpen } from "../../finance/services/fiscalGuard.service";
import { requireGlAccounts } from "../../finance/services/glAccount.helper";
import { getCompanyIdFromBranch, getCompanyIdFromUserBranch } from "../../finance/services/companyScope.service";

const ACCOUNTING_ROLES = ["ACCOUNT", "CHACC", "BRANCH_MANAGER", "BRMN"];

function requireAccountingRole(user: any) {
  if (!ACCOUNTING_ROLES.includes(user?.role)) {
    throw new Error("Bạn không có quyền thao tác phiếu thu.");
  }
}

function requireChiefAccountant(user: any) {
  if (user?.role !== "CHACC") {
    throw new Error("Chỉ Kế toán trưởng được phê duyệt hoặc từ chối phiếu thu.");
  }
}

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
  async create(data: any, user: any, app?: any) {
    requireAccountingRole(user);
    const companyId = await getCompanyIdFromUserBranch(user);
    await assertPostingPeriodOpen(data.receipt_date || new Date(), companyId);

    const receipt_no = await generateReceiptNo(); // auto
    const receipt = await ArReceipt.create({
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

    // Kế toán trưởng (CHACC) tạo phiếu thu → tự duyệt + ghi sổ luôn, không cần
    // bước gửi duyệt rồi tự duyệt cho chính mình. Sau khi posted, CHACC có thể
    // phân bổ công nợ ngay (allocate yêu cầu status = "posted").
    if (user?.role === "CHACC") {
      await receipt.update({ approval_status: "waiting_approval", submitted_at: new Date() });
      return this.approve(receipt.id, user, app);
    }

    return receipt;
  },

  /** SUBMIT — Accountant */
  async submit(id: number, user: any, app?: any) {
    requireAccountingRole(user);
    const receipt = await ArReceipt.findByPk(id);

    if (!receipt) throw new Error("Không tìm thấy phiếu thu.");
    if (receipt.branch_id !== user.branch_id)
      throw new Error("Không được thao tác phiếu thu khác chi nhánh.");
    if (receipt.approval_status !== "draft")
      throw new Error("Phiếu thu đã được gửi phê duyệt hoặc không còn ở trạng thái nháp.");

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
    requireChiefAccountant(approver);

    const t: Transaction = await sequelize.transaction();

    try {
      // 1. Load receipt trong transaction
      const receipt = await ArReceipt.findByPk(id, { transaction: t });

      if (!receipt) throw new Error("Không tìm thấy phiếu thu.");
      if (receipt.approval_status !== "waiting_approval")
        throw new Error("Phiếu thu không ở trạng thái chờ phê duyệt.");

      if (receipt.branch_id !== approver.branch_id)
        throw new Error("Không được phê duyệt phiếu thu khác chi nhánh.");


      const companyId = await getCompanyIdFromBranch(receipt.branch_id, t);
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

      // 3. Lấy tài khoản Nợ/Có theo company_id (multi-tenant safe)
      const debitAccCode = receipt.method === "cash" ? "111" : "112";
      const accounts = await requireGlAccounts(companyId, [debitAccCode, "131"], t);
      const debitAccountId = accounts[debitAccCode]!.id;
      const creditAccountId = accounts["131"]!.id;

      // 4. Lấy journal: CASH hoặc BANK
      const journalCode = receipt.method === "cash" ? "CASH" : "BANK";
      const journal = await GlJournal.findOne({ where: { code: journalCode }, transaction: t });
      if (!journal) throw new Error(`${journalCode} journal not found`);

      const entryDate: Date = receipt.receipt_date || new Date();
      // Kiểm tra kỳ kế toán đúng company
      await assertPostingPeriodOpen(entryDate, companyId, t);

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
          branch_id: receipt.branch_id ?? null,
        } as any,
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
    requireChiefAccountant(approver);
    if (!reason || !String(reason).trim()) {
      throw new Error("Vui lòng nhập lý do từ chối phiếu thu.");
    }

    const receipt = await ArReceipt.findByPk(id);

    if (!receipt) throw new Error("Không tìm thấy phiếu thu.");
    if (receipt.branch_id !== approver.branch_id)
      throw new Error("Không được từ chối phiếu thu khác chi nhánh.");
    if (receipt.approval_status !== "waiting_approval")
      throw new Error("Chỉ được từ chối phiếu thu đang chờ phê duyệt.");

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
    requireAccountingRole(user);
    const t = await sequelize.transaction();

    try {
      /* ===============================
       * 1. Load receipt & validate
       * =============================== */
      const receipt = await ArReceipt.findByPk(receiptId, { transaction: t });
      if (!receipt) throw new Error("Không tìm thấy phiếu thu.");
      if (receipt.branch_id !== user.branch_id) {
        throw new Error("Không được phân bổ phiếu thu khác chi nhánh.");
      }

      if (receipt.status !== "posted") {
        throw new Error("Phiếu thu phải được ghi sổ trước khi phân bổ công nợ.");
      }

      const receiptAmount = Number(receipt.amount || 0);
      const receiptRate = Number(receipt.exchange_rate || 1);
      // Số tiền phiếu thu quy về VND để so sánh thống nhất
      const receiptAmountVnd = receiptAmount * receiptRate;

      if (receiptAmount <= 0) {
        throw new Error("Receipt amount must be greater than 0");
      }

      const totalAllocInput = allocations.reduce(
        (s, a) => s + Number(a.applied_amount || 0),
        0
      );

      // applied_amount frontend gửi lên phải cùng đơn vị với receipt.amount
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
        if (!invoice) throw new Error("Không tìm thấy hóa đơn phải thu.");

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

        // Quy đổi về cùng currency với receipt để so sánh
        const invoiceRate = Number(invoice.exchange_rate || 1);
        const invoiceTotalVnd = Number(invoice.total_after_tax || 0) * invoiceRate;
        const prevAllocatedVnd = prevAllocated * invoiceRate;
        const appliedVnd = Number(a.applied_amount) * receiptRate;
        const unpaidVnd = invoiceTotalVnd - prevAllocatedVnd;

        if (appliedVnd > unpaidVnd + 0.01) {
          throw new Error(
            `Allocation exceeds unpaid amount for invoice ${invoice.invoice_no}`
          );
        }

        // Tính paid_amount và status theo đơn vị gốc của invoice
        const invoiceTotal = Number(invoice.total_after_tax || 0);
        // Giữ applied_amount theo currency receipt, chuyển đổi để cập nhật invoice paid_amount
        const appliedInInvoiceCurrency = receiptRate > 0
          ? (Number(a.applied_amount) * receiptRate) / invoiceRate
          : Number(a.applied_amount);
        const unpaid = invoiceTotal - prevAllocated;

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

        const newAllocated = prevAllocated + appliedInInvoiceCurrency;
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
            paid_amount: newAllocated,          // đơn vị currency của invoice
            last_payment_date: paymentDateStr,
          },
          { transaction: t }
        );
      }
      let allocationStatus: ArReceipt["allocation_status"] = "unallocated";

      // Sum tất cả allocation của receipt này (bao gồm cả rows vừa tạo trong tx này)
      // InnoDB reads own writes within same transaction, nên sum này đã bao gồm các dòng mới
      const totalAllocatedForReceipt =
        (await ArReceiptAllocation.sum("applied_amount", {
          where: { receipt_id: receiptId },
          transaction: t,
        })) || 0;

      if (totalAllocatedForReceipt >= receiptAmount) {
        allocationStatus = "fully_allocated";
      } else if (totalAllocatedForReceipt > 0) {
        allocationStatus = "partially_allocated" as any;
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
    requireAccountingRole(user);
    const receipt = await ArReceipt.findByPk(id);

    if (!receipt) throw new Error("Không tìm thấy phiếu thu.");

    // Chặn cross-branch
    if (receipt.branch_id !== user.branch_id)
      throw new Error("Không được sửa phiếu thu khác chi nhánh.");

    // Chỉ accountant được sửa
    if (user.role === "ACCOUNT" && receipt.created_by !== user.id)
      throw new Error("Kế toán chỉ được sửa phiếu thu do mình tạo.");

    // Chỉ khi DRAFT
    if (receipt.approval_status !== "draft" || receipt.status !== "draft")
      throw new Error("Chỉ được sửa phiếu thu ở trạng thái nháp.");

    const companyId = await getCompanyIdFromUserBranch(user);
    await assertPostingPeriodOpen(data.receipt_date || receipt.receipt_date || new Date(), companyId);

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
