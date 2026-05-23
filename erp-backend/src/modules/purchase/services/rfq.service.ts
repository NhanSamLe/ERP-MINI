import { Op } from "sequelize";
import { sequelize } from "../../../config/db";
import { PurchaseRfq } from "../models/purchaseRfq.model";
import { PurchaseRfqLine } from "../models/purchaseRfqLine.model";
import { PurchaseOrder } from "../models/purchaseOrder.model";
import { PurchaseOrderLine } from "../models/purchaseOrderLine.model";
import { Partner } from "../../../models";
import { User } from "../../auth/models/user.model";
import { Branch } from "../../company/models/branch.model";
import { Product } from "../../product/models/product.model";
import { UomConversion } from "../../master-data/models/uomConversion.model";
import { Uom } from "../../master-data/models/uom.model";
import { Role } from "../../../core/types/enum";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateRfqNo(): string {
  return `RFQ-${Date.now()}`;
}

function generatePoNo(): string {
  return `PO-${Date.now()}`;
}

/**
 * Quy đổi quantity từ purchase UOM sang stock UOM.
 * Dùng khi convert RFQ → PO để tính qty_in_stock_uom cho PO lines.
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

  // Forward product-specific
  if (productId) {
    const c = await UomConversion.findOne({
      where: {
        product_id: productId,
        from_uom_id: purchaseUomId,
        to_uom_id: productStockUomId,
      },
    });
    if (c) return quantity * parseFloat(String(c.factor));
  }

  // Forward generic
  const gf = await UomConversion.findOne({
    where: {
      product_id: null,
      from_uom_id: purchaseUomId,
      to_uom_id: productStockUomId,
    },
  });
  if (gf) return quantity * parseFloat(String(gf.factor));

  // Reverse product-specific
  if (productId) {
    const rp = await UomConversion.findOne({
      where: {
        product_id: productId,
        from_uom_id: productStockUomId,
        to_uom_id: purchaseUomId,
      },
    });
    if (rp) return quantity / parseFloat(String(rp.factor));
  }

  // Reverse generic
  const rg = await UomConversion.findOne({
    where: {
      product_id: null,
      from_uom_id: productStockUomId,
      to_uom_id: purchaseUomId,
    },
  });
  if (rg) return quantity / parseFloat(String(rg.factor));

  return quantity; // fallback
}

const INCLUDE_FULL = [
  { model: Branch, as: "branch" },
  {
    model: Partner,
    as: "supplier",
    attributes: ["id", "name", "email", "phone"],
  },
  {
    model: User,
    as: "creator",
    attributes: ["id", "full_name", "email", "avatar_url"],
  },
  {
    model: User,
    as: "approver",
    attributes: ["id", "full_name", "email", "avatar_url"],
  },
  {
    model: PurchaseRfqLine,
    as: "lines",
    include: [
      {
        model: Product,
        as: "product",
        attributes: ["id", "name", "image_url"],
      },
      {
        model: Uom,
        as: "uom",
        attributes: ["id", "name"],
      },
    ],
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

export const rfqService = {
  // ─── READ ──────────────────────────────────────────────────────────────────

  async getAll(query: any, user: any) {
    const where: any = { branch_id: user.branch_id };

    if (query.status) where.status = query.status;
    if (query.supplier_id) where.supplier_id = Number(query.supplier_id);
    if (query.buyer_id) where.buyer_id = Number(query.buyer_id);
    if (query.date_from || query.date_to) {
      where.rfq_date = {};
      if (query.date_from) where.rfq_date[Op.gte] = query.date_from;
      if (query.date_to) where.rfq_date[Op.lte] = query.date_to;
    }

    return PurchaseRfq.findAll({
      where,
      include: [
        { model: Partner, as: "supplier", attributes: ["id", "name"] },
        { model: User, as: "creator", attributes: ["id", "full_name"] },
      ],
      order: [["created_at", "DESC"]],
    });
  },

  async getById(id: number, user: any) {
    const rfq = await PurchaseRfq.findOne({
      where: { id, branch_id: user.branch_id },
      include: INCLUDE_FULL,
    });
    if (!rfq) throw { status: 404, message: "RFQ not found" };
    return rfq;
  },

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async create(payload: any, user: any) {
    if (!payload.rfq_date)
      throw { status: 400, message: "rfq_date is required" };
    if (!Array.isArray(payload.lines) || payload.lines.length === 0) {
      throw { status: 400, message: "lines must have at least 1 item" };
    }

    const rfqId = await sequelize.transaction(async (t) => {
      const rfq = await PurchaseRfq.create(
        {
          branch_id: user.branch_id,
          rfq_no: generateRfqNo(),
          supplier_id: payload.supplier_id ?? null,
          currency_id: payload.currency_id ?? null,
          exchange_rate: payload.exchange_rate ?? 1.0,
          payment_term_id: payload.payment_term_id ?? null,
          rfq_date: payload.rfq_date,
          valid_until: payload.valid_until ?? null,
          status: "draft",
          approval_status: "draft",
          version: 1,
          parent_id: null,
          total_before_tax: 0,
          total_tax: 0,
          total_after_tax: 0,
          discount_percent: payload.discount_percent ?? 0,
          discount_amount: payload.discount_amount ?? 0,
          supplier_notes: payload.supplier_notes ?? null,
          internal_notes: payload.internal_notes ?? null,
          buyer_id: payload.buyer_id ?? user.id,
          created_by: user.id,
        },
        { transaction: t },
      );

      let totalBeforeTax = 0;
      let totalTax = 0;

      for (const line of payload.lines) {
        const qty = Number(line.quantity);
        const price = Number(line.unit_price ?? 0);
        const discPct = Number(line.discount_percent ?? 0);
        const discAmt = Number(line.discount_amount ?? 0);
        const lineTotal = qty * price * (1 - discPct / 100) - discAmt;
        const lineTax = Number(line.line_tax ?? 0);
        const lineTotalAfterTax = lineTotal + lineTax;

        await PurchaseRfqLine.create(
          {
            rfq_id: rfq.id,
            product_id: line.product_id,
            ...(line.description != null && { description: line.description }),
            quantity: qty,
            ...(line.uom_id != null && { uom_id: line.uom_id }),
            unit_price: price,
            ...(discPct > 0 && { discount_percent: discPct }),
            ...(discAmt > 0 && { discount_amount: discAmt }),
            ...(line.tax_rate_id != null && { tax_rate_id: line.tax_rate_id }),
            line_total: lineTotal,
            line_tax: lineTax,
            line_total_after_tax: lineTotalAfterTax,
            ...(line.lead_time_days != null && {
              lead_time_days: line.lead_time_days,
            }),
          },
          { transaction: t },
        );

        totalBeforeTax += lineTotal;
        totalTax += lineTax;
      }

      await rfq.update(
        {
          total_before_tax: totalBeforeTax,
          total_tax: totalTax,
          total_after_tax: totalBeforeTax + totalTax,
        },
        { transaction: t },
      );

      return rfq.id;
    });

    return this.getById(rfqId, user);
  },

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  async update(id: number, payload: any, user: any) {
    const rfq = await PurchaseRfq.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!rfq) throw { status: 404, message: "RFQ not found" };
    if (!["draft", "received"].includes(rfq.status)) {
      throw {
        status: 400,
        message: "Only draft or received RFQ can be updated",
      };
    }

    await sequelize.transaction(async (t) => {
      // Update header
      await rfq.update(
        {
          supplier_id: payload.supplier_id ?? rfq.supplier_id,
          currency_id: payload.currency_id ?? rfq.currency_id,
          exchange_rate: payload.exchange_rate ?? rfq.exchange_rate,
          payment_term_id: payload.payment_term_id ?? rfq.payment_term_id,
          rfq_date: payload.rfq_date ?? rfq.rfq_date,
          valid_until: payload.valid_until ?? rfq.valid_until,
          discount_percent: payload.discount_percent ?? rfq.discount_percent,
          discount_amount: payload.discount_amount ?? rfq.discount_amount,
          supplier_notes: payload.supplier_notes ?? rfq.supplier_notes,
          internal_notes: payload.internal_notes ?? rfq.internal_notes,
          buyer_id: payload.buyer_id ?? rfq.buyer_id,
        },
        { transaction: t },
      );

      // Replace lines if provided
      if (Array.isArray(payload.lines)) {
        await PurchaseRfqLine.destroy({
          where: { rfq_id: id },
          transaction: t,
        });

        let totalBeforeTax = 0;
        let totalTax = 0;

        for (const line of payload.lines) {
          const qty = Number(line.quantity);
          const price = Number(line.unit_price ?? 0);
          const discPct = Number(line.discount_percent ?? 0);
          const discAmt = Number(line.discount_amount ?? 0);
          const lineTotal = qty * price * (1 - discPct / 100) - discAmt;
          const lineTax = Number(line.line_tax ?? 0);

          await PurchaseRfqLine.create(
            {
              rfq_id: id,
              product_id: line.product_id,
              ...(line.description != null && {
                description: line.description,
              }),
              quantity: qty,
              ...(line.uom_id != null && { uom_id: line.uom_id }),
              unit_price: price,
              ...(discPct > 0 && { discount_percent: discPct }),
              ...(discAmt > 0 && { discount_amount: discAmt }),
              ...(line.tax_rate_id != null && {
                tax_rate_id: line.tax_rate_id,
              }),
              line_total: lineTotal,
              line_tax: lineTax,
              line_total_after_tax: lineTotal + lineTax,
              ...(line.lead_time_days != null && {
                lead_time_days: line.lead_time_days,
              }),
            },
            { transaction: t },
          );

          totalBeforeTax += lineTotal;
          totalTax += lineTax;
        }

        await rfq.update(
          {
            total_before_tax: totalBeforeTax,
            total_tax: totalTax,
            total_after_tax: totalBeforeTax + totalTax,
          },
          { transaction: t },
        );
      }
    });

    return this.getById(id, user);
  },

  // ─── DELETE ────────────────────────────────────────────────────────────────

  async delete(id: number, user: any) {
    const rfq = await PurchaseRfq.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!rfq) throw { status: 404, message: "RFQ not found" };
    if (rfq.status !== "draft") {
      throw { status: 400, message: "Only draft RFQ can be deleted" };
    }
    await PurchaseRfqLine.destroy({ where: { rfq_id: id } });
    await rfq.destroy();
    return { success: true };
  },

  // ─── STATUS TRANSITIONS ────────────────────────────────────────────────────

  async send(id: number, user: any) {
    const rfq = await PurchaseRfq.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!rfq) throw { status: 404, message: "RFQ not found" };
    if (rfq.status !== "draft") {
      throw { status: 400, message: "Only draft RFQ can be sent" };
    }
    if (!rfq.supplier_id) {
      throw { status: 400, message: "Supplier is required before sending" };
    }
    await rfq.update({ status: "sent", sent_at: new Date() });
    return this.getById(id, user);
  },

  async markReceived(id: number, user: any) {
    const rfq = await PurchaseRfq.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!rfq) throw { status: 404, message: "RFQ not found" };
    if (rfq.status !== "sent") {
      throw { status: 400, message: "Only sent RFQ can be marked as received" };
    }
    await rfq.update({ status: "received", received_at: new Date() });
    return this.getById(id, user);
  },

  async accept(id: number, user: any) {
    const rfq = await PurchaseRfq.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!rfq) throw { status: 404, message: "RFQ not found" };
    if (rfq.status !== "received") {
      throw { status: 400, message: "Only received RFQ can be accepted" };
    }
    await rfq.update({ status: "accepted" });
    return this.getById(id, user);
  },

  async reject(id: number, user: any) {
    const rfq = await PurchaseRfq.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!rfq) throw { status: 404, message: "RFQ not found" };
    if (!["sent", "received"].includes(rfq.status)) {
      throw {
        status: 400,
        message: "Only sent or received RFQ can be rejected",
      };
    }
    await rfq.update({ status: "rejected" });
    return this.getById(id, user);
  },

  // ─── APPROVAL WORKFLOW ─────────────────────────────────────────────────────

  async submit(id: number, user: any) {
    const rfq = await PurchaseRfq.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!rfq) throw { status: 404, message: "RFQ not found" };
    if (rfq.approval_status !== "draft") {
      throw { status: 400, message: "Only draft RFQ can be submitted" };
    }
    await rfq.update({
      approval_status: "waiting_approval",
      submitted_at: new Date(),
    });
    return this.getById(id, user);
  },

  async approve(id: number, user: any) {
    const rfq = await PurchaseRfq.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!rfq) throw { status: 404, message: "RFQ not found" };
    if (rfq.approval_status !== "waiting_approval") {
      throw { status: 400, message: "RFQ is not waiting for approval" };
    }
    await rfq.update({
      approval_status: "approved",
      approved_by: user.id,
      approved_at: new Date(),
    });
    return this.getById(id, user);
  },

  async rejectApproval(id: number, payload: any, user: any) {
    const rfq = await PurchaseRfq.findOne({
      where: { id, branch_id: user.branch_id },
    });
    if (!rfq) throw { status: 404, message: "RFQ not found" };
    if (rfq.approval_status !== "waiting_approval") {
      throw { status: 400, message: "RFQ is not waiting for approval" };
    }
    if (!payload.reason?.trim()) {
      throw { status: 400, message: "Rejection reason is required" };
    }
    await rfq.update({
      approval_status: "rejected",
      approved_by: user.id,
      approved_at: new Date(),
      reject_reason: payload.reason,
    });
    return this.getById(id, user);
  },

  // ─── CONVERT TO PO ─────────────────────────────────────────────────────────

  async convertToPo(id: number, user: any) {
    const rfq = await PurchaseRfq.findOne({
      where: { id, branch_id: user.branch_id },
      include: [{ model: PurchaseRfqLine, as: "lines" }],
    });
    if (!rfq) throw { status: 404, message: "RFQ not found" };
    if (rfq.status !== "received" && rfq.status !== "accepted") {
      throw {
        status: 400,
        message: "Only received or accepted RFQ can be converted to PO",
      };
    }

    const poId = await sequelize.transaction(async (t) => {
      const po = await PurchaseOrder.create(
        {
          branch_id: rfq.branch_id,
          po_no: generatePoNo(),
          ...(rfq.supplier_id != null && { supplier_id: rfq.supplier_id }),
          order_date: new Date(),
          status: "draft",
          total_before_tax: rfq.total_before_tax,
          total_tax: rfq.total_tax,
          total_after_tax: rfq.total_after_tax,
          ...(rfq.id != null && { rfq_id: rfq.id }),
          ...(rfq.currency_id != null && { currency_id: rfq.currency_id }),
          ...(rfq.exchange_rate != null && {
            exchange_rate: rfq.exchange_rate,
          }),
          ...(rfq.payment_term_id != null && {
            payment_term_id: rfq.payment_term_id,
          }),
          ...(rfq.discount_percent != null && {
            discount_percent: rfq.discount_percent,
          }),
          ...(rfq.discount_amount != null && {
            discount_amount: rfq.discount_amount,
          }),
          ...(rfq.supplier_notes != null && {
            supplier_notes: rfq.supplier_notes,
          }),
          ...(rfq.internal_notes != null && {
            internal_notes: rfq.internal_notes,
          }),
          ...(rfq.buyer_id != null && { buyer_id: rfq.buyer_id }),
          created_by: user.id,
        } as any,
        { transaction: t },
      );

      const lines = (rfq as any).lines as PurchaseRfqLine[];
      for (const line of lines) {
        // Lấy stock UOM của product để tính qty_in_stock_uom
        const product = await Product.findByPk(line.product_id, {
          attributes: ["id", "uom_id"],
        });
        const productStockUomId = product?.uom_id ?? null;
        const qty_in_stock_uom = await resolveQtyInStockUom(
          Number(line.quantity),
          line.uom_id ?? null,
          productStockUomId,
          line.product_id,
        );

        await PurchaseOrderLine.create(
          {
            po_id: po.id,
            product_id: line.product_id,
            ...(line.description != null && { description: line.description }),
            quantity: line.quantity,
            ...(line.uom_id != null && { uom_id: line.uom_id }),
            qty_in_stock_uom,
            unit_price: line.unit_price,
            ...(line.discount_percent != null && {
              discount_percent: line.discount_percent,
            }),
            ...(line.discount_amount != null && {
              discount_amount: line.discount_amount,
            }),
            ...(line.tax_rate_id != null && { tax_rate_id: line.tax_rate_id }),
            line_total: line.line_total,
            line_tax: line.line_tax,
            line_total_after_tax: line.line_total_after_tax,
          } as any,
          { transaction: t },
        );
      }

      // Mark RFQ as accepted
      await rfq.update({ status: "accepted" }, { transaction: t });

      return po.id;
    });

    return { po_id: poId, rfq_id: id };
  },

  // ─── NEW VERSION ───────────────────────────────────────────────────────────

  async createNewVersion(id: number, user: any) {
    const rfq = await PurchaseRfq.findOne({
      where: { id, branch_id: user.branch_id },
      include: [{ model: PurchaseRfqLine, as: "lines" }],
    });
    if (!rfq) throw { status: 404, message: "RFQ not found" };

    const newId = await sequelize.transaction(async (t) => {
      const newRfq = await PurchaseRfq.create(
        {
          branch_id: rfq.branch_id,
          rfq_no: generateRfqNo(),
          ...(rfq.supplier_id != null && { supplier_id: rfq.supplier_id }),
          ...(rfq.currency_id != null && { currency_id: rfq.currency_id }),
          ...(rfq.exchange_rate != null && {
            exchange_rate: rfq.exchange_rate,
          }),
          ...(rfq.payment_term_id != null && {
            payment_term_id: rfq.payment_term_id,
          }),
          rfq_date: rfq.rfq_date,
          ...(rfq.valid_until != null && { valid_until: rfq.valid_until }),
          status: "draft",
          approval_status: "draft",
          version: rfq.version + 1,
          ...(rfq.id != null && { parent_id: rfq.id }),
          total_before_tax: rfq.total_before_tax,
          total_tax: rfq.total_tax,
          total_after_tax: rfq.total_after_tax,
          ...(rfq.discount_percent != null && {
            discount_percent: rfq.discount_percent,
          }),
          ...(rfq.discount_amount != null && {
            discount_amount: rfq.discount_amount,
          }),
          ...(rfq.supplier_notes != null && {
            supplier_notes: rfq.supplier_notes,
          }),
          ...(rfq.internal_notes != null && {
            internal_notes: rfq.internal_notes,
          }),
          ...(rfq.buyer_id != null && { buyer_id: rfq.buyer_id }),
          created_by: user.id,
        },
        { transaction: t },
      );

      const lines = (rfq as any).lines as PurchaseRfqLine[];
      for (const line of lines) {
        await PurchaseRfqLine.create(
          {
            rfq_id: newRfq.id,
            product_id: line.product_id,
            ...(line.description != null && { description: line.description }),
            quantity: line.quantity,
            ...(line.uom_id != null && { uom_id: line.uom_id }),
            unit_price: line.unit_price,
            ...(line.discount_percent != null && {
              discount_percent: line.discount_percent,
            }),
            ...(line.discount_amount != null && {
              discount_amount: line.discount_amount,
            }),
            ...(line.tax_rate_id != null && { tax_rate_id: line.tax_rate_id }),
            line_total: line.line_total,
            line_tax: line.line_tax,
            line_total_after_tax: line.line_total_after_tax,
            ...(line.lead_time_days != null && {
              lead_time_days: line.lead_time_days,
            }),
          },
          { transaction: t },
        );
      }

      return newRfq.id;
    });

    return this.getById(newId, user);
  },

  // ─── COMPARE ───────────────────────────────────────────────────────────────

  async compare(rfqIds: number[], user: any) {
    if (rfqIds.length < 2) {
      throw { status: 400, message: "At least 2 RFQs required for comparison" };
    }

    const rfqs = await PurchaseRfq.findAll({
      where: { id: { [Op.in]: rfqIds }, branch_id: user.branch_id },
      include: [
        { model: Partner, as: "supplier", attributes: ["id", "name"] },
        {
          model: PurchaseRfqLine,
          as: "lines",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "uom_id"],
            },
            { model: Uom, as: "uom", attributes: ["id", "name"] },
          ],
        },
      ],
    });

    if (rfqs.length !== rfqIds.length) {
      throw { status: 404, message: "One or more RFQs not found" };
    }

    // Build comparison matrix: product_id → { rfq_id → line data }
    const productMap = new Map<
      number,
      { product_name: string; rfqs: Record<number, any> }
    >();

    for (const rfq of rfqs) {
      const lines = (rfq as any).lines as PurchaseRfqLine[];
      for (const line of lines) {
        // Calculate qty_in_stock_uom for normalized comparison
        // Use product.uom_id as the stock UOM
        const qtyInStockUom = await resolveQtyInStockUom(
          line.quantity,
          line.uom_id,
          (line as any).product?.uom_id,
          line.product_id,
        );

        if (!productMap.has(line.product_id)) {
          productMap.set(line.product_id, {
            product_name:
              (line as any).product?.name ?? `Product ${line.product_id}`,
            rfqs: {},
          });
        }
        productMap.get(line.product_id)!.rfqs[rfq.id] = {
          unit_price: line.unit_price,
          quantity: line.quantity,
          qty_in_stock_uom: qtyInStockUom,
          uom: (line as any).uom,
          discount_percent: line.discount_percent,
          line_total_after_tax: line.line_total_after_tax,
          lead_time_days: line.lead_time_days,
        };
      }
    }

    return {
      rfqs: rfqs.map((r) => ({
        id: r.id,
        rfq_no: r.rfq_no,
        supplier: (r as any).supplier,
        total_after_tax: r.total_after_tax,
        valid_until: r.valid_until,
        status: r.status,
      })),
      products: Array.from(productMap.entries()).map(([product_id, data]) => ({
        product_id,
        product_name: data.product_name,
        by_rfq: data.rfqs,
      })),
    };
  },
};
