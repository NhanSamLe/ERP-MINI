import { Role } from "../../../core/types/enum";
import { Partner, Product } from "../../../models";
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
          model: PurchaseOrder,
          as: "order",
          include: [
            {
              model: PurchaseOrderLine,
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
      return this.getById(invoice.id, user);
    } catch (err) {
      throw err;
    }
  },
};
