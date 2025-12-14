import { Role } from "../../../core/types/enum";
import { ApInvoiceLine, Partner, Product } from "../../../models";
import { User } from "../../auth/models/user.model";
import { Branch } from "../../company/models/branch.model";
import { ApInvoice } from "../models/apInvoice.model";
import { PurchaseOrder } from "../models/purchaseOrder.model";
import { PurchaseOrderLine } from "../models/purchaseOrderLine.model";

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

      if (po.status !== "confirmed") {
        throw {
          status: 400,
          message: "Only CONFIRMED Purchase Orders can create AP Invoice",
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
    if (user.role !== Role.CHACC) {
      throw new Error("Only Chief Accountant can approve");
    }

    const invoice = await ApInvoice.findByPk(id);

    if (!invoice) throw new Error("AP Invoice not found");

    if (invoice.branch_id !== user.branch_id) {
      throw new Error("You cannot approve invoice from another branch");
    }

    if (invoice.approval_status !== "waiting_approval") {
      throw new Error("Invoice is not waiting for approval");
    }

    invoice.approval_status = "approved";
    invoice.status = "posted";
    invoice.approved_by = user.id;
    invoice.approved_at = new Date();
    invoice.reject_reason = null;

    await invoice.save();

    return this.getById(invoice.id, user);
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
};
