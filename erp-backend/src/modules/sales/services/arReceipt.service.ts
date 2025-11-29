// arReceipt.service.ts
import { ArReceipt } from "../models/arReceipt.model";
import { ArReceiptAllocation } from "../models/arReceiptAllocation.model";

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

  /** APPROVE — Chief Accountant */
  async approve(id: number, approver: any) {
    const receipt = await ArReceipt.findByPk(id);

    if (!receipt) throw new Error("Not found");
    if (receipt.approval_status !== "waiting_approval")
      throw new Error("Wrong stage");

    if (receipt.branch_id !== approver.branch_id)
      throw new Error("Cross-branch denied");

    await receipt.update({
      approval_status: "approved",
      approved_by: approver.id,
      approved_at: new Date(),
      status: "posted",
    });

    return receipt;
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
