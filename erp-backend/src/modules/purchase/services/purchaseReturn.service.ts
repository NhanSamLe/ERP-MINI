import { Op } from "sequelize";
import { sequelize } from "../../../config/db";
import { PurchaseReturnAuthorization } from "../models/purchaseReturnAuthorization.model";
import { PurchaseReturn } from "../models/purchaseReturn.model";
import { PurchaseReturnLine } from "../models/purchaseReturnLine.model";
import { ApDebitNote } from "../models/apDebitNote.model";
import { ApDebitNoteLine } from "../models/apDebitNoteLine.model";
import { VendorRefund } from "../models/vendorRefund.model";
import { GlEntry } from "../../finance/models/glEntry.model";
import { GlEntryLine } from "../../finance/models/glEntryLine.model";
import { GlJournal } from "../../finance/models/glJournal.model";
import { GlAccount } from "../../finance/models/glAccount.model";
import { requireGlAccounts } from "../../finance/services/glAccount.helper";
import { getCompanyIdFromBranch } from "../../finance/services/companyScope.service";
import { Partner, StockMove, Warehouse } from "../../../models";
import { User } from "../../auth/models/user.model";
import { Branch } from "../../company/models/branch.model";
import { Product } from "../../product/models/product.model";
import { UomConversion } from "../../master-data/models/uomConversion.model";
import { Uom } from "../../master-data/models/uom.model";
import { PurchaseOrder } from "../models/purchaseOrder.model";
import { ApInvoice } from "../models/apInvoice.model";
import { purchaseNotificationService } from "./purchaseNotification.service";

/** Generator số chứng từ chuẩn: PREFIX-YYYYMMDD-XXXX, retry loop tránh race condition */
async function generateNo(prefix: string, model: any, field: string): Promise<string> {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const base = `${prefix}-${dateStr}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await model.count({ where: { [field]: { [Op.like]: `${base}%` } } });
    const candidate = `${base}-${String(count + 1).padStart(4, "0")}`;
    const exists = await model.findOne({ where: { [field]: candidate } });
    if (!exists) return candidate;
  }
  return `${base}-${Date.now()}`;
}

const PRA_INCLUDE = [
  { model: Branch, as: "branch" },
  { model: Partner, as: "supplier", attributes: ["id", "name", "email"] },
  { model: User, as: "creator", attributes: ["id", "full_name", "avatar_url"] },
  {
    model: User,
    as: "approver",
    attributes: ["id", "full_name", "avatar_url"],
  },
];

const RETURN_INCLUDE = [
  { model: Branch, as: "branch" },
  { model: Partner, as: "supplier", attributes: ["id", "name", "email"] },
  { model: User, as: "creator", attributes: ["id", "full_name", "avatar_url"] },
  {
    model: PurchaseReturnLine,
    as: "lines",
    include: [
      { model: Product, as: "product", attributes: ["id", "name"] },
      { model: Uom, as: "uom", attributes: ["id", "name"] },
    ],
  },
  { model: StockMove, as: "stockMove" },
  { model: Warehouse, as: "warehouse" },
];

// ─── PRA Service ──────────────────────────────────────────────────────────────

export const praService = {
  async getAll(query: any, user: any) {
    const where: any = { branch_id: user.branch_id };
    if (query.status) where.status = query.status;
    if (query.supplier_id) where.supplier_id = Number(query.supplier_id);
    if (query.return_type) where.return_type = query.return_type;

    return PurchaseReturnAuthorization.findAll({
      where,
      include: [
        { model: Partner, as: "supplier", attributes: ["id", "name"] },
        { model: User, as: "creator", attributes: ["id", "full_name"] },
      ],
      order: [["created_at", "DESC"]],
    });
  },

  async getById(id: number, user: any) {
    const pra = await PurchaseReturnAuthorization.findOne({
      where: { id, branch_id: user.branch_id },
      include: PRA_INCLUDE,
    });
    if (!pra) throw { status: 404, message: "PRA not found" };
    return pra;
  },

  async create(payload: any, user: any) {
    if (!payload.purchase_order_id)
      throw { status: 400, message: "purchase_order_id is required" };
    if (!payload.supplier_id)
      throw { status: 400, message: "supplier_id is required" };
    if (!payload.reason?.trim())
      throw { status: 400, message: "reason is required" };

    // Validate PO
    const po = await PurchaseOrder.findOne({
      where: { id: payload.purchase_order_id, branch_id: user.branch_id },
    });
    if (!po) {
      throw { status: 404, message: "Đơn mua hàng (PO) không tồn tại hoặc không thuộc chi nhánh này" };
    }
    if (Number(po.supplier_id) !== Number(payload.supplier_id)) {
      throw { status: 400, message: "Đơn mua hàng không khớp với Nhà cung cấp đã chọn" };
    }
    if (!["confirmed", "partially_received", "completed"].includes(po.status)) {
      throw { status: 400, message: "Đơn mua hàng phải ở trạng thái Đã xác nhận, Đã nhận hàng một phần hoặc Đã hoàn thành" };
    }

    // Validate AP Invoice
    let maxAmount = Number(po.total_after_tax ?? 0);
    if (payload.ap_invoice_id) {
      const inv = await ApInvoice.findOne({
        where: { id: payload.ap_invoice_id, branch_id: user.branch_id },
      });
      if (!inv) {
        throw { status: 404, message: "Hóa đơn mua hàng (AP) không tồn tại hoặc không thuộc chi nhánh này" };
      }
      if (Number(inv.po_id) !== Number(po.id)) {
        throw { status: 400, message: "Hóa đơn không khớp với Đơn mua hàng (PO) đã chọn" };
      }
      if (Number(inv.supplier_id) !== Number(po.supplier_id)) {
        throw { status: 400, message: "Hóa đơn không khớp với Nhà cung cấp của PO" };
      }
      if (inv.status === "draft" || inv.status === "cancelled") {
        throw { status: 400, message: "Hóa đơn mua hàng không hợp lệ (không được ở trạng thái Nháp hoặc Đã hủy)" };
      }
      maxAmount = Number(inv.total_after_tax ?? 0);
    }

    const returnAmount = Number(payload.total_return_amount ?? 0);
    if (returnAmount <= 0) {
      throw { status: 400, message: "Tổng giá trị trả hàng phải lớn hơn 0" };
    }
    if (returnAmount > maxAmount) {
      throw {
        status: 400,
        message: `Tổng giá trị trả hàng (${returnAmount.toLocaleString("vi-VN")}đ) không được vượt quá tổng giá trị của ${payload.ap_invoice_id ? "Hóa đơn" : "Đơn hàng"} (${maxAmount.toLocaleString("vi-VN")}đ)`,
      };
    }

    const pra = await PurchaseReturnAuthorization.create({
      branch_id: user.branch_id,
      pra_no: await generateNo("PRA", PurchaseReturnAuthorization, "pra_no"),
      purchase_order_id: payload.purchase_order_id,
      ap_invoice_id: payload.ap_invoice_id ?? null,
      supplier_id: payload.supplier_id,
      reason: payload.reason,
      return_type: payload.return_type ?? "debit_note",
      status: "draft",
      approval_status: "draft",
      total_return_amount: returnAmount,
      created_by: user.id,
      notes: payload.notes ?? null,
    });

    return this.getById(pra.id, user);
  },

  async update(id: number, payload: any, user: any) {
    const pra = await PurchaseReturnAuthorization.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!pra) throw { status: 404, message: "PRA not found" };
    if (pra.status !== "draft")
      throw { status: 400, message: "Only draft PRA can be edited" };

    if (!payload.purchase_order_id)
      throw { status: 400, message: "purchase_order_id is required" };
    if (!payload.supplier_id)
      throw { status: 400, message: "supplier_id is required" };
    if (!payload.reason?.trim())
      throw { status: 400, message: "reason is required" };

    // Validate PO
    const po = await PurchaseOrder.findOne({
      where: { id: payload.purchase_order_id, branch_id: user.branch_id },
    });
    if (!po) {
      throw { status: 404, message: "Đơn mua hàng (PO) không tồn tại hoặc không thuộc chi nhánh này" };
    }
    if (Number(po.supplier_id) !== Number(payload.supplier_id)) {
      throw { status: 400, message: "Đơn mua hàng không khớp với Nhà cung cấp đã chọn" };
    }
    if (!["confirmed", "partially_received", "completed"].includes(po.status)) {
      throw { status: 400, message: "Đơn mua hàng phải ở trạng thái Đã xác nhận, Đã nhận hàng một phần hoặc Đã hoàn thành" };
    }

    // Validate AP Invoice
    let maxAmount = Number(po.total_after_tax ?? 0);
    if (payload.ap_invoice_id) {
      const inv = await ApInvoice.findOne({
        where: { id: payload.ap_invoice_id, branch_id: user.branch_id },
      });
      if (!inv) {
        throw { status: 404, message: "Hóa đơn mua hàng (AP) không tồn tại hoặc không thuộc chi nhánh này" };
      }
      if (Number(inv.po_id) !== Number(po.id)) {
        throw { status: 400, message: "Hóa đơn không khớp với Đơn mua hàng (PO) đã chọn" };
      }
      if (Number(inv.supplier_id) !== Number(po.supplier_id)) {
        throw { status: 400, message: "Hóa đơn không khớp với Nhà cung cấp của PO" };
      }
      if (inv.status === "draft" || inv.status === "cancelled") {
        throw { status: 400, message: "Hóa đơn mua hàng không hợp lệ (không được ở trạng thái Nháp hoặc Đã hủy)" };
      }
      maxAmount = Number(inv.total_after_tax ?? 0);
    }

    const returnAmount = Number(payload.total_return_amount ?? 0);
    if (returnAmount <= 0) {
      throw { status: 400, message: "Tổng giá trị trả hàng phải lớn hơn 0" };
    }
    if (returnAmount > maxAmount) {
      throw {
        status: 400,
        message: `Tổng giá trị trả hàng (${returnAmount.toLocaleString("vi-VN")}đ) không được vượt quá tổng giá trị của ${payload.ap_invoice_id ? "Hóa đơn" : "Đơn hàng"} (${maxAmount.toLocaleString("vi-VN")}đ)`,
      };
    }

    await pra.update({
      purchase_order_id: payload.purchase_order_id,
      supplier_id: payload.supplier_id,
      ap_invoice_id: payload.ap_invoice_id ?? null,
      reason: payload.reason,
      return_type: payload.return_type ?? "debit_note",
      total_return_amount: returnAmount,
      notes: payload.notes ?? null,
    });

    return this.getById(id, user);
  },

  async submit(id: number, user: any) {
    const pra = await PurchaseReturnAuthorization.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!pra) throw { status: 404, message: "PRA not found" };
    if (pra.status !== "draft")
      throw { status: 400, message: "Only draft PRA can be submitted" };

    await pra.update({
      status: "submitted",
      approval_status: "waiting_approval",
      submitted_at: new Date(),
    });
    return this.getById(id, user);
  },

  async approve(id: number, user: any) {
    const pra = await PurchaseReturnAuthorization.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!pra) throw { status: 404, message: "PRA not found" };
    if (pra.approval_status !== "waiting_approval") {
      throw { status: 400, message: "PRA is not waiting for approval" };
    }
    await pra.update({
      status: "approved",
      approval_status: "approved",
      approved_by: user.id,
      approved_at: new Date(),
    });

    // Trigger 5 — thông báo người tạo PRA tạo Purchase Return
    purchaseNotificationService
      .onPraApproved({
        praId: pra.id,
        praNo: pra.pra_no,
        branchId: pra.branch_id,
        createdById: pra.created_by,
        io: null,
      })
      .catch(() => {
        /* fail-safe */
      });

    return this.getById(id, user);
  },

  async reject(id: number, reason: string, user: any) {
    const pra = await PurchaseReturnAuthorization.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!pra) throw { status: 404, message: "PRA not found" };
    if (pra.approval_status !== "waiting_approval") {
      throw { status: 400, message: "PRA is not waiting for approval" };
    }
    await pra.update({
      status: "rejected",
      approval_status: "rejected",
      approved_by: user.id,
      approved_at: new Date(),
      reject_reason: reason,
    });
    return this.getById(id, user);
  },
};

// ─── Purchase Return Service ──────────────────────────────────────────────────

// ─── Helper: Quy đổi UOM ──────────────────────────────────────────────────────

/**
 * Quy đổi quantity từ purchase UOM sang stock UOM của product.
 * Priority lookup: product-specific → generic → reverse product-specific → reverse generic → fallback.
 * Nếu uom_id = product.uom_id hoặc không có conversion → trả về quantity gốc.
 */
async function resolveQtyInStockUom(
  quantity: number,
  purchaseUomId: number | null | undefined,
  productStockUomId: number | null | undefined,
  productId: number | null | undefined,
): Promise<number> {
  if (
    !purchaseUomId ||
    !productStockUomId ||
    purchaseUomId === productStockUomId
  ) {
    return quantity;
  }

  // Step 1: Forward product-specific
  if (productId) {
    const conversion = await UomConversion.findOne({
      where: {
        product_id: productId,
        from_uom_id: purchaseUomId,
        to_uom_id: productStockUomId,
      },
    });
    if (conversion) {
      return quantity * parseFloat(String(conversion.factor));
    }
  }

  // Step 2: Forward generic
  const genericConversion = await UomConversion.findOne({
    where: {
      product_id: null,
      from_uom_id: purchaseUomId,
      to_uom_id: productStockUomId,
    },
  });
  if (genericConversion) {
    return quantity * parseFloat(String(genericConversion.factor));
  }

  // Step 3: Reverse product-specific
  if (productId) {
    const reverseProductSpecific = await UomConversion.findOne({
      where: {
        product_id: productId,
        from_uom_id: productStockUomId,
        to_uom_id: purchaseUomId,
      },
    });
    if (reverseProductSpecific) {
      return quantity / parseFloat(String(reverseProductSpecific.factor));
    }
  }

  // Step 4: Reverse generic
  const reverseGeneric = await UomConversion.findOne({
    where: {
      product_id: null,
      from_uom_id: productStockUomId,
      to_uom_id: purchaseUomId,
    },
  });
  if (reverseGeneric) {
    return quantity / parseFloat(String(reverseGeneric.factor));
  }

  // Fallback: không tìm được conversion, trả về quantity gốc
  return quantity;
}

export const purchaseReturnService = {
  async getAll(query: any, user: any) {
    const where: any = { branch_id: user.branch_id };
    if (query.status) {
      if (typeof query.status === "string" && query.status.includes(",")) {
        where.status = { [Op.in]: query.status.split(",") };
      } else {
        where.status = query.status;
      }
    }
    if (query.return_type) {
      where.return_type = query.return_type;
    }
    if (query.supplier_id) where.supplier_id = Number(query.supplier_id);

    return PurchaseReturn.findAll({
      where,
      include: [
        { model: Partner, as: "supplier", attributes: ["id", "name"] },
        { model: User, as: "creator", attributes: ["id", "full_name"] },
        {
          model: PurchaseReturnLine,
          as: "lines",
          include: [
            { model: Product, as: "product", attributes: ["id", "name"] }
          ]
        }
      ],
      order: [["created_at", "DESC"]],
    });
  },

  async getById(id: number, user: any) {
    const ret = await PurchaseReturn.findOne({
      where: { id, branch_id: user.branch_id },
      include: RETURN_INCLUDE,
    });
    if (!ret) throw { status: 404, message: "Purchase Return not found" };
    return ret;
  },

  async create(payload: any, user: any) {
    if (!payload.supplier_id)
      throw { status: 400, message: "supplier_id is required" };
    if (!payload.return_date)
      throw { status: 400, message: "return_date is required" };
    if (!Array.isArray(payload.lines) || payload.lines.length === 0) {
      throw { status: 400, message: "lines must have at least 1 item" };
    }

    let returnType: "refund" | "replacement" | "debit_note" = payload.return_type ?? "debit_note";
    if (payload.pra_id) {
      const pra = await PurchaseReturnAuthorization.findByPk(payload.pra_id);
      if (pra) {
        returnType = pra.return_type;
      }
    }

    const retId = await sequelize.transaction(async (t) => {
      const ret = await PurchaseReturn.create(
        {
          branch_id: user.branch_id,
          return_no: await generateNo("RET", PurchaseReturn, "return_no"),
          pra_id: payload.pra_id ?? null,
          purchase_order_id: payload.purchase_order_id ?? null,
          supplier_id: payload.supplier_id,
          return_date: payload.return_date,
          warehouse_id: payload.warehouse_id ?? null,
          status: "draft",
          total_return_amount: 0,
          return_type: returnType,
          created_by: user.id,
          notes: payload.notes ?? null,
        },
        { transaction: t },
      );

      let total = 0;
      for (const line of payload.lines) {
        const qty = Number(line.quantity_returned);
        const price = Number(line.unit_price);
        const lineTotal = qty * price;
        total += lineTotal;

        // Quy đổi quantity_returned sang stock UOM
        const product = await Product.findByPk(line.product_id, {
          attributes: ["id", "uom_id"],
        });
        const productStockUomId = product?.uom_id ?? null;
        const qtyInStockUom = await resolveQtyInStockUom(
          qty,
          line.uom_id ?? null,
          productStockUomId,
          line.product_id,
        );

        await PurchaseReturnLine.create(
          {
            return_id: ret.id,
            product_id: line.product_id,
            po_line_id: line.po_line_id ?? null,
            quantity_returned: qty,
            uom_id: line.uom_id ?? null,
            qty_in_stock_uom: qtyInStockUom,
            quantity_confirmed: 0,
            quantity_confirmed_stock_uom: 0,
            quantity_rejected: 0,
            quantity_rejected_stock_uom: 0,
            unit_price: price,
            line_total: lineTotal,
            reason: line.reason ?? null,
            condition: line.condition ?? "good",
          },
          { transaction: t },
        );
      }

      await ret.update({ total_return_amount: total }, { transaction: t });

      if (payload.pra_id) {
        const pra = await PurchaseReturnAuthorization.findByPk(payload.pra_id, { transaction: t });
        if (pra && pra.status === "approved") {
          await pra.update({ status: "processing" }, { transaction: t });
        }
      }

      return ret.id;
    });

    return this.getById(retId, user);
  },

  async update(id: number, payload: any, user: any) {
    const ret = await PurchaseReturn.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!ret) throw { status: 404, message: "Purchase Return not found" };
    if (ret.status !== "draft")
      throw {
        status: 400,
        message: "Only draft Purchase Return can be edited",
      };

    if (!payload.supplier_id)
      throw { status: 400, message: "supplier_id is required" };
    if (!payload.return_date)
      throw { status: 400, message: "return_date is required" };
    if (!Array.isArray(payload.lines) || payload.lines.length === 0) {
      throw { status: 400, message: "lines must have at least 1 item" };
    }

    let returnType = payload.return_type ?? ret.return_type;
    if (payload.pra_id && payload.pra_id !== ret.pra_id) {
      const pra = await PurchaseReturnAuthorization.findByPk(payload.pra_id);
      if (pra) {
        returnType = pra.return_type;
      }
    }

    await sequelize.transaction(async (t) => {
      // Update header
      await ret.update(
        {
          supplier_id: payload.supplier_id,
          purchase_order_id: payload.purchase_order_id ?? null,
          pra_id: payload.pra_id ?? ret.pra_id,
          return_date: payload.return_date,
          return_type: returnType,
          notes: payload.notes ?? null,
        },
        { transaction: t },
      );

      // Delete old lines
      await PurchaseReturnLine.destroy({
        where: { return_id: id },
        transaction: t,
      });

      // Create new lines
      let total = 0;
      for (const line of payload.lines) {
        const qty = Number(line.quantity_returned);
        const price = Number(line.unit_price);
        const lineTotal = qty * price;
        total += lineTotal;

        // Quy đổi quantity_returned sang stock UOM
        const product = await Product.findByPk(line.product_id, {
          attributes: ["id", "uom_id"],
        });
        const productStockUomId = product?.uom_id ?? null;
        const qtyInStockUom = await resolveQtyInStockUom(
          qty,
          line.uom_id ?? null,
          productStockUomId,
          line.product_id,
        );

        await PurchaseReturnLine.create(
          {
            return_id: id,
            product_id: line.product_id,
            po_line_id: line.po_line_id ?? null,
            quantity_returned: qty,
            uom_id: line.uom_id ?? null,
            qty_in_stock_uom: qtyInStockUom,
            quantity_confirmed: 0,
            quantity_confirmed_stock_uom: 0,
            quantity_rejected: 0,
            quantity_rejected_stock_uom: 0,
            unit_price: price,
            line_total: lineTotal,
            reason: line.reason ?? null,
            condition: line.condition ?? "good",
          },
          { transaction: t },
        );
      }

      // Update total
      await ret.update({ total_return_amount: total }, { transaction: t });
    });

    return this.getById(id, user);
  },

  async ship(id: number, user: any) {
    const ret = await PurchaseReturn.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!ret) throw { status: 404, message: "Purchase Return not found" };
    if (ret.status !== "draft" && ret.status !== "confirmed") {
      throw { status: 400, message: "Only approved return can be shipped" };
    }
    await ret.update({ status: "shipped" });
    return this.getById(id, user);
  },

  async confirm(
    id: number,
    lines: { line_id: number; qty_confirmed: number; qty_rejected: number }[],
    user: any,
  ) {
    const ret = await PurchaseReturn.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!ret) throw { status: 404, message: "Purchase Return not found" };
    if (ret.status !== "shipped")
      throw { status: 400, message: "Only shipped return can be confirmed" };

    await sequelize.transaction(async (t) => {
      for (const item of lines) {
        // Lấy line để biết uom_id
        const returnLine = await PurchaseReturnLine.findByPk(item.line_id);
        if (!returnLine) continue;

        // Quy đổi qty_confirmed sang stock UOM
        const product = await Product.findByPk(returnLine.product_id, {
          attributes: ["id", "uom_id"],
        });
        const productStockUomId = product?.uom_id ?? null;
        const qtyConfirmedStockUom = await resolveQtyInStockUom(
          item.qty_confirmed,
          returnLine.uom_id ?? null,
          productStockUomId,
          returnLine.product_id,
        );

        // Quy đổi qty_rejected sang stock UOM
        const qtyRejectedStockUom = await resolveQtyInStockUom(
          item.qty_rejected,
          returnLine.uom_id ?? null,
          productStockUomId,
          returnLine.product_id,
        );

        await PurchaseReturnLine.update(
          {
            quantity_confirmed: item.qty_confirmed,
            quantity_confirmed_stock_uom: qtyConfirmedStockUom,
            quantity_rejected: item.qty_rejected,
            quantity_rejected_stock_uom: qtyRejectedStockUom,
          },
          { where: { id: item.line_id, return_id: id }, transaction: t },
        );
      }
      await ret.update({ status: "confirmed" }, { transaction: t });
    });

    // Trigger 6 — thông báo kế toán tạo Debit Note
    purchaseNotificationService
      .onReturnConfirmed({
        returnId: ret.id,
        returnNo: ret.return_no,
        branchId: ret.branch_id,
        io: null,
      })
      .catch(() => {
        /* fail-safe */
      });

    return this.getById(id, user);
  },

  async complete(id: number, user: any) {
    const retId = await sequelize.transaction(async (t) => {
      const ret = await PurchaseReturn.findOne({
        where: { id, branch_id: user.branch_id },
        transaction: t,
      });
      if (!ret) throw { status: 404, message: "Purchase Return not found" };
      if (ret.status !== "confirmed")
        throw { status: 400, message: "Only confirmed return can be completed" };

      if (ret.stock_move_id) {
        const { StockMove } = await import("../../inventory/models/stockMove.model");
        const move = await StockMove.findByPk(ret.stock_move_id, { transaction: t });
        if (!move || move.status !== "posted") {
          throw { status: 400, message: "Warehouse manager has not approved the stock issue yet" };
        }
      }

      await ret.update({ status: "completed" }, { transaction: t });

      if (ret.pra_id) {
        const pra = await PurchaseReturnAuthorization.findByPk(ret.pra_id, { transaction: t });
        if (pra && (pra.status === "processing" || pra.status === "approved")) {
          await pra.update({ status: "completed" }, { transaction: t });
        }
      }

      return ret.id;
    });

    return this.getById(retId, user);
  },
};

// ─── AP Debit Note Service ────────────────────────────────────────────────────

export const apDebitNoteService = {
  async getAll(query: any, user: any) {
    const where: any = { branch_id: user.branch_id };
    if (query.status) where.status = query.status;
    if (query.supplier_id) where.supplier_id = Number(query.supplier_id);

    return ApDebitNote.findAll({
      where,
      include: [{ model: Partner, as: "supplier", attributes: ["id", "name"] }],
      order: [["created_at", "DESC"]],
    });
  },

  async getById(id: number, user: any) {
    const dn = await ApDebitNote.findOne({
      where: { id, branch_id: user.branch_id },
      include: [
        { model: Partner, as: "supplier", attributes: ["id", "name", "email"] },
        { model: User, as: "creator", attributes: ["id", "full_name"] },
        {
          model: ApDebitNoteLine,
          as: "lines",
          include: [
            { model: Product, as: "product", attributes: ["id", "name"] },
          ],
        },
      ],
    });
    if (!dn) throw { status: 404, message: "AP Debit Note not found" };
    return dn;
  },

  async getPreviewFromReturn(returnId: number, user: any) {
    const ret = await PurchaseReturn.findOne({
      where: { id: returnId, branch_id: user.branch_id },
      include: [{ model: PurchaseReturnLine, as: "lines" }],
    });
    if (!ret) throw { status: 404, message: "Purchase Return not found" };
    if (ret.return_type === "replacement") {
      throw {
        status: 400,
        message: "Không thể tạo Thẻ nợ cho loại Đổi trả hàng (Replacement)",
      };
    }

    let originalApInvoiceId: number | null = null;
    if (ret.pra_id) {
      const pra = await PurchaseReturnAuthorization.findByPk(ret.pra_id);
      originalApInvoiceId = pra?.ap_invoice_id ?? null;
    }

    const { ApInvoiceLine } = await import("../models/apInvoiceLine.model");
    const invLines = originalApInvoiceId
      ? await ApInvoiceLine.findAll({
          where: { ap_invoice_id: originalApInvoiceId },
        })
      : [];

    let totalBeforeTax = 0;
    let totalTax = 0;
    let totalAfterTax = 0;

    const lines = (ret as any).lines as PurchaseReturnLine[];
    const itemsPreview = [];

    for (const line of lines) {
      const qtyConfirmed = Number(line.quantity_confirmed ?? 0);
      if (qtyConfirmed <= 0) continue;

      const invLine = invLines.find(
        (il) => Number(il.product_id) === Number(line.product_id)
      );

      let netUnitPrice = Number(line.unit_price);
      let taxPerUnit = 0;
      let totalAfterTaxPerUnit = netUnitPrice;

      if (invLine) {
        const invQty = Number(invLine.quantity || 1);
        netUnitPrice = Number(invLine.line_total ?? 0) / invQty;
        taxPerUnit = Number(invLine.line_tax ?? 0) / invQty;
        totalAfterTaxPerUnit = Number(invLine.line_total_after_tax ?? 0) / invQty;
      }

      const lineTotal = qtyConfirmed * netUnitPrice;
      const lineTax = qtyConfirmed * taxPerUnit;
      const lineTotalAfterTax = qtyConfirmed * totalAfterTaxPerUnit;

      totalBeforeTax += lineTotal;
      totalTax += lineTax;
      totalAfterTax += lineTotalAfterTax;

      itemsPreview.push({
        product_id: line.product_id,
        quantity: qtyConfirmed,
        unit_price: netUnitPrice,
        line_total: lineTotal,
        line_tax: lineTax,
        line_total_after_tax: lineTotalAfterTax,
      });
    }

    return {
      original_ap_invoice_id: originalApInvoiceId,
      total_before_tax: totalBeforeTax,
      total_tax: totalTax,
      total_after_tax: totalAfterTax,
      items: itemsPreview,
    };
  },

  async createFromReturn(returnId: number, user: any) {
    const ret = await PurchaseReturn.findOne({
      where: { id: returnId, branch_id: user.branch_id },
      include: [{ model: PurchaseReturnLine, as: "lines" }],
    });
    if (!ret) throw { status: 404, message: "Purchase Return not found" };
    if (ret.return_type === "replacement") {
      throw {
        status: 400,
        message: "Không thể tạo Thẻ nợ cho loại Đổi trả hàng (Replacement)",
      };
    }
    if (ret.status !== "confirmed" && ret.status !== "completed") {
      throw {
        status: 400,
        message: "Return must be confirmed before creating Debit Note",
      };
    }

    const lines = (ret as any).lines as PurchaseReturnLine[];

    // Tính số lượng thực tế để đưa vào Debit Note:
    // Vì phiếu đã ở trạng thái confirmed/completed, ta dùng trực tiếp quantity_confirmed.
    const effectiveLines = lines.map((line) => {
      const qtyConfirmed = Number(line.quantity_confirmed ?? 0);
      return { line, effectiveQty: qtyConfirmed };
    });

    const totalCheck = effectiveLines.reduce(
      (sum, { effectiveQty }) => sum + effectiveQty,
      0,
    );

    if (totalCheck <= 0) {
      throw {
        status: 400,
        message:
          "Không có dòng hàng nào có số lượng xác nhận hợp lệ. Không thể tạo Thẻ nợ có giá trị 0.",
      };
    }

    // Get original AP Invoice from PRA
    let originalApInvoiceId: number | null = null;
    if (ret.pra_id) {
      const pra = await PurchaseReturnAuthorization.findByPk(ret.pra_id);
      originalApInvoiceId = pra?.ap_invoice_id ?? null;
    }

    const dnId = await sequelize.transaction(async (t) => {
      const dn = await ApDebitNote.create(
        {
          branch_id: ret.branch_id,
          debit_note_no: await generateNo("DN", ApDebitNote, "debit_note_no"),
          purchase_return_id: ret.id,
          original_ap_invoice_id: originalApInvoiceId,
          supplier_id: ret.supplier_id,
          debit_note_date: new Date().toISOString().split("T")[0]!,
          status: "draft",
          total_before_tax: 0,
          total_tax: 0,
          total_after_tax: 0,
          created_by: user.id,
        },
        { transaction: t },
      );

      const { ApInvoiceLine } = await import("../models/apInvoiceLine.model");
      const invLines = originalApInvoiceId
        ? await ApInvoiceLine.findAll({
            where: { ap_invoice_id: originalApInvoiceId },
            transaction: t,
          })
        : [];

      let totalBeforeTax = 0;
      let totalTax = 0;
      let totalAfterTax = 0;

      for (const { line, effectiveQty } of effectiveLines) {
        if (effectiveQty <= 0) continue;

        const invLine = invLines.find(
          (il) => Number(il.product_id) === Number(line.product_id)
        );

        let netUnitPrice = Number(line.unit_price);
        let taxPerUnit = 0;
        let totalAfterTaxPerUnit = netUnitPrice;

        if (invLine) {
          const invQty = Number(invLine.quantity || 1);
          netUnitPrice = Number(invLine.line_total ?? 0) / invQty;
          taxPerUnit = Number(invLine.line_tax ?? 0) / invQty;
          totalAfterTaxPerUnit = Number(invLine.line_total_after_tax ?? 0) / invQty;
        }

        const lineTotal = effectiveQty * netUnitPrice;
        const lineTax = effectiveQty * taxPerUnit;
        const lineTotalAfterTax = effectiveQty * totalAfterTaxPerUnit;

        totalBeforeTax += lineTotal;
        totalTax += lineTax;
        totalAfterTax += lineTotalAfterTax;

        await ApDebitNoteLine.create(
          {
            debit_note_id: dn.id,
            product_id: line.product_id,
            return_line_id: line.id,
            quantity: effectiveQty,
            unit_price: netUnitPrice,
            line_total: lineTotal,
            line_tax: lineTax,
            line_total_after_tax: lineTotalAfterTax,
          },
          { transaction: t },
        );
      }

      if (totalAfterTax <= 0) {
        throw {
          status: 400,
          message: "Tổng giá trị Thẻ nợ bằng 0. Vui lòng kiểm tra đơn giá các dòng hàng.",
        };
      }

      await dn.update(
        {
          total_before_tax: totalBeforeTax,
          total_tax: totalTax,
          total_after_tax: totalAfterTax,
        },
        { transaction: t },
      );

      return dn.id;
    });

    return this.getById(dnId, user);
  },

  async post(id: number, user: any) {

    const dn = await ApDebitNote.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!dn) throw { status: 404, message: "AP Debit Note not found" };
    const companyId = await getCompanyIdFromBranch(dn.branch_id);
    if (dn.status !== "draft")
      throw { status: 400, message: "Only draft Debit Note can be posted" };

    await sequelize.transaction(async (t) => {
      const journal = await GlJournal.findOne({ where: { code: "PURCHASE" }, transaction: t });
      if (!journal) throw new Error("PURCHASE journal not found");

      const entry = await GlEntry.create(
        {
          journal_id: journal.id,
          entry_no: `GL-DN-${dn.id}`,
          entry_date: new Date(dn.debit_note_date),
          reference_type: "ap_debit_note",
          reference_id: dn.id,
          memo: `AP Debit Note ${dn.debit_note_no}`,
          status: "posted",
          branch_id: dn.branch_id,
        } as any,
        { transaction: t },
      );

      const [apAcc, invAcc, taxAcc] = await Promise.all([
        GlAccount.findOne({ where: { code: "331" }, transaction: t }),
        GlAccount.findOne({ where: { code: "156" }, transaction: t }),
        GlAccount.findOne({ where: { code: "1331" }, transaction: t }).then(
          (acc) => acc || GlAccount.findOne({ where: { code: "133" }, transaction: t })
        ),
      ]);
      if (!apAcc || !invAcc) {
        throw new Error("Missing GL Accounts 331 / 156");
      }

      const totalAfterTax = Number(dn.total_after_tax);
      const totalBeforeTax = Number(dn.total_before_tax);
      const totalTax = Number(dn.total_tax);

      const glLines = [
        {
          entry_id: entry.id,
          account_id: apAcc.id,
          partner_id: dn.supplier_id,
          debit: totalAfterTax,
          credit: 0,
        }, // 331 AP (Total After Tax)
      ];

      if (taxAcc && totalTax > 0) {
        glLines.push(
          {
            entry_id: entry.id,
            account_id: invAcc.id,
            partner_id: dn.supplier_id,
            debit: 0,
            credit: totalBeforeTax,
          }, // 156 Inventory (Before Tax)
          {
            entry_id: entry.id,
            account_id: taxAcc.id,
            partner_id: dn.supplier_id,
            debit: 0,
            credit: totalTax,
          } // 1331/133 VAT tax reversal
        );
      } else {
        glLines.push({
          entry_id: entry.id,
          account_id: invAcc.id,
          partner_id: dn.supplier_id,
          debit: 0,
          credit: totalAfterTax,
        });
      }

      await GlEntryLine.bulkCreate(glLines, { transaction: t });

      let isRefund = false;
      if (dn.purchase_return_id) {
        const ret = await PurchaseReturn.findByPk(dn.purchase_return_id, { transaction: t });
        if (ret && ret.return_type === "refund") {
          isRefund = true;
        }
      }

      const finalStatus = (dn.original_ap_invoice_id && !isRefund) ? "applied" : "posted";
      await dn.update(
        { status: finalStatus, gl_entry_id: entry.id },
        { transaction: t },
      );

      // Reduce paid_amount on original invoice if linked (only if NOT a refund)
      if (dn.original_ap_invoice_id && !isRefund) {
        await sequelize.query(
          `UPDATE ap_invoices
           SET paid_amount = GREATEST(0, paid_amount + ?),
               status = CASE
                 WHEN GREATEST(0, paid_amount + ?) >= total_after_tax THEN 'paid'
                 WHEN GREATEST(0, paid_amount + ?) > 0 THEN 'partially_paid'
                 ELSE 'posted'
               END
           WHERE id = ?`,
          {
            replacements: [totalAfterTax, totalAfterTax, totalAfterTax, dn.original_ap_invoice_id],
            transaction: t,
          },
        );
      }
    });

    // Trigger 7 — thông báo kế toán + buyer sau khi post debit note
    purchaseNotificationService
      .onDebitNotePosted({
        debitNoteId: dn.id,
        debitNoteNo: dn.debit_note_no,
        totalAfterTax: Number(dn.total_after_tax),
        branchId: dn.branch_id,
        buyerId: null, // buyer_id không có trên debit note, có thể lookup từ PRA nếu cần
        io: null,
      })
      .catch(() => {
        /* fail-safe */
      });

    return this.getById(id, user);
  },

  async cancel(id: number, user: any) {
    const dn = await ApDebitNote.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!dn) throw { status: 404, message: "AP Debit Note not found" };
    if (!["draft", "posted"].includes(dn.status)) {
      throw {
        status: 400,
        message: "Only draft or posted Debit Note can be cancelled",
      };
    }
    await dn.update({ status: "cancelled" });
    return this.getById(id, user);
  },
};

// ─── Vendor Refund Service ────────────────────────────────────────────────────

export const vendorRefundService = {
  async getAll(query: any, user: any) {
    const where: any = { branch_id: user.branch_id };
    if (query.status) where.status = query.status;
    if (query.supplier_id) where.supplier_id = Number(query.supplier_id);

    return VendorRefund.findAll({
      where,
      include: [{ model: Partner, as: "supplier", attributes: ["id", "name"] }],
      order: [["created_at", "DESC"]],
    });
  },

  async getById(id: number, user: any) {
    const refund = await VendorRefund.findOne({
      where: { id, branch_id: user.branch_id },
      include: [
        { model: Partner, as: "supplier", attributes: ["id", "name", "email"] },
        { model: User, as: "creator", attributes: ["id", "full_name"] },
        {
          model: ApDebitNote,
          as: "debitNote",
          attributes: ["id", "debit_note_no", "total_after_tax"],
        },
      ],
    });
    if (!refund) throw { status: 404, message: "Vendor Refund not found" };
    return refund;
  },

  async create(payload: any, user: any) {
    if (!payload.supplier_id)
      throw { status: 400, message: "supplier_id is required" };
    if (!payload.refund_date)
      throw { status: 400, message: "refund_date is required" };
    if (!payload.amount || Number(payload.amount) <= 0) {
      throw { status: 400, message: "amount must be greater than zero" };
    }

    if (payload.debit_note_id) {
      const debitNote = await ApDebitNote.findOne({
        where: { id: payload.debit_note_id, branch_id: user.branch_id },
      });
      if (!debitNote) {
        throw { status: 404, message: "Giấy báo nợ (Debit Note) không tồn tại hoặc không thuộc chi nhánh này" };
      }
      if (debitNote.status !== "posted") {
        throw { status: 400, message: "Giấy báo nợ liên kết phải ở trạng thái đã ghi sổ (posted)" };
      }

      // Check linked Purchase Return return_type
      if (debitNote.purchase_return_id) {
        const ret = await PurchaseReturn.findByPk(debitNote.purchase_return_id);
        if (ret && ret.return_type !== "refund") {
          throw {
            status: 400,
            message: "Chỉ cho phép hoàn tiền đối với Thẻ nợ được tạo ra từ phiếu trả hàng có loại Hoàn tiền (Refund)",
          };
        }
      }

      const refundAmount = Number(payload.amount);
      const maxRefundable = Number(debitNote.total_after_tax);
      if (refundAmount > maxRefundable) {
        throw {
          status: 400,
          message: `Số tiền hoàn trả (${refundAmount.toLocaleString("vi-VN")}đ) không được vượt quá giá trị của Giấy báo nợ liên kết (${maxRefundable.toLocaleString("vi-VN")}đ)`,
        };
      }
    }

    const refund = await VendorRefund.create({
      branch_id: user.branch_id,
      refund_no: await generateNo("VR", VendorRefund, "refund_no"),
      debit_note_id: payload.debit_note_id ?? null,
      supplier_id: payload.supplier_id,
      refund_date: payload.refund_date,
      amount: payload.amount,
      method: payload.method ?? "bank",
      bank_account_id: payload.bank_account_id ?? null,
      transaction_reference: payload.transaction_reference ?? null,
      currency_id: payload.currency_id ?? null,
      exchange_rate: payload.exchange_rate ?? 1.0,
      status: "draft",
      approval_status: "draft",
      created_by: user.id,
      notes: payload.notes ?? null,
    });

    return this.getById(refund.id, user);
  },

  async post(id: number, user: any) {

    const refund = await VendorRefund.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!refund) throw { status: 404, message: "Vendor Refund not found" };
    const companyId = await getCompanyIdFromBranch(refund.branch_id);
    if (refund.status !== "draft")
      throw { status: 400, message: "Only draft refund can be posted" };

    await sequelize.transaction(async (t) => {
      const methodCode = refund.method === "cash" ? "CASH" : "BANK";
      const journal = await GlJournal.findOne({ where: { code: methodCode }, transaction: t });
      if (!journal) throw new Error(`${methodCode} journal not found`);

      const entry = await GlEntry.create(
        {
          journal_id: journal.id,
          entry_no: `GL-VR-${refund.id}`,
          entry_date: new Date(refund.refund_date),
          reference_type: "vendor_refund",
          reference_id: refund.id,
          memo: `Vendor Refund ${refund.refund_no}`,
          status: "posted",
          branch_id: refund.branch_id,
        } as any,
        { transaction: t },
      );

      const amount = Number(refund.amount) * Number(refund.exchange_rate || 1);
      const cashAccCode = refund.method === "cash" ? "111" : "112";

      const accounts = await requireGlAccounts(companyId, [cashAccCode, "331"], t);
      const cashAcc = accounts[cashAccCode]!;
      const apAcc = accounts["331"]!;

      await GlEntryLine.bulkCreate(
        [
          { entry_id: entry.id, account_id: cashAcc.id, partner_id: refund.supplier_id, debit: amount, credit: 0 },
          { entry_id: entry.id, account_id: apAcc.id, partner_id: refund.supplier_id, debit: 0, credit: amount },
        ],
        { transaction: t },
      );

      await refund.update(
        { status: "posted", gl_entry_id: entry.id },
        { transaction: t },
      );

      if (refund.debit_note_id) {
        const debitNote = await ApDebitNote.findByPk(refund.debit_note_id, { transaction: t });
        if (debitNote) {
          await debitNote.update({ status: "applied" }, { transaction: t });
        }
      }
    });

    return this.getById(id, user);
  },
};
