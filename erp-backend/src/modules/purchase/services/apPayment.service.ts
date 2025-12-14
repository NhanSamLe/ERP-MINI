import { Role } from "../../../core/types/enum";
import { ApPayment } from "../models/apPayment.model";
import { User } from "../../auth/models/user.model";
import { Branch } from "../../company/models/branch.model";
import { Partner } from "../../../models";

export const apPaymentService = {
  async getAll(query: any, user: any) {
    const { status, approval_status } = query;

    const where: any = {
      branch_id: user.branch_id,
    };

    if (user.role === Role.ACCOUNT) {
      where.created_by = user.id;
    }

    if (status) where.status = status;
    if (approval_status) where.approval_status = approval_status;

    return ApPayment.findAll({
      where,
      include: [
        { model: Branch, as: "branch" },
        {
          model: Partner,
          as: "supplier",
          attributes: ["id", "name", "email", "phone"],
        },
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

    if (user.role === Role.ACCOUNT) {
      where.created_by = user.id;
    }

    return ApPayment.findOne({
      where,
      include: [
        { model: Branch, as: "branch" },
        {
          model: Partner,
          as: "supplier",
          attributes: ["id", "name", "email", "phone"],
        },
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
    });
  },

  async create(payload: any, user: any) {
    if (user.role !== Role.ACCOUNT) {
      throw {
        status: 403,
        message: "You do not have permission to create AP Payment",
      };
    }

    if (!payload.supplier_id) {
      throw { status: 400, message: "Supplier is required" };
    }

    if (!payload.amount || payload.amount <= 0) {
      throw { status: 400, message: "Amount must be greater than zero" };
    }

    const paymentNo = `PAY-${Date.now()}`;

    const payment = await ApPayment.create({
      payment_no: paymentNo,
      supplier_id: payload.supplier_id,
      payment_date: payload.payment_date || new Date(),
      amount: payload.amount,
      method: payload.method,
      status: "draft",
      approval_status: "draft",
      created_by: user.id,
      approved_by: null,
      submitted_at: null,
      approved_at: null,
      reject_reason: null,
      branch_id: user.branch_id,
    });

    return this.getById(payment.id, user);
  },

  async submitForApproval(id: number, user: any) {
    const payment = await this.getById(id, user);
    if (!payment) throw new Error("AP Payment not found");

    if (payment.created_by !== user.id) {
      throw new Error("Only creator can submit payment");
    }

    if (payment.status !== "draft") {
      throw new Error("Only draft payment can be submitted");
    }

    payment.approval_status = "waiting_approval";
    payment.submitted_at = new Date();

    await payment.save();
    return this.getById(payment.id, user);
  },

  async approve(id: number, user: any) {
    if (user.role !== Role.CHACC) {
      throw new Error("Only Chief Accountant can approve");
    }

    const payment = await ApPayment.findByPk(id);
    if (!payment) throw new Error("AP Payment not found");

    if (payment.branch_id !== user.branch_id) {
      throw new Error("You cannot approve payment from another branch");
    }

    if (payment.approval_status !== "waiting_approval") {
      throw new Error("Payment is not waiting for approval");
    }

    payment.approval_status = "approved";
    payment.status = "posted";
    payment.approved_by = user.id;
    payment.approved_at = new Date();
    payment.reject_reason = null;

    await payment.save();
    return this.getById(payment.id, user);
  },

  async reject(id: number, reason: string, user: any) {
    if (user.role !== Role.CHACC) {
      throw new Error("Only Chief Accountant can reject");
    }

    const payment = await ApPayment.findByPk(id);
    if (!payment) throw new Error("AP Payment not found");

    if (payment.branch_id !== user.branch_id) {
      throw new Error("You cannot reject payment from another branch");
    }

    if (payment.approval_status !== "waiting_approval") {
      throw new Error("Payment is not waiting for approval");
    }

    payment.approval_status = "rejected";
    payment.status = "cancelled";
    payment.approved_by = user.id;
    payment.approved_at = new Date();
    payment.reject_reason = reason;

    await payment.save();
    return this.getById(payment.id, user);
  },
};
