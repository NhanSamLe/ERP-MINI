// arInvoice.service.ts
import { fn, literal, Op, QueryTypes } from "sequelize";
import { 
  ArInvoice,
  ArInvoiceLine,
  Product,
  TaxRate,
  Partner,
  User,
  Branch,
  SaleOrder,
  SaleOrderLine,
  sequelize
} from "../../../models";
import { ArInvoiceStatus, ApprovalStatus} from "../../../core/types/enum";
import { generateInvoiceNo
 } from "../utils";
// ⭐ thêm mới:
import { sequelize } from "../../../config/db";
import { Transaction } from "sequelize";
import { GlJournal } from "../../finance/models/glJournal.model";
import { GlEntry } from "../../finance/models/glEntry.model";
import { GlEntryLine } from "../../finance/models/glEntryLine.model";
import { GlAccount } from "../../finance/models/glAccount.model";

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

    if (user.role === "ACCOUNT"," CHACC") {
      where.created_by = user.id;
    }

    return ArInvoice.findAll({
      where,
      include: [
        {
        model: SaleOrder,
        as: "order", // << alias đúng
        attributes: ["id", "order_no", "order_date"],
        include: [
          {
            model: Partner,
            as: "customer",
            attributes: ["id", "name", "phone", "email"],
          }
        ]
      },
      {
        model: Branch,
        as: "branch",
        attributes: ["id", "name"],
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
        model: ArInvoiceLine,
        as: "lines",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "image_url", "sale_price", "tax_rate_id", "uom", "sku"],
            include: [
              {
                model: TaxRate,
                 as: "taxRate",
                attributes: ["id", "name", "rate"],
              },
            ],
          },
          {
            model: TaxRate,
            as: "taxRate",
            attributes: ["id", "name", "rate"],
          },
        ],
      },
    ],
    order: [["id", "DESC"]],
    });
  },

  /** GET DETAIL — chặn cross-branch */
  async getById(id: number, user: any) {
    const inv = await ArInvoice.findByPk(id, {
      include: [
      {
        model: SaleOrder,
        as: "order", // << alias đúng
        attributes: ["id", "order_no", "order_date"],
        include: [
          {
            model: Partner,
            as: "customer",
            attributes: ["id", "name", "phone", "email"],
          }
        ]
      },
      {
        model: Branch,
        as: "branch",
        attributes: ["id", "name"],
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
        model: ArInvoiceLine,
        as: "lines",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "image_url", "sale_price", "tax_rate_id"],
            include: [
              {
                model: TaxRate,
                as: "taxRate",   // ✅ alias đúng
                attributes: ["id", "name", "rate"],
              },
            ],
          },
          {
            model: TaxRate,
            as: "taxRate",
            attributes: ["id", "name", "rate"],
          },
        ],
      },
    ],
    });

    if (!inv) throw new Error("Invoice not found");
    if (inv.branch_id !== user.branch_id) throw new Error("Cross-branch denied");
    if (user.role !== "ACCOUNT" && user.role !== "CHACC") {
    throw new Error("Permission denied");
  }

  // 3) ACCOUNT → chỉ xem hóa đơn của mình
  if (user.role === "ACCOUNT" && inv.created_by !== user.id) {
    throw new Error("You can only view your own invoices");
  }

    return inv;
  },

  /** CREATE — Accountant */
  async createFromOrder(orderId: number, user: any) {
    if (!orderId) throw new Error("order_id is required");

    // 1. Lấy Sale Order + Lines
    const order = await SaleOrder.findByPk(orderId, {
      include: [{ model: SaleOrderLine, as: "lines" }],
    });

    if (!order) throw new Error("Sale order not found");
    if (order.branch_id !== user.branch_id)
      throw new Error("Cross-branch denied");

    // Chỉ kế toán được sửa
    if (user.role !== "ACCOUNT" && user.role !== "CHACC")
      throw new Error("Permission denied");
    
    if (order.approval_status !== "approved")
      throw new Error("Sale order must be approved before invoicing");

    // 2. Kiểm tra invoice trùng (nhưng cho phép tạo lại nếu invoice trước bị reject)
    const existing = await ArInvoice.findOne({
      where: { order_id: orderId },
      order: [["id", "DESC"]],
    });

    if (
      existing &&
      existing.approval_status !== "rejected" &&
      existing.status !== "cancelled"
    ) {
      throw new Error("Invoice already exists for this order");
    }

    // 3. Generate invoice_no tự động
    const invoice_no = await generateInvoiceNo();
    let approval = ApprovalStatus.DRAFT
    let status = ArInvoiceStatus.DRAFT
    if(user.role ==="CHACC")
    {
      approval = ApprovalStatus.APPROVED,
      status =ArInvoiceStatus.POSTED
    }
    // 4. Tạo Invoice Header
    const invoice = await ArInvoice.create({
      branch_id: user.branch_id,
      order_id: order.id,
      invoice_no,
      invoice_date: new Date(),   // auto today
      created_by: user.id,
      approval_status: approval,
      status: status,
    });

    // 5. Copy lines từ Sale Order sang Invoice Line
    const createdLines = [];
    const orderAny = order as any;

    for (const line of orderAny.lines) {
      const newLine = await ArInvoiceLine.create({
        invoice_id: invoice.id,
        product_id: line.product_id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        tax_rate_id: line.tax_rate_id,
        line_total: line.line_total,
        line_tax: line.line_tax,
        line_total_after_tax: line.line_total_after_tax,
      });

      createdLines.push(newLine);
    }

    // 6. Tính tổng tiền
    const totals = createdLines.reduce(
      (acc, l) => {
        acc.total_before_tax += Number(l.line_total);
        acc.total_tax += Number(l.line_tax);
        acc.total_after_tax += Number(l.line_total_after_tax);
        return acc;
      },
      { total_before_tax: 0, total_tax: 0, total_after_tax: 0 }
    );

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

    return this.getById(invoice.id, user);
  },

  // /** APPROVE — Chief Accountant */
  // async approve(id: number, approver: any) {
  //   const invoice = await ArInvoice.findByPk(id);

  //   if (!invoice) throw new Error("Invoice not found");
  //   if (invoice.approval_status !== "waiting_approval")
  //     throw new Error("Wrong approval stage");
  //   if (invoice.branch_id !== approver.branch_id)
  //     throw new Error("Cross-branch denied");

  //   await invoice.update({
  //     approval_status: "approved",
  //     approved_by: approver.id,
  //     approved_at: new Date(),
  //     status: "posted",
  //   });

  //   return invoice;
  // },
    /** APPROVE — Chief Accountant */
  async approve(id: number, approver: any) {
    return await sequelize.transaction(async (t) => {
      const invoice = await ArInvoice.findByPk(id, { transaction: t });

      if (!invoice) throw new Error("Invoice not found");
      if (invoice.approval_status !== "waiting_approval")
        throw new Error("Wrong approval stage");
      if (invoice.branch_id !== approver.branch_id)
        throw new Error("Cross-branch denied");
      if (approver.role !== "CHACC") {
    throw new Error("Permission denied");
  }

      // Cập nhật trạng thái invoice → approved + posted
      await invoice.update(
        {
          approval_status: "approved",
          approved_by: approver.id,
          approved_at: new Date(),
          status: "posted",
        },
        { transaction: t }
      );

      // ⭐ Sinh GL Entry + GL Entry Lines cho hóa đơn này
      await this.postArInvoiceToGL(invoice, t);

      // Trả về invoice đã cập nhật (có thể load lại nếu cần include lines)
      return invoice;
    });

    return this.getById(invoice.id, approver); 
  },


  /** REJECT — Chief Accountant */
  async reject(id: number, approver: any, reason: string) {
    const invoice = await ArInvoice.findByPk(id);

    if (!invoice) throw new Error("Invoice not found");
      if (approver.role !== "CHACC") {
    throw new Error("Permission denied");
  }


    await invoice.update({
      approval_status: "rejected",
      reject_reason: reason,
      approved_by: approver.id,
      status: "draft",
    });

     return this.getById(invoice.id, approver); 
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
async getApprovedOrdersWithoutInvoice(user: any) {
  // 1) Lấy tất cả order đã approved trong chi nhánh
  const orders = await SaleOrder.findAll({
    where: {
      branch_id: user.branch_id,
      approval_status: "approved",
    },
    include: [
      { model: Partner, as: "customer" }
    ],
    order: [["id", "DESC"]],
  });

// ⭐ HELPER: Post AR Invoice vào Sổ cái (GL Entry + GL Entry Lines)
  async postArInvoiceToGL(invoice: ArInvoice, t: Transaction) {
    // Không post nếu chưa approved / chưa ở trạng thái posted
    if (invoice.status !== "posted" || invoice.approval_status !== "approved") {
      throw new Error("Invoice must be approved & posted before GL posting");
    }
if (orders.length === 0) return [];

  // 2) Lấy danh sách order_id
  const orderIds = orders
    .map(o => Number(o.id))
    .filter(id => !isNaN(id));    // CHẶN NaN TẠI ĐÂY

  if (orderIds.length === 0) return [];

  // 3) Lấy tất cả invoices 1 lần
  const invoices = await ArInvoice.findAll({
    where: { order_id: orderIds },
    order: [["id", "DESC"]],
  });

  // Map để lấy invoice mới nhất cho mỗi order
  const latestInvoice = new Map<number, ArInvoice>();

  for (const inv of invoices) {
    const id = Number(inv.order_id);
    if (!latestInvoice.has(id)) {
      latestInvoice.set(id, inv);
    }
  }

  // 4) Lọc đúng nghiệp vụ
  const result = [];

  for (const o of orders) {
    const orderId = Number(o.id);

    if (isNaN(orderId)) continue;

    const inv = latestInvoice.get(orderId);

    // ❗ Chưa có invoice
    if (!inv) {
      result.push(o);
      continue;
    }

    // ❗ Có invoice nhưng bị reject → được tạo mới
    if (inv.approval_status === "rejected") {
      result.push(o);
      continue;
    }

    // ❌ Có invoice ở trạng thái hợp lệ → không thêm
  }

  return result;
}

    // Tránh post trùng
    const existed = await GlEntry.findOne({
      where: {
        reference_type: "ar_invoice",
        reference_id: invoice.id,
      },
      transaction: t,
    });

    if (existed) {
      return existed;
    }

    // Lấy journal SALES
    const salesJournal = await GlJournal.findOne({
      where: { code: "SALES" },
      transaction: t,
    });

    if (!salesJournal) {
      throw new Error("GL Journal 'SALES' not found");
    }

    // Lấy các tài khoản 131, 511, 3331
    const [arAcc, revenueAcc, vatAcc] = await Promise.all([
      GlAccount.findOne({ where: { code: "131" }, transaction: t }),
      GlAccount.findOne({ where: { code: "511" }, transaction: t }),
      GlAccount.findOne({ where: { code: "3331" }, transaction: t }),
    ]);

    if (!arAcc || !revenueAcc || !vatAcc) {
      throw new Error("Missing GL Accounts 131 / 511 / 3331");
    }

    const totalBeforeTax = Number(invoice.total_before_tax || 0);
    const totalTax = Number(invoice.total_tax || 0);
    const totalAfterTax = Number(invoice.total_after_tax || 0);

    // Tạo GL Entry
    const entry = await GlEntry.create(
      {
        journal_id: salesJournal.id,
        entry_no: `AR-${invoice.invoice_no}`, // TODO: sau này bạn có thể đổi sang generator chuẩn hơn
        entry_date: invoice.invoice_date || new Date(),
        reference_type: "AR_INVOICE",
        reference_id: invoice.id,
        memo: `AR Invoice ${invoice.invoice_no}`,
        status: "posted",
      },
      { transaction: t }
    );

    // Tạo các dòng Nợ/Có
    const lines: Partial<GlEntryLine>[] = [
      {
        entry_id: entry.id,
        account_id: arAcc.id,
        debit: totalAfterTax,
        credit: 0,
      },
      {
        entry_id: entry.id,
        account_id: revenueAcc.id,
        debit: 0,
        credit: totalBeforeTax,
      },
      {
        entry_id: entry.id,
        account_id: vatAcc.id,
        debit: 0,
        credit: totalTax,
      },
    ];

    await GlEntryLine.bulkCreate(lines as any, { transaction: t });

    return entry;
  },
};
