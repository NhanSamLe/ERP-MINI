import { Role } from "../../../core/types/enum";
import { ApInvoiceLine, Partner, Product, sequelize } from "../../../models";
import { User } from "../../auth/models/user.model";
import { Branch } from "../../company/models/branch.model";
import { ApInvoice } from "../models/apInvoice.model";
import { PurchaseOrder } from "../models/purchaseOrder.model";
import { PurchaseOrderLine } from "../models/purchaseOrderLine.model";
import { Transaction } from "sequelize";
import { GlJournal } from "../../finance/models/glJournal.model";
import { GlEntry } from "../../finance/models/glEntry.model";
import { GlEntryLine } from "../../finance/models/glEntryLine.model";

export const apInvoiceService = {
  async getAll(query: any, user: any) {
    const { status, approval_status } = query;

    const where: any = {
      branch_id: user.branch_id,
    };

    if (user.role === "ACCOUNT") {
      where.created_by = user.id;
    }

    if (status) where.status = status;
    if (approval_status) where.approval_status = approval_status;

    return ApInvoice.findAll({
      where,
      include: [
        { model: Branch, as: "branch" },
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

    if (user.role === "ACCOUNT") {
      where.created_by = user.id;
    }

    return ApInvoice.findOne({
      where,
      include: [
        { model: Branch, as: "branch" },
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
          model: ApInvoiceLine,
          as: "lines",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image_url"],
            },
          ],
        },

        {
          model: PurchaseOrder,
          as: "order",
          include: [
            {
              model: Partner,
              as: "supplier",
              attributes: ["id", "name", "email", "phone"],
            },
          ],
        },
      ],
    });
  },

  async createFromPO(poId: number, user: any) {
    if (![Role.ACCOUNT].includes(user.role)) {
      throw {
        status: 403,
        message: "You do not have permission to create AP Invoice",
      };
    }

    try {
      const po = await PurchaseOrder.findByPk(poId);

      if (!po) {
        throw { status: 404, message: "Purchase Order not found" };
      }

      if (po.branch_id !== user.branch_id) {
        throw {
          status: 403,
          message: "You cannot create invoice for another branch",
        };
      }

      if (po.status !== "confirmed" && po.status !== "completed") {
        throw {
          status: 400,
          message:
            "Only CONFIRMED And COMPLETED Purchase Orders can create AP Invoice",
        };
      }

      const existed = await ApInvoice.findOne({
        where: { po_id: po.id },
      });

      if (existed) {
        throw {
          status: 400,
          message: "AP Invoice already exists for this Purchase Order",
        };
      }

      if (!po.branch_id) {
        throw new Error("Purchase Order missing branch_id");
      }

      const invoiceNo = `AP-${new Date().getFullYear()}-${Date.now()}`;

      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice = await ApInvoice.create({
        po_id: po.id,
        invoice_no: invoiceNo,
        invoice_date: invoiceDate,
        due_date: dueDate,
        total_before_tax: Number(po.total_before_tax),
        total_tax: Number(po.total_tax),
        total_after_tax: Number(po.total_after_tax),
        status: "draft",
        approval_status: "draft",
        created_by: user.id,
        approved_by: null,
        submitted_at: null,
        approved_at: null,
        reject_reason: null,
        branch_id: po.branch_id,
      });

      const poLines = await PurchaseOrderLine.findAll({
        where: { po_id: po.id },
      });

      if (!poLines.length) {
        throw {
          status: 400,
          message: "Purchase Order has no line items",
        };
      }

      const invoiceLines = poLines.map((line) => {
        const base: any = {
          ap_invoice_id: invoice.id,
          product_id: line.product_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
          tax_rate_id: line.tax_rate_id,
          line_total: line.line_total,
          line_tax: line.line_tax,
          line_total_after_tax: line.line_total_after_tax,
        };

        if (po.description) {
          base.description = po.description;
        }

        return base;
      });

      await ApInvoiceLine.bulkCreate(invoiceLines);
      return this.getById(invoice.id, user);
    } catch (err) {
      throw err;
    }
  },

  async submitForApproval(id: number, user: any) {
    const apInvoice = await this.getById(id, user);
    if (!apInvoice) throw new Error("ApInvoice order not found");

    if (apInvoice.branch_id !== user.branch_id) {
      throw new Error("You cannot submit a invoice for another branch.");
    }

    if (apInvoice.status !== "draft") {
      throw new Error("Only draft invoice can be submitted.");
    }

    if (apInvoice.created_by !== user.id)
      throw new Error("Only the creator can submit");

    apInvoice.approval_status = "waiting_approval";
    apInvoice.submitted_at = new Date();

    await apInvoice.save();

    return this.getById(apInvoice.id, user);
  },

  async approve(id: number, user: any) {
  if (user.role !== Role.CHACC) throw new Error("Only Chief Accountant can approve");

  const t: Transaction = await sequelize.transaction();
  try {
    const invoice = await ApInvoice.findByPk(id, {
      include: [
        { model: PurchaseOrder, as: "order" },      // để lấy supplier_id
        { model: ApInvoiceLine, as: "lines" },      // nếu cần
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!invoice) throw new Error("AP Invoice not found");
    if (invoice.branch_id !== user.branch_id) throw new Error("Cross-branch denied");
    if (invoice.approval_status !== "waiting_approval") throw new Error("Invoice is not waiting for approval");

    // 1) Update trạng thái invoice
    await invoice.update(
      {
        approval_status: "approved",
        status: "posted",
        approved_by: user.id,
        approved_at: new Date(),
        reject_reason: null,
      },
      { transaction: t }
    );

    // 2) Lấy journal PURCHASE
    const journal = await GlJournal.findOne({
      where: { code: "PURCHASE" },
      transaction: t,
    });
    if (!journal) throw new Error("PURCHASE journal not found");

    // 3) Tạo GL Entry
    const entry = await GlEntry.create(
      {
        journal_id: journal.id,
        entry_no: `GL-AP-${invoice.id}`,
        entry_date: invoice.invoice_date ?? new Date(),
        reference_type: "ap_invoice",
        reference_id: invoice.id,
        memo: `Ghi nhận công nợ phải trả ${invoice.invoice_no}`,
        status: "posted",
      },
      { transaction: t }
    );

    // 4) Map account_id theo DB của bạn (id=8 là 156, id=4 là 1331, id=5 là 331)
    const INVENTORY_ACC_ID = 8; // 156
    const VAT_INPUT_ACC_ID = 4; // 1331
    const AP_ACC_ID = 5;        // 331

    const totalBeforeTax = Number(invoice.total_before_tax || 0);
    const totalTax = Number(invoice.total_tax || 0);
    const totalAfterTax = Number(invoice.total_after_tax || 0);

    const supplierId = (invoice as any).order?.supplier_id ?? null;

    // 5) Tạo GL lines
    const lines: any[] = [];

    if (totalBeforeTax !== 0) {
      lines.push({
        entry_id: entry.id,
        account_id: INVENTORY_ACC_ID,
        partner_id: supplierId,
        debit: totalBeforeTax,
        credit: 0,
      });
    }

    if (totalTax !== 0) {
      lines.push({
        entry_id: entry.id,
        account_id: VAT_INPUT_ACC_ID,
        partner_id: supplierId,
        debit: totalTax,
        credit: 0,
      });
    }

    lines.push({
      entry_id: entry.id,
      account_id: AP_ACC_ID,
      partner_id: supplierId,
      debit: 0,
      credit: totalAfterTax,
    });

    await GlEntryLine.bulkCreate(lines, { transaction: t });

    await t.commit();

    // trả về detail đầy đủ sau approve
    return this.getById(invoice.id, user);
  } catch (e) {
    await t.rollback();
    throw e;
  }
},

  async reject(id: number, reason: string, user: any) {
    if (user.role !== Role.CHACC) {
      throw new Error("Only Chief Accountant can reject");
    }

    const invoice = await ApInvoice.findByPk(id);

    if (!invoice) throw new Error("AP Invoice not found");

    if (invoice.branch_id !== user.branch_id) {
      throw new Error("You cannot reject invoice from another branch");
    }

    if (invoice.approval_status !== "waiting_approval") {
      throw new Error("Invoice is not waiting for approval");
    }

    invoice.approval_status = "rejected";
    invoice.status = "cancelled";
    invoice.approved_by = user.id;
    invoice.approved_at = new Date();
    invoice.reject_reason = reason;

    await invoice.save();

    return this.getById(invoice.id, user);
  },

  async getPostedSummaryBySupplier(supplierId: number, user: any) {
    const invoices: any[] = await sequelize.query(
      `
    SELECT
      ai.id,
      ai.invoice_no,
      ai.invoice_date,
      ai.total_after_tax,
      ai.po_id,

      COALESCE(ai.total_after_tax - SUM(apa.applied_amount), ai.total_after_tax)
        AS outstanding_amount,

      po.po_no,
      p.id   AS supplier_id,
      p.name AS supplier_name
    FROM ap_invoices ai
    JOIN purchase_orders po
      ON po.id = ai.po_id
    JOIN partners p
      ON p.id = po.supplier_id
    LEFT JOIN ap_payment_allocations apa
      ON apa.ap_invoice_id = ai.id
    WHERE ai.branch_id = :branchId
      AND ai.status IN ('posted')
      AND po.supplier_id = :supplierId
    GROUP BY
      ai.id, po.id, p.id
    ORDER BY ai.invoice_date ASC
    `,
      {
        replacements: {
          branchId: user.branch_id,
          supplierId,
        },
        type: "SELECT",
      }
    );

    const totalAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.outstanding_amount),
      0
    );

    return {
      invoices,
      total_amount: totalAmount,
    };
  },

  async getPostedSuppliers(user: any) {
    const invoices = await ApInvoice.findAll({
      where: {
        branch_id: user.branch_id,
        status: "posted",
      },
      include: [
        {
          model: PurchaseOrder,
          as: "order",
          required: true,
          include: [
            {
              model: Partner,
              as: "supplier",
            },
          ],
        },
      ],
    });
    console.log("CHECK: ", invoices);

    const map = new Map<number, any>();

    invoices.forEach((inv: any) => {
      const supplier = inv.order?.supplier;
      if (supplier && !map.has(supplier.id)) {
        map.set(supplier.id, supplier);
      }
    });

    return Array.from(map.values());
  },
};
