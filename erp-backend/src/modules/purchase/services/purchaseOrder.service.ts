import { PurchaseOrder } from "../models/purchaseOrder.model";
import { PurchaseOrderLine } from "../models/purchaseOrderLine.model";
import { PurchaseOrderUpdateDto } from "../dto/purchaseOrderUpdate.dto";
import { StockMoveLine } from "../../inventory/models/stockMoveLine.model";
import { StockMove } from "../../inventory/models/stockMove.model";
import { productService } from "../../product/services/product.service";
import { JwtPayload } from "../../../core/types/jwt";
import { User } from "../../../models";
import { Role } from "../../../core/types/enum";
import { Op } from "sequelize";

export const purchaseOrderService = {
  async getAllPO(user: JwtPayload) {
    const where: any = { branch_id: user.branch_id };

    if (user.role === Role.PURCHASE) {
      where.created_by = user.id;
    }

    return await PurchaseOrder.findAll({
      where,
      include: [
        { model: PurchaseOrderLine, as: "lines" },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "full_name"],
        },
      ],
      order: [["id", "DESC"]],
    });
  },

  async getByStatus(statusList: string[], user: any) {
    return PurchaseOrder.findAll({
      include: [{ model: PurchaseOrderLine, as: "lines" }],
      where: { status: { [Op.in]: statusList }, branch_id: user.branch_id },
    });
  },

  async getPOById(id: number) {
    const po = await PurchaseOrder.findByPk(id, {
      include: [
        { model: PurchaseOrderLine, as: "lines" },
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

    if (!po) throw new Error("Purchase order not found");
    return po;
  },

  async create(data: any, user: any) {
    const allowedRoles = ["PURCHASE"];

    if (!allowedRoles.includes(user.role)) {
      throw new Error("You do not have permission to create purchase orders.");
    }

    if (data.branch_id !== user.branch_id) {
      throw new Error("You cannot create a purchase order for another branch.");
    }
    const po = await PurchaseOrder.create({
      branch_id: data.branch_id,
      po_no: data.po_no,
      supplier_id: data.supplier_id,
      order_date: data.order_date,
      created_by: user.id,
      total_before_tax: data.total_before_tax,
      total_tax: data.total_tax,
      total_after_tax: data.total_after_tax,
      status: "draft",
      description: data.description,
    });

    // 4. Tạo line
    for (const line of data.lines) {
      await PurchaseOrderLine.create({
        ...line,
        po_id: po.id,
      });
    }

    return this.getPOById(po.id);
  },

  async update(id: number, data: PurchaseOrderUpdateDto, user: any) {
    const allowedRoles = ["PURCHASE"];

    if (!allowedRoles.includes(user.role)) {
      throw new Error("You do not have permission to edit purchase orders.");
    }

    if (data.branch_id !== user.branch_id) {
      throw new Error("You cannot edit a purchase order for another branch.");
    }

    const po = await PurchaseOrder.findByPk(id, {
      include: [{ model: PurchaseOrderLine, as: "lines" }],
    });

    if (!po) throw new Error("Purchase order not found");
    if (po.status !== "draft") {
      throw {
        status: 400,
        message:
          "Cannot edit the purchase order because it has already been approved",
      };
    }

    if (po.created_by !== user.id)
      throw new Error("You can only modify your own orders");

    await po.update({
      branch_id: data.branch_id,
      po_no: data.po_no,
      supplier_id: data.supplier_id,
      order_date: new Date(data.order_date),
      total_before_tax: data.total_before_tax,
      total_tax: data.total_tax,
      total_after_tax: data.total_after_tax,
      description: data.description,
    });

    if (data.deletedLineIds?.length) {
      await PurchaseOrderLine.destroy({
        where: { id: data.deletedLineIds, po_id: id },
      });
    }

    if (data.lines?.length) {
      for (const line of data.lines) {
        if (line.id) {
          await PurchaseOrderLine.update(
            {
              product_id: line.product_id,
              quantity: line.quantity,
              unit_price: line.unit_price,
              tax_rate_id: line.tax_rate_id,
              line_total: line.line_total,
            },
            { where: { id: line.id, po_id: id } }
          );
        } else {
          await PurchaseOrderLine.create({
            po_id: id,
            product_id: line.product_id,
            quantity: line.quantity,
            unit_price: line.unit_price,
            tax_rate_id: line.tax_rate_id,
            line_total: line.line_total,
          });
        }
      }
    }
    return this.getPOById(id);
  },

  async delete(id: number, user: any) {
    const po = await PurchaseOrder.findByPk(id);
    const allowedRoles = ["PURCHASE"];

    if (!allowedRoles.includes(user.role)) {
      throw new Error("You do not have permission to delete purchase orders.");
    }

    if (po?.branch_id !== user.branch_id) {
      throw new Error("You cannot delete a purchase order for another branch.");
    }

    if (!po) throw new Error("Purchase order not found");
    if (po.status !== "draft") {
      throw new Error(
        "Cannot delete the purchase order because it has already been approved"
      );
    }
    if (po.created_by !== user.id)
      throw new Error("You can only delete your own orders");

    await po.destroy();
    return { success: true };
  },

  async approvalPO(id: number, user: any) {
    const po = await this.getPOById(id);
    if (!po) throw new Error("Purchase order not found");

    if (user.role !== Role.PURCHASEMANAGER) {
      throw new Error("You do not have permission to approve purchase orders.");
    }
    if (po.branch_id !== user.branch_id) {
      throw new Error(
        "You cannot approve a purchase order for another branch."
      );
    }

    if (po.status !== "waiting_approval") {
      throw new Error(
        "Only purchase orders in 'waiting_approval' can be approved."
      );
    }
    po.status = "confirmed";
    po.approved_by = user.id;
    po.approved_at = new Date();
    await po.save();
    return po;
  },

  async cancelPO(id: number, user: any, reason: string) {
    const po = await this.getPOById(id);
    if (!po) throw new Error("Purchase order not found");

    if (user.role !== Role.PURCHASEMANAGER) {
      throw new Error("You do not have permission to cancel purchase orders.");
    }

    if (po.branch_id !== user.branch_id) {
      throw new Error("You cannot cancel a purchase order for another branch.");
    }

    if (po.status !== "waiting_approval") {
      throw new Error(
        "Only purchase orders in 'waiting_approval' can be cancelled."
      );
    }

    if (!reason || reason.trim() === "") {
      throw new Error("Reject reason is required to cancel a purchase order.");
    }

    po.status = "cancelled";
    po.approved_by = user.id;
    po.approved_at = new Date();
    po.reject_reason = reason.trim();
    await po.save();
    return po;
  },

  async submitForApproval(id: number, user: any) {
    const po = await this.getPOById(id);
    if (!po) throw new Error("Purchase order not found");

    if (po.branch_id !== user.branch_id) {
      throw new Error("You cannot submit a purchase order for another branch.");
    }

    if (po.status !== "draft") {
      throw new Error("Only draft purchase orders can be submitted.");
    }

    if (po.created_by !== user.id)
      throw new Error("Only the creator can submit");

    po.status = "waiting_approval";
    po.submitted_at = new Date();

    await po.save();

    return po;
  },

  // Tính toán cho phần phiếu nhập kho
  async getPOLines(poId: number) {
    const lines = await PurchaseOrderLine.findAll({
      where: { po_id: poId },
    });

    if (!lines.length) {
      throw {
        status: 400,
        message: "Purchase Order không có dòng sản phẩm.",
      };
    }

    return lines;
  },

  /** Lấy tổng số lượng đã nhập cho 1 sản phẩm từ các StockMove đã posted */
  async getAlreadyReceivedQty(
    poId: number,
    productId: number
  ): Promise<number> {
    // 1. Lấy tất cả stock moves thuộc PO đang posted
    const postedMoves = await StockMove.findAll({
      where: {
        reference_id: poId,
        reference_type: "purchase_order",
        status: "posted",
      },
      attributes: ["id"],
      raw: true,
    });

    if (postedMoves.length === 0) return 0;

    const moveIds = postedMoves.map((m) => m.id);

    // 2. Lấy tất cả StockMoveLine của các move đó + productId
    const lines = await StockMoveLine.findAll({
      where: {
        move_id: moveIds,
        product_id: productId,
      },
      attributes: ["quantity"],
      raw: true,
    });

    // 3. SUM bằng JS (an toàn, dễ debug)
    return lines.reduce((sum, l) => sum + Number(l.quantity), 0);
  },

  /** Kiểm tra sản phẩm có trong PO không */
  async validateProductInPO(
    map: Map<number, PurchaseOrderLine>,
    productId: number
  ) {
    const poLine = map.get(productId);
    if (!poLine) {
      const productResult = await productService.getById(productId);
      throw {
        status: 400,
        message: `Sản phẩm  ${productResult?.name} không có trong Purchase Order.`,
      };
    }
    return poLine;
  },

  async validateRemainingQuantity(
    productId: number,
    inputQty: number,
    poQty: number,
    receivedQty: number
  ) {
    const remaining = poQty - receivedQty;

    if (inputQty > remaining) {
      const productResult = await productService.getById(productId);
      throw {
        status: 400,
        message: `Sản phẩm ${productResult?.name} vượt quá số lượng Purchase Order còn lại. Còn lại: ${remaining}, nhập: ${inputQty}`,
      };
    }
  },
};
