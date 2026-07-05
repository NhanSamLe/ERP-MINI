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
  Company,
  SaleOrder,
  SaleOrderLine,
  PaymentTerm,
  Currency,
  Uom,
  sequelize
} from "../../../models";
import { ArInvoiceStatus, ApprovalStatus } from "../../../core/types/enum";
import {
  generateInvoiceNo
} from "../utils";
import { Transaction } from "sequelize";
import { GlJournal } from "../../finance/models/glJournal.model";
import { GlEntry } from "../../finance/models/glEntry.model";
import { GlEntryLine } from "../../finance/models/glEntryLine.model";
import { notificationService } from "../../../core/services/notification.service";
import { getMappedAccount } from "../../finance/services/glAccount.service";
import { checkPeriodLocked } from "../../finance/services/glJournal.service";
import { assertPostingPeriodOpen } from "../../finance/services/fiscalGuard.service";
import { requireGlAccounts } from "../../finance/services/glAccount.helper";
import { getCompanyIdFromBranch } from "../../finance/services/companyScope.service";
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
    // Chỉ các role được phép xem danh sách hóa đơn
    const viewableRoles = ["ACCOUNT", "CHACC", "BRANCH_MANAGER", "SALESMANAGER", "SALES_MANAGER", "SALES", "CEO", "ADMIN"];
    if (!viewableRoles.includes(user.role)) {
      throw new Error("Permission denied");
    }

    const where: any = {};
    if (user.role !== "CEO" && user.role !== "ADMIN") {
      where.branch_id = user.branch_id;
    }

    return ArInvoice.findAll({
      where,
      include: [
        {
          model: SaleOrder,
          as: "order",
          attributes: ["id", "order_no", "order_date"],
          include: [
            {
              model: Partner,
              as: "customer",
              attributes: ["id", "name", "phone", "email"],
            },
          ],
        },
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol", "name"] },
        { model: Partner, as: "customer", attributes: ["id", "name", "phone", "email", "tax_code", "address"] },
        {
          model: Branch, as: "branch", attributes: ["id", "name", "address", "tax_code", "phone"],
          include: [{ model: Company, as: "company", attributes: ["id", "name", "tax_code", "address", "phone", "email"] }],
        },
        { model: User, as: "creator", attributes: ["id", "username", "full_name"] },
        { model: User, as: "approver", attributes: ["id", "username", "full_name"] },
        {
          model: ArInvoiceLine,
          as: "lines",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image_url", "sale_price", "tax_rate_id", "sku"],
              include: [
                { model: TaxRate, as: "taxRate", attributes: ["id", "name", "rate"] },
                { model: Uom, as: "uom", attributes: ["id", "name", "code"] },
              ],
            },
            { model: TaxRate, as: "taxRate", attributes: ["id", "name", "rate"] },
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
          as: "order",
          attributes: ["id", "order_no", "order_date"],
          include: [
            { model: Partner, as: "customer", attributes: ["id", "name", "phone", "email"] },
          ],
        },
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol", "name"] },
        { model: Partner, as: "customer", attributes: ["id", "name", "phone", "email", "tax_code", "address"] },
        {
          model: Branch, as: "branch", attributes: ["id", "name", "address", "tax_code", "phone"],
          include: [{ model: Company, as: "company", attributes: ["id", "name", "tax_code", "address", "phone", "email"] }],
        },
        { model: User, as: "creator", attributes: ["id", "username", "full_name"] },
        { model: User, as: "approver", attributes: ["id", "username", "full_name"] },
        {
          model: ArInvoiceLine,
          as: "lines",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image_url", "sale_price", "tax_rate_id", "sku"],
              include: [
                { model: TaxRate, as: "taxRate", attributes: ["id", "name", "rate"] },
                { model: Uom, as: "uom", attributes: ["id", "name", "code"] },
              ],
            },
            { model: TaxRate, as: "taxRate", attributes: ["id", "name", "rate"] },
          ],
        },
      ],
    });

    if (!inv) throw new Error("Invoice not found");
    if (user.role !== "CEO" && user.role !== "ADMIN") {
      if (inv.branch_id !== user.branch_id) throw new Error("Cross-branch denied");
    }

    // Các role được phép xem: kế toán, kế toán trưởng, quản lý chi nhánh, quản lý bán hàng
    const viewableRoles = ["ACCOUNT", "CHACC", "BRANCH_MANAGER", "SALESMANAGER", "SALES_MANAGER", "SALES", "CEO", "ADMIN"];
    if (!viewableRoles.includes(user.role)) {
      throw new Error("Permission denied");
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
    if (user.role !== "ACCOUNT" && user.role !== "CHACC" && user.role !== "ADMIN")
      throw new Error("Permission denied");

    if (order.approval_status !== "approved")
      throw new Error("Sale order must be approved before invoicing");

    // Không cho tạo hóa đơn nếu đơn hàng đã bị cancel
    if (order.status === "cancelled")
      throw new Error("Cannot create invoice for a cancelled sale order");

    // Không cho tạo hóa đơn nếu đơn hàng chưa được confirm (chưa qua approve workflow)
    if (!["confirmed", "shipped", "completed"].includes(order.status))
      throw new Error("Sale order must be confirmed before invoicing");

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
    const t = await sequelize.transaction();
    try {
    const invoice_no = await generateInvoiceNo();
    let approval = ApprovalStatus.DRAFT
    let status = ArInvoiceStatus.DRAFT
    if (user.role === "CHACC") {
      approval = ApprovalStatus.APPROVED,
        status = ArInvoiceStatus.POSTED
    }
    // 4.5 Tính Due Date dựa trên Payment Term
    let dueDate = new Date();
    const termId = (order as any).payment_term_id;
    if (termId) {
      const term = await PaymentTerm.findByPk(termId, { transaction: t });
      if (term && term.days) {
        dueDate.setDate(dueDate.getDate() + Number(term.days));
      }
    }

    // 4. Tạo Invoice Header
    const invoice = await ArInvoice.create({
      branch_id: user.branch_id,
      order_id: order.id,
      customer_id: order.customer_id || null,
      invoice_no,
      invoice_date: new Date(),   // auto today
      due_date: dueDate.toISOString().substring(0, 10),
      created_by: user.id,
      approval_status: approval,
      status: status,
      // Phase 4 enhancements — copy from order
      payment_term_id: termId || null,
      currency_id: (order as any).currency_id || null,
      exchange_rate: (order as any).exchange_rate || 1,
    }, { transaction: t });

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
      }, { transaction: t });

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
    }, { transaction: t });

    await order.update({
      invoice_status: "invoiced"
    }, { transaction: t });

    if (invoice.status === "posted" && invoice.approval_status === "approved") {
      await this.postArInvoiceToGL(invoice, t);
    }

    const invoiceId = invoice.id;
    await t.commit();
    return this.getById(invoiceId, user);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  /** SUBMIT — Accountant */
  async submit(id: number, user: any, app?: any) {
    const invoice = await ArInvoice.findByPk(id);

    if (!invoice) throw new Error("Invoice not found");
    if (invoice.approval_status !== "draft") throw new Error("Already submitted");
    if (invoice.branch_id !== user.branch_id) throw new Error("Cross-branch denied");

    await invoice.update({
      approval_status: "waiting_approval",
      submitted_at: new Date(),
    });

    // Gửi thông báo
    if (app) {
      const io = app.get("io");
      await notificationService.createNotification({
        type: "SUBMIT",
        referenceType: "AR_INVOICE",
        referenceId: invoice.id!,
        referenceNo: invoice.invoice_no!,
        branchId: invoice.branch_id!,
        submitterId: user.id,
        submitterName: user.fullName || user.username,
        io,
      });
    }

    return this.getById(invoice.id, user);
  },

  /** APPROVE — Chief Accountant */
  async approve(id: number, approver: any, app?: any) {
    return await sequelize.transaction(async (t) => {
      const invoice = await ArInvoice.findByPk(id, { transaction: t });

      if (!invoice) throw new Error("Invoice not found");
      if (invoice.approval_status !== "waiting_approval")
        throw new Error("Wrong approval stage");
      if (invoice.branch_id !== approver.branch_id)
        throw new Error("Cross-branch denied");
      if (approver.role !== "CHACC" && approver.role !== "ADMIN") {
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

      await this.postArInvoiceToGL(invoice, t);

      // Gửi thông báo (sau khi commit transaction)
      if (app && invoice.created_by) {
        const io = app.get("io");
        // Đợi transaction commit xong mới gửi notification
        setImmediate(async () => {
          await notificationService.createNotification({
            type: "APPROVE",
            referenceType: "AR_INVOICE",
            referenceId: invoice.id!,
            referenceNo: invoice.invoice_no!,
            branchId: invoice.branch_id!,
            submitterId: invoice.created_by!,
            approverName: approver.fullName || approver.username,
            io,
          });
        });
      }

      // Trả về invoice đã cập nhật (có thể load lại nếu cần include lines)
      return this.getById(invoice.id, approver);
    });
  },

  /** REJECT — Chief Accountant */
  async reject(id: number, approver: any, reason: string, app?: any) {
    const invoice = await ArInvoice.findByPk(id);

    if (!invoice) throw new Error("Invoice not found");
    if (approver.role !== "CHACC" && approver.role !== "ADMIN") {
      throw new Error("Permission denied");
    }


    await invoice.update({
      approval_status: "rejected",
      reject_reason: reason,
      approved_by: approver.id,
      status: "draft",
    });

    // Gửi thông báo
    if (app && invoice.created_by) {
      const io = app.get("io");
      await notificationService.createNotification({
        type: "REJECT",
        referenceType: "AR_INVOICE",
        referenceId: invoice.id!,
        referenceNo: invoice.invoice_no!,
        branchId: invoice.branch_id!,
        submitterId: invoice.created_by,
        approverName: approver.fullName || approver.username,
        rejectReason: reason,
        io,
      });
    }

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
    if (user.role !== "ACCOUNT" && user.role !== "CHACC" && user.role !== "ADMIN")
      throw new Error("Permission denied");

    // Chỉ sửa khi ở DRAFT
    if (invoice.approval_status !== "draft" || invoice.status !== "draft")
      throw new Error("Only draft invoices can be updated");

    const t = await sequelize.transaction();
    try {

    // Cập nhật thông tin chung
    await invoice.update({
      invoice_date: data.invoice_date,
    }, { transaction: t });

    // Xóa dòng bị xoá
    if (data.deletedLineIds?.length) {
      await ArInvoiceLine.destroy({
        where: { id: data.deletedLineIds, invoice_id: invoice.id },
        transaction: t,
      });
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
        const tax = await TaxRate.findByPk(line.tax_rate_id, { transaction: t });
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
          { where: { id: line.id, invoice_id: invoice.id }, transaction: t }
        );

        const updated = await ArInvoiceLine.findOne({
          where: { id: line.id, invoice_id: invoice.id },
          transaction: t,
        });
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
        }, { transaction: t });

        updatedLines.push(newLine);
      }
    }

    // Tính lại tổng tiền
    const currentLines = await ArInvoiceLine.findAll({
      where: { invoice_id: invoice.id },
      transaction: t,
    });

    const totals = currentLines.reduce(
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
    }, { transaction: t });

    await t.commit();
    return this.getById(id, user);
    } catch (err) {
      await t.rollback();
      throw err;
    }
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
  },
  async postArInvoiceToGL(invoice: ArInvoice, t: Transaction) {
    if (invoice.status !== "posted" || invoice.approval_status !== "approved") {
      throw new Error("Invoice must be approved & posted before GL posting");
    }

    // Tránh post trùng
    const existed = await GlEntry.findOne({
      where: { reference_type: "AR_INVOICE", reference_id: invoice.id },
      transaction: t,
    });
    if (existed) return existed;

    // Lấy journal SALES — phải thuộc cùng company
    const salesJournal = await GlJournal.findOne({
      where: { code: "SALES" },
      transaction: t,
    });
    if (!salesJournal) throw new Error("GL Journal 'SALES' not found — vui lòng thiết lập Nhật ký Bán hàng");

    const companyId = await getCompanyIdFromBranch(invoice.branch_id, t);

    // Kiểm tra kỳ kế toán có khóa sổ hay chưa
    await checkPeriodLocked(invoice.invoice_date || new Date(), t);

    // Lấy các tài khoản 131, 511, 3331 qua mapping động
    const [arAccId, revenueAccId, vatAccId] = await Promise.all([
      getMappedAccount(invoice.branch_id, "AR_RECEIVABLE", "131", t),
      getMappedAccount(invoice.branch_id, "AR_REVENUE", "511", t),
      getMappedAccount(invoice.branch_id, "AR_VAT", "3331", t),
    ]);

    const rate = Number(invoice.exchange_rate || 1);
    const totalBeforeTax = Number(invoice.total_before_tax || 0) * rate;
    const totalTax = Number(invoice.total_tax || 0) * rate;
    const totalAfterTax = Number(invoice.total_after_tax || 0) * rate;

    const partnerId = invoice.customer_id;
    const entryDate = invoice.invoice_date || new Date();

    // Kiểm tra kỳ kế toán đúng company
    await assertPostingPeriodOpen(entryDate, companyId, t);

    const entry = await GlEntry.create(
      {
        journal_id: salesJournal.id,
        entry_no: `AR-${invoice.invoice_no}`,
        entry_date: entryDate,
        reference_type: "AR_INVOICE",
        reference_id: invoice.id,
        memo: `AR Invoice ${invoice.invoice_no}`,
        status: "posted",
        branch_id: invoice.branch_id ?? null,
      } as any,
      { transaction: t }
    );

    const lines: Partial<GlEntryLine>[] = [
      {
        entry_id: entry.id,
        account_id: arAccId,
        partner_id: partnerId as any,
        debit: totalAfterTax,
        credit: 0,
      },
      {
        entry_id: entry.id,
        account_id: revenueAccId,
        debit: 0,
        credit: totalBeforeTax,
      },
      {
        entry_id: entry.id,
        account_id: vatAccId,
        debit: 0,
        credit: totalTax,
      },
    ];

    await GlEntryLine.bulkCreate(lines as any, { transaction: t });
    return entry;
  },
};

