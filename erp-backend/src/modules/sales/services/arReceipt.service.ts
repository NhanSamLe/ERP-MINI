// arReceipt.service.ts
import { ArReceipt } from "../models/arReceipt.model";
import { ArReceiptAllocation } from "../models/arReceiptAllocation.model";

import { sequelize } from "../../../config/db";
import { Transaction } from "sequelize";
import { GlJournal } from "../../finance/models/glJournal.model";
import { GlEntry } from "../../finance/models/glEntry.model";
import { GlEntryLine } from "../../finance/models/glEntryLine.model";

export const arReceiptService = {
  /** GET ALL — lọc theo branch và quyền */
  async getAll(user: any) {
    const where: any = { branch_id: user.branch_id };

    if (user.role === "ACCOUNT") {
      where.created_by = user.id;
    }

    return ArReceipt.findAll({
      where,
      include: [{ model: ArReceiptAllocation, as: "allocations" }],
      order: [["id", "DESC"]],
    });
  },

  /** GET DETAIL */
  async getById(id: number, user: any) {
    const receipt = await ArReceipt.findByPk(id, {
      include: [{ model: ArReceiptAllocation, as: "allocations" }],
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
    return ArReceipt.create({
      branch_id: user.branch_id,
      receipt_no: data.receipt_no,
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
