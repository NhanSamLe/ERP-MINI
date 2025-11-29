// arInvoice.service.ts
import { ArInvoice } from "../models/arInvoice.model";
import { ArInvoiceLine } from "../models/arInvoiceLine.model";
import { TaxRate } from "../../master-data/models/taxRate.model";

export const arInvoiceService = {
  /** tính thuế từng dòng */
  async calcLineTax(line: any) {
    const qty = Number(line.quantity || 0);
    const price = Number(line.unit_price || 0);
    const line_total = qty * price;

    let line_tax = 0;
    let line_total_after_tax = line_total;

    if (line.tax_rate_id) {
      const tax = await TaxRate.findByPk(line.tax_rate_id);
      const rate = tax ? Number(tax.rate) : 0;
      line_tax = (line_total * rate) / 100;
      line_total_after_tax = line_total + line_tax;
    }

    return { line_total, line_tax, line_total_after_tax };
  },

  /** tổng hóa đơn */
  async calcTotals(lines: any[]) {
    let total_before_tax = 0;
    let total_tax = 0;
    let total_after_tax = 0;

    for (const l of lines) {
      total_before_tax += Number(l.line_total || 0);
      total_tax += Number(l.line_tax || 0);
      total_after_tax += Number(l.line_total_after_tax || 0);
    }

    return { total_before_tax, total_tax, total_after_tax };
  },

  /** GET ALL — lọc theo branch và quyền */
  async getAll(user: any) {
    const where: any = { branch_id: user.branch_id };

    if (user.role === "ACCOUNT") {
      where.created_by = user.id;
    }

    return ArInvoice.findAll({
      where,
      include: [{ model: ArInvoiceLine, as: "lines" }],
      order: [["id", "DESC"]],
    });
  },

  /** GET DETAIL — chặn cross-branch */
  async getById(id: number, user: any) {
    const inv = await ArInvoice.findByPk(id, {
      include: [{ model: ArInvoiceLine, as: "lines" }],
    });

    if (!inv) throw new Error("Invoice not found");
    if (inv.branch_id !== user.branch_id) throw new Error("Cross-branch denied");
    if (user.role === "ACCOUNT" && inv.created_by !== user.id)
      throw new Error("You can only view your own invoices");

    return inv;
  },

  /** CREATE — Accountant */
  async create(data: any, user: any) {
    const invoice = await ArInvoice.create({
      branch_id: user.branch_id,
      order_id: data.order_id,
      invoice_no: data.invoice_no,
      invoice_date: data.invoice_date,
      created_by: user.id,
      approval_status: "draft",
      status: "draft",
    });

    const lines = [];

    for (const line of data.lines) {
      const t = await this.calcLineTax(line);

      const newLine = await ArInvoiceLine.create({
        invoice_id: invoice.id,
        product_id: line.product_id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        tax_rate_id: line.tax_rate_id,
        line_total: t.line_total,
        line_tax: t.line_tax,
        line_total_after_tax: t.line_total_after_tax,
      });

      lines.push(newLine);
    }

    const totals = await this.calcTotals(lines);

    await invoice.update({
      total_before_tax: totals.total_before_tax,
      total_tax: totals.total_tax,
      total_after_tax: totals.total_after_tax,
    });

    return this.getById(invoice.id, user);
  },

  /** SUBMIT — Accountant */
  async submit(id: number, user: any) {
    const invoice = await ArInvoice.findByPk(id);

    if (!invoice) throw new Error("Invoice not found");
    if (invoice.approval_status !== "draft") throw new Error("Already submitted");
    if (invoice.branch_id !== user.branch_id) throw new Error("Cross-branch denied");

    await invoice.update({
      approval_status: "waiting_approval",
      submitted_at: new Date(),
    });

    return invoice;
  },

  /** APPROVE — Chief Accountant */
  async approve(id: number, approver: any) {
    const invoice = await ArInvoice.findByPk(id);

    if (!invoice) throw new Error("Invoice not found");
    if (invoice.approval_status !== "waiting_approval")
      throw new Error("Wrong approval stage");
    if (invoice.branch_id !== approver.branch_id)
      throw new Error("Cross-branch denied");

    await invoice.update({
      approval_status: "approved",
      approved_by: approver.id,
      approved_at: new Date(),
      status: "posted",
    });

    return invoice;
  },

  /** REJECT — Chief Accountant */
  async reject(id: number, approver: any, reason: string) {
    const invoice = await ArInvoice.findByPk(id);

    if (!invoice) throw new Error("Invoice not found");

    await invoice.update({
      approval_status: "rejected",
      reject_reason: reason,
      approved_by: approver.id,
      status: "draft",
    });

    return invoice;
  },
  // UPDATE INVOICE — only when draft
async update(id: number, data: any, user: any) {
  const invoice = await ArInvoice.findByPk(id);

  if (!invoice) throw new Error("Invoice not found");

  // Chặn cross-branch
  if (invoice.branch_id !== user.branch_id)
    throw new Error("Cross-branch access denied");

  // Chỉ kế toán được sửa
  if (user.role !== "ACCOUNT" && user.role !== "CHACC")
    throw new Error("Permission denied");

  // Chỉ sửa khi ở DRAFT
  if (invoice.approval_status !== "draft" || invoice.status !== "draft")
    throw new Error("Only draft invoices can be updated");

  // Cập nhật thông tin chung
  await invoice.update({
    invoice_date: data.invoice_date,
  });

  // Xóa dòng bị xoá
  if (data.deletedLineIds?.length) {
    await ArInvoiceLine.destroy({ where: { id: data.deletedLineIds } });
  }

  const updatedLines = [];

  // Update hoặc Create line
  for (const line of data.lines) {
    const qty = Number(line.quantity || 0);
    const price = Number(line.unit_price || 0);
    const line_total = qty * price;

    let line_tax = 0;
    let line_total_after_tax = line_total;
    if (line.tax_rate_id) {
      const tax = await TaxRate.findByPk(line.tax_rate_id);
      const rate = tax ? Number(tax.rate) : 0;
      line_tax = (line_total * rate) / 100;
      line_total_after_tax = line_total + line_tax;
    }

    if (line.id) {
      // UPDATE line
      await ArInvoiceLine.update(
        {
          product_id: line.product_id,
          description: line.description,
          quantity: qty,
          unit_price: price,
          tax_rate_id: line.tax_rate_id,
          line_total,
          line_tax,
          line_total_after_tax,
        },
        { where: { id: line.id } }
      );

      const updated = await ArInvoiceLine.findByPk(line.id);
        if (updated) updatedLines.push(updated); 
    } else {
      // CREATE new line
      const newLine = await ArInvoiceLine.create({
        invoice_id: invoice.id,
        product_id: line.product_id,
        description: line.description,
        quantity: qty,
        unit_price: price,
        tax_rate_id: line.tax_rate_id,
        line_total,
        line_tax,
        line_total_after_tax,
      });

      updatedLines.push(newLine);
    }
  }

  // Tính lại tổng tiền
  const totals = updatedLines.reduce(
    (acc, line) => {
      acc.total_before_tax += Number(line.line_total);
      acc.total_tax += Number(line.line_tax);
      acc.total_after_tax += Number(line.line_total_after_tax);
      return acc;
    },
    { total_before_tax: 0, total_tax: 0, total_after_tax: 0 }
  );

  await invoice.update({
    total_before_tax: totals.total_before_tax,
    total_tax: totals.total_tax,
    total_after_tax: totals.total_after_tax,
  });

  return this.getById(id, user);
},

};
