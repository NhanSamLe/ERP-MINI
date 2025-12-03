// arReceipt.service.ts
import { ArInvoice, Partner, User } from "../../../models";
import { ArReceipt } from "../models/arReceipt.model";
import { ArReceiptAllocation } from "../models/arReceiptAllocation.model";
import { generateReceiptNo } from "../../../core/utils/receipt.util";
import { Op } from "sequelize";
import { sequelize } from "../../../config/db";
import { Transaction } from "sequelize";
import { GlJournal } from "../../finance/models/glJournal.model";
import { GlEntry } from "../../finance/models/glEntry.model";
import { GlEntryLine } from "../../finance/models/glEntryLine.model";

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
      { model: Partner, as: "customer", attributes: ["id", "name"] },
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
        attributes: ["id", "name","phone"],
      },
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
            attributes: ["id", "invoice_no", "total_after_tax","total_before_tax", "total_tax"],
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
    status: "draft",
  });
  },

  /** SUBMIT — Accountant */
  async submit(id: number, user: any) {
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

    return receipt;
  },

  /** APPROVE — Chief Accountant + POST to GL */
async approve(id: number, approver: any) {
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
    //  id = 1 → TK 111 (Tiền mặt)
    //  id = 2 → TK 112 (Tiền gửi NH)
    //  id = 3 → TK 131 (Phải thu khách hàng)
    const debitAccountId =
      receipt.method === "cash"
        ? 1 // Nợ 111 - Tiền mặt
        : 2; // Nợ 112 - Tiền gửi ngân hàng

    const creditAccountId = 3; // Có 131 - Phải thu khách hàng

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

    const amount = Number(receipt.amount || 0);

    // 👇 FIX 2: ép kiểu partnerId sang number cho TS vui
    const partnerId = receipt.customer_id as number | undefined;

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

    // Trả lại detail mới nhất
    return this.getById(receipt.id, approver);
  } catch (err) {
    await t.rollback();
    throw err;
  }
},


  /** REJECT — Chief Accountant */
  async reject(id: number, approver: any, reason: string) {
    const receipt = await ArReceipt.findByPk(id);

    if (!receipt) throw new Error("Not found");

    await receipt.update({
      approval_status: "rejected",
      reject_reason: reason,
      approved_by: approver.id,
    });

    return receipt;
  },

  /** ALLOCATE into Invoices — Accountant only after approved */
 async allocate(receiptId: number, allocations: any[], user: any) {
  const receipt = await ArReceipt.findByPk(receiptId);
  
  if (!receipt) throw new Error("Receipt not found");
  if (receipt.branch_id !== user.branch_id)
    throw new Error("Cross-branch denied");
  if (receipt.status !== "posted")
    throw new Error("Receipt must be posted before allocation");

  // 🔴 FIX 1: Validate total allocation
  const totalAlloc = allocations.reduce((sum, a) => sum + (a.applied_amount || 0), 0);
  if (totalAlloc > (receipt.amount ?? 0)) {
    throw new Error(`Total allocation ${totalAlloc} exceeds receipt amount ${receipt.amount}`);
  }

  // 🔴 FIX 2: Validate từng invoice + calculate unpaid
  for (const a of allocations) {
    if (!a.invoice_id || !a.applied_amount || a.applied_amount <= 0) {
      throw new Error("Invalid allocation data");
    }

    // Check invoice tồn tại
    const invoice = await ArInvoice.findByPk(a.invoice_id);
    if (!invoice) {
      throw new Error(`Invoice ${a.invoice_id} not found`);
    }

    // Calculate current unpaid (tất cả allocations cho invoice này)
    const totalAllocatedForInvoice = await ArReceiptAllocation.sum('applied_amount', {
      where: { invoice_id: a.invoice_id }
    }) || 0;

    const unpaid = invoice.total_after_tax ?? 0 - totalAllocatedForInvoice;

    // Check allocation không vượt unpaid
    if (a.applied_amount > unpaid) {
      throw new Error(
        `Allocation for invoice ${invoice.invoice_no} (${a.applied_amount}) ` +
        `exceeds unpaid amount (${unpaid})`
      );
    }
  }

  // Create allocations
  for (const a of allocations) {
    await ArReceiptAllocation.create({
      receipt_id: receiptId,
      invoice_id: a.invoice_id,
      applied_amount: a.applied_amount,
    });
  }

  return this.getById(receiptId, user);
},
  // UPDATE RECEIPT — only when draft
async update(id: number, data: any, user: any) {
  const receipt = await ArReceipt.findByPk(id);

  if (!receipt) throw new Error("Receipt not found");

  // Chặn cross-branch
  if (receipt.branch_id !== user.branch_id)
    throw new Error("Cross-branch access denied");

  // Chỉ accountant được sửa
  if (user.role !== "ACCOUNT" && user.role !== "CHACC" && user.role !== "BRMN" )
    throw new Error("Permission denied");

  // Chỉ khi DRAFT
  if (receipt.approval_status !== "draft" || receipt.status !== "draft")
    throw new Error("Only draft receipts can be updated");

  await receipt.update({
    receipt_date: data.receipt_date,
    customer_id: data.customer_id,
    amount: data.amount,
    method: data.method,
  });

  return this.getById(id, user);
},


};
