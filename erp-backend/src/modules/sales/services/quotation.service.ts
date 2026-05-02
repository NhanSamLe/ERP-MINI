import { Quotation } from "../models/quotation.model";
import { QuotationLine } from "../models/quotationLine.model";
import { generateReceiptNo } from "../../../core/utils/receipt.util";
import { sequelize } from "../../../config/db";
import { SaleOrder } from "../models/saleOrder.model";
import { SaleOrderLine } from "../models/saleOrderLine.model";
import { PriceList, PriceListItem, Product, TaxRate, StockMove, StockMoveLine } from "../../../models";
import { Op } from "sequelize";

export const quotationService = {
  async getAll(user: any) {
    const where: any = {};
    if (user.role !== "ADMIN") {
      where.branch_id = user.branch_id;
    }
    return await Quotation.findAll({
      where,
      include: [{ model: QuotationLine, as: "lines" }],
      order: [["created_at", "DESC"]],
    });
  },

  async getById(id: number, user: any) {
    const q = await Quotation.findByPk(id, {
      include: [{ model: QuotationLine, as: "lines" }],
    });
    if (!q) throw new Error("Quotation not found");
    if (user.role !== "ADMIN" && q.branch_id !== user.branch_id) {
      throw new Error("Access denied (cross-branch)");
    }
    return q;
  },

  async create(data: any, user: any) {
    const t = await sequelize.transaction();
    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const prefixStr = `QT-${yyyy}${mm}${dd}`;

      const latestQt = await Quotation.findOne({
        where: { quotation_no: { [Op.like]: `${prefixStr}%` } },
        order: [["id", "DESC"]],
      });
      let seqQt = 1;
      if (latestQt && latestQt.quotation_no) {
        const last4 = Number(latestQt.quotation_no.slice(-4));
        seqQt = last4 + 1;
      }
      const qNo = `${prefixStr}-${String(seqQt).padStart(4, "0")}`;

      let totalBeforeTax = 0;
      let totalTax = 0;
      let totalAftertax = 0;

      const quotation = await Quotation.create({
        branch_id: user.branch_id,
        quotation_no: qNo,
        customer_id: data.customer_id,
        opportunity_id: data.opportunity_id || null,
        created_by: user.id,
        sales_person_id: data.sales_person_id || user.id,
        quotation_date: data.quotation_date || new Date().toISOString().slice(0, 10),
        valid_until: data.valid_until,
        currency_id: data.currency_id,
        exchange_rate: data.exchange_rate || 1,
        payment_term_id: data.payment_term_id,
        status: "draft",
        approval_status: "draft",
        version: 1,
        total_before_tax: 0,
        total_tax: 0,
        total_after_tax: 0,
        discount_percent: data.discount_percent || 0,
        discount_amount: data.discount_amount || 0,
        customer_notes: data.customer_notes,
        internal_notes: data.internal_notes,
      }, { transaction: t });

      const lines = data.lines || [];
      for (const line of lines) {
        let price = Number(line.unit_price || 0);
        let discPercent = Number(line.discount_percent || 0);

        // AUTO PRICE LIST LOOKUP
        if (price === 0 && data.price_list_id) {
          const pli = await PriceListItem.findOne({
            include: [{ model: PriceList, as: "priceList" }],
            where: {
              price_list_id: data.price_list_id,
              product_id: line.product_id,
              min_quantity: { [Op.lte]: Number(line.quantity || 1) }
            },
            order: [["min_quantity", "DESC"]],
            transaction: t
          }) as any;
          
          if (pli) {
            price = Number(pli.unit_price);
            // THIẾU LOGIC: Chuyển đổi tiền tệ nếu PriceList khác currency của Báo giá
            if (pli.priceList && pli.priceList.currency_id !== data.currency_id) {
               // Giả định đơn giản: Quy đổi về Base (VND) rồi sang Target (USD)
               // Ở đây ta chỉ log cảnh báo hoặc giả định PriceList luôn là Base Currency
            }
            if (discPercent === 0) discPercent = Number(pli.discount_percent);
          }
        }

        // Nếu vẫn = 0 thì lấy giá mặc định của Product
        if (price === 0) {
          const product = await Product.findByPk(line.product_id, { transaction: t });
          if (product) price = Number(product.sale_price || 0);
        }

        const qty = Number(line.quantity || 0);
        const discAmount = Number(line.discount_amount || 0);
        
        let lineSub = qty * price;
        if (discPercent > 0) lineSub = lineSub * (1 - discPercent / 100);
        else if (discAmount > 0) lineSub = lineSub - discAmount;
        
        // AUTO TAX LOOKUP
        let taxRateId = line.tax_rate_id;
        if (!taxRateId) {
            const product = await Product.findByPk(line.product_id, { transaction: t });
            taxRateId = product?.tax_rate_id;
        }

        let lineTaxAmt = 0;
        if (taxRateId) {
            const tax = await TaxRate.findByPk(taxRateId, { transaction: t });
            if (tax) lineTaxAmt = (lineSub * Number(tax.rate)) / 100;
        }
        
        await QuotationLine.create({
          quotation_id: quotation.id,
          product_id: line.product_id,
          description: line.description,
          quantity: qty,
          unit_price: price,
          discount_percent: discPercent,
          discount_amount: discAmount,
          tax_rate_id: taxRateId,
          line_total: lineSub,
          line_tax: lineTaxAmt,
          line_total_after_tax: lineSub + lineTaxAmt
        }, { transaction: t });

        totalBeforeTax += lineSub;
        totalTax += lineTaxAmt;
      }

      if (quotation.discount_percent > 0) {
        totalBeforeTax = totalBeforeTax * (1 - quotation.discount_percent / 100);
      } else if (quotation.discount_amount > 0) {
        totalBeforeTax = totalBeforeTax - quotation.discount_amount;
      }
      totalAftertax = totalBeforeTax + totalTax;

      await quotation.update({
        total_before_tax: totalBeforeTax,
        total_tax: totalTax,
        total_after_tax: totalAftertax
      }, { transaction: t });

      await t.commit();
      return quotation;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async update(id: number, data: any, user: any) {
    throw new Error("Update quotation logic pending");
  },

  async submit(id: number, user: any) {
    const q = await this.getById(id, user);
    if (q.status !== "draft" || q.approval_status !== "draft") throw new Error("Only draft quotes can be submitted");
    await q.update({ approval_status: "waiting_approval", submitted_at: new Date() });
    return q;
  },

  async approve(id: number, user: any) {
    const q = await this.getById(id, user);
    if (q.approval_status !== "waiting_approval") throw new Error("Quote is not waiting for approval");
    await q.update({
      approval_status: "approved",
      approved_by: user.id,
      approved_at: new Date()
    });
    return q;
  },

  async sendToCustomer(id: number, user: any) {
    const q = await this.getById(id, user);
    await q.update({ status: "sent", sent_at: new Date() });
    return q;
  },

  async markAccepted(id: number, user: any) {
    const q = await this.getById(id, user);
    if (q.valid_until && new Date() > new Date(q.valid_until)) {
      throw new Error("Báo giá đã hết hạn. Không thể chấp nhận.");
    }
    await q.update({ status: "accepted" });
    return q;
  },

  async duplicate(id: number, user: any) {
    const t = await sequelize.transaction();
    try {
      const q = await Quotation.findByPk(id, {
        include: [{ model: QuotationLine, as: "lines" }]
      }) as any;
      if (!q) throw new Error("Quotation not found");

      // Cập nhật bản cũ thành cancelled hoặc expired
      await q.update({ status: "cancelled" }, { transaction: t });

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const prefixStr = `QT-${yyyy}${mm}${dd}`;

      const latestQt = await Quotation.findOne({
        where: { quotation_no: { [require("sequelize").Op.like]: `${prefixStr}%` } },
        order: [["id", "DESC"]],
      });
      let seqQt = 1;
      if (latestQt && latestQt.quotation_no) {
        const last4 = Number(latestQt.quotation_no.slice(-4));
        seqQt = last4 + 1;
      }
      const qNo = `${prefixStr}-${String(seqQt).padStart(4, "0")}`;

      const newQuote = await Quotation.create({
        branch_id: user.branch_id,
        quotation_no: qNo,
        customer_id: q.customer_id,
        opportunity_id: q.opportunity_id,
        created_by: user.id,
        sales_person_id: q.sales_person_id,
        quotation_date: new Date().toISOString().slice(0, 10),
        valid_until: q.valid_until,
        currency_id: q.currency_id,
        exchange_rate: q.exchange_rate,
        payment_term_id: q.payment_term_id,
        status: "draft",
        approval_status: "draft",
        version: (q.version || 1) + 1,
        parent_id: q.parent_id || q.id, // trỏ về ID gốc cao nhất hoặc ID liền kề
        total_before_tax: q.total_before_tax,
        total_tax: q.total_tax,
        total_after_tax: q.total_after_tax,
        discount_percent: q.discount_percent,
        discount_amount: q.discount_amount,
        customer_notes: q.customer_notes,
        internal_notes: q.internal_notes,
      }, { transaction: t });

      for (const line of q.lines) {
        await QuotationLine.create({
          quotation_id: newQuote.id,
          product_id: line.product_id,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount_percent: line.discount_percent,
          discount_amount: line.discount_amount,
          tax_rate_id: line.tax_rate_id,
          line_total: line.line_total,
          line_tax: line.line_tax,
          line_total_after_tax: line.line_total_after_tax,
        }, { transaction: t });
      }

      await t.commit();
      return newQuote;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  async convertToOrder(id: number, user: any) {
    const t = await sequelize.transaction();
    try {
      const q = await Quotation.findByPk(id, {
        include: [{ model: QuotationLine, as: "lines" }]
      }) as any;
      if (!q) throw new Error("Quotation not found");
      if (q.status !== "accepted") {
        throw new Error("Chỉ được chuyển đổi Đơn hàng từ Báo giá đã được Khách hàng đồng ý.");
      }
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const prefixStr = `SO-${yyyy}${mm}${dd}`;

      const latestSo = await SaleOrder.findOne({
        where: { order_no: { [require("sequelize").Op.like]: `${prefixStr}%` } },
        order: [["id", "DESC"]],
      });
      let seqSo = 1;
      if (latestSo && latestSo.order_no) {
        const last4 = Number(latestSo.order_no.slice(-4));
        seqSo = last4 + 1;
      }
      const orderNo = `${prefixStr}-${String(seqSo).padStart(4, "0")}`;
      const order = await SaleOrder.create({
        branch_id: q.branch_id,
        order_no: orderNo,
        quotation_id: q.id,
        customer_id: q.customer_id,
        currency_id: q.currency_id,
        exchange_rate: q.exchange_rate,
        payment_term_id: q.payment_term_id,
        discount_percent: q.discount_percent,
        discount_amount: q.discount_amount,
        sales_person_id: q.sales_person_id,
        customer_notes: q.customer_notes,
        internal_notes: q.internal_notes,
        order_date: new Date(),
        created_by: user.id,
        status: "draft", 
        approval_status: "draft",
      }, { transaction: t });

      // ... sau khi create Lines sẽ gọi submit/approve hoặc xử lý StockMove ở đây
      // Để đạt chuẩn, ta bọc logic approve vào đây luôn:
      const orderStatus: any = "confirmed";
      const approvalStatus: any = "approved";
      await order.update({ status: orderStatus, approval_status: approvalStatus }, { transaction: t });

      for (const line of q.lines) {
        await SaleOrderLine.create({
          order_id: order.id,
          product_id: line.product_id,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount_percent: line.discount_percent,
          discount_amount: line.discount_amount,
          tax_rate_id: line.tax_rate_id,
          line_total: line.line_total,
          line_tax: line.line_tax,
          line_total_after_tax: line.line_total_after_tax,
        }, { transaction: t });
      }

      await order.update({
        total_before_tax: q.total_before_tax,
        total_tax: q.total_tax,
        total_after_tax: q.total_after_tax
      }, { transaction: t });

      // GIAO HÀNG TỰ ĐỘNG (STOCK MOVE)
      const nowSm = new Date();
      const prefixSm = `SM-${nowSm.getFullYear()}${String(nowSm.getMonth() + 1).padStart(2, "0")}${String(nowSm.getDate()).padStart(2, "0")}`;
      const latestSm = await StockMove.findOne({
        where: { move_no: { [Op.like]: `${prefixSm}%` } },
        order: [["id", "DESC"]],
        transaction: t
      });
      let seqSm = 1;
      if (latestSm && latestSm.move_no) seqSm = Number(latestSm.move_no.slice(-4)) + 1;
      const moveNo = `${prefixSm}-${String(seqSm).padStart(4, "0")}`;

      const newMove = await StockMove.create({
        move_no: moveNo,
        move_date: new Date(),
        type: "issue",
        reference_type: "sale_order",
        reference_id: order.id,
        branch_id: order.branch_id || null,
        status: "waiting_approval",
        created_by: user.id,
        note: `Tự động tạo từ Báo giá: ${q.quotation_no}`,
      }, { transaction: t });

      for (const line of q.lines) {
        await StockMoveLine.create({
          move_id: newMove.id,
          product_id: line.product_id,
          quantity: line.quantity,
        }, { transaction: t });
      }

      await q.update({ status: "converted" }, { transaction: t });

      await t.commit();
      return order;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
};
