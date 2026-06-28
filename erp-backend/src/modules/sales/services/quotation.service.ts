import { Quotation } from "../models/quotation.model";
import { QuotationLine } from "../models/quotationLine.model";
import { generateReceiptNo } from "../../../core/utils/receipt.util";
import { sequelize } from "../../../config/db";
import { SaleOrder } from "../models/saleOrder.model";
import { SaleOrderLine } from "../models/saleOrderLine.model";
import { StockMove } from "../../inventory/models/stockMove.model";
import { StockMoveLine } from "../../inventory/models/stockMoveLine.model";
import { Currency, ExchangeRate, Opportunity, PriceList, PriceListItem, Product, TaxRate, Uom, Partner, User, Branch } from "../../../models";
import { Op } from "sequelize";
import { Role } from "../../../core/types/enum";
import { getCompanyBranchIds } from "../../finance/services/companyScope.service";

async function getCurrencyRateToVnd(currencyId?: number | null, fallbackRate?: number | null) {
  if (!currencyId) return Number(fallbackRate || 1);

  const currency = await Currency.findByPk(currencyId);
  if (!currency || currency.code === "VND") return 1;
  if (fallbackRate && Number(fallbackRate) > 0) return Number(fallbackRate);

  const vnd = await Currency.findOne({ where: { code: "VND" } });
  if (!vnd) return 1;

  const latest = await ExchangeRate.findOne({
    where: { base_currency_id: vnd.id, quote_currency_id: currencyId },
    order: [["valid_date", "DESC"]],
  });
  const vndToForeign = Number(latest?.rate || 0);
  return vndToForeign > 0 ? 1 / vndToForeign : 1;
}

async function convertBetweenCurrencies(
  amount: number,
  sourceCurrencyId?: number | null,
  targetCurrencyId?: number | null,
  targetRate?: number | null
) {
  const sourceRate = await getCurrencyRateToVnd(sourceCurrencyId);
  const targetRateToVnd = await getCurrencyRateToVnd(targetCurrencyId, targetRate);
  return (amount * sourceRate) / targetRateToVnd;
}

function canAutoApproveSaleOrder(user: any) {
  return [Role.SALESMANAGER, Role.ADMIN].includes(user?.role);
}

export const quotationService = {
  async getAll(user: any) {
    const where: any = {};
    const companyBranchIds = await getCompanyBranchIds(user);

    if (user.role === "ADMIN" || user.role === "CEO") {
      where.branch_id = { [Op.in]: companyBranchIds };
    } else if (user.role === "SALESMANAGER" || user.role === "BRANCH_MANAGER") {
      if (user.branch_id && companyBranchIds.includes(Number(user.branch_id))) {
        where.branch_id = user.branch_id;
      } else {
        where.branch_id = { [Op.in]: companyBranchIds };
      }
    } else {
      if (user.branch_id && companyBranchIds.includes(Number(user.branch_id))) {
        where.branch_id = user.branch_id;
      } else {
        where.branch_id = { [Op.in]: companyBranchIds };
      }
      where.sales_person_id = user.id;
    }
    return await Quotation.findAll({
      where,
      include: [
        { model: QuotationLine, as: "lines" },
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol", "name"] },
        { model: Partner, as: "customer", attributes: ["id", "name", "phone", "email"] },
        { model: Opportunity, as: "opportunity", attributes: ["id", "name"] },
        { model: User, as: "creator", attributes: ["id", "username", "full_name"] },
      ],
      order: [["created_at", "DESC"]],
    });
  },

  async getByOpportunity(opportunityId: number, user: any) {
    const where: any = { opportunity_id: opportunityId };
    const companyBranchIds = await getCompanyBranchIds(user);

    if (user.role === "ADMIN" || user.role === "CEO") {
      where.branch_id = { [Op.in]: companyBranchIds };
    } else if (user.role === "SALESMANAGER" || user.role === "BRANCH_MANAGER") {
      if (user.branch_id && companyBranchIds.includes(Number(user.branch_id))) {
        where.branch_id = user.branch_id;
      } else {
        where.branch_id = { [Op.in]: companyBranchIds };
      }
    } else {
      if (user.branch_id && companyBranchIds.includes(Number(user.branch_id))) {
        where.branch_id = user.branch_id;
      } else {
        where.branch_id = { [Op.in]: companyBranchIds };
      }
      where.sales_person_id = user.id;
    }
    return await Quotation.findAll({
      where,
      include: [
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol"] },
      ],
      order: [["created_at", "DESC"]],
    });
  },

  async getById(id: number, user: any) {
    const q = await Quotation.findByPk(id, {
      include: [
        {
          model: QuotationLine, as: "lines",
          include: [
            {
              model: Product, as: "product",
              attributes: ["id", "name", "sku", "image_url", "sale_price"],
              include: [{ model: Uom, as: "uom", attributes: ["id", "name", "code"] }],
            },
            { model: TaxRate, as: "taxRate", attributes: ["id", "name", "rate"] },
            { model: Uom, as: "uom", attributes: ["id", "name", "code"] },
          ],
        },
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol", "name"] },
        { model: Partner, as: "customer", attributes: ["id", "name", "phone", "email", "tax_code", "address", "contact_person"] },
        { model: Branch, as: "branch", attributes: ["id", "name"] },
        { model: User, as: "creator", attributes: ["id", "username", "full_name"] },
        { model: User, as: "approver", attributes: ["id", "username", "full_name"] },
        { model: Opportunity, as: "opportunity", attributes: ["id", "name"] },
      ],
    });
    if (!q) throw new Error("Quotation not found");
    const companyBranchIds = await getCompanyBranchIds(user);
    if (!companyBranchIds.includes(Number(q.branch_id))) {
      throw new Error("Access denied (cross-company)");
    }
    // Branch check: non-ADMIN/CEO chỉ được xem trong branch mình
    if (user.role !== "ADMIN" && user.role !== "CEO" && q.branch_id !== user.branch_id)
      throw new Error("Access denied (cross-branch)");
    // SALES chỉ xem báo giá của mình
    if (user.role === "SALES" && q.sales_person_id !== user.id)
      throw new Error("Access denied: bạn không phụ trách báo giá này");
    return q;
  },

  /** SALESMANAGER chuyển báo giá sang sales khác trong cùng branch */
  async reassign(id: number, newSalesId: number, manager: any) {
    if (!["SALESMANAGER", "BRANCH_MANAGER", "ADMIN", "CEO"].includes(manager.role))
      throw new Error("Chỉ Sales Manager, Branch Manager, CEO hoặc Admin mới có thể chuyển đổi báo giá");
    const q = await Quotation.findByPk(id);
    if (!q) throw new Error("Quotation not found");

    const companyBranchIds = await getCompanyBranchIds(manager);
    if (!companyBranchIds.includes(Number(q.branch_id))) {
      throw new Error("Access denied (cross-company)");
    }

    if (manager.role !== "ADMIN" && manager.role !== "CEO" && q.branch_id !== manager.branch_id)
      throw new Error("Cross-branch denied");
    const targetUser = await User.findByPk(newSalesId);
    if (!targetUser) throw new Error("Sales user không tồn tại");

    if (!companyBranchIds.includes(Number((targetUser as any).branch_id))) {
      throw new Error("Không thể chuyển cho sales ở công ty khác");
    }

    if (manager.role !== "ADMIN" && manager.role !== "CEO" && (targetUser as any).branch_id !== manager.branch_id)
      throw new Error("Không thể chuyển cho sales ở branch khác");
    const old = q.sales_person_id;
    await q.update({ sales_person_id: newSalesId });
    return { quotation: q, from: old, to: newSalesId };
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
      let currencyId = data.currency_id ?? null;
      let exchangeRate = Number(data.exchange_rate || 0);

      if (data.opportunity_id && (!currencyId || !exchangeRate)) {
        const opp = await Opportunity.findByPk(data.opportunity_id, { transaction: t });
        currencyId = currencyId ?? (opp?.currency_id ?? null);
        exchangeRate = exchangeRate || Number(opp?.exchange_rate || 1);
      }
      if (!exchangeRate || exchangeRate <= 0) {
        exchangeRate = await getCurrencyRateToVnd(currencyId);
      }

      const quotation = await Quotation.create({
        branch_id: user.branch_id,
        quotation_no: qNo,
        customer_id: data.customer_id,
        opportunity_id: data.opportunity_id || null,
        created_by: user.id,
        sales_person_id: data.sales_person_id || user.id,
        quotation_date: data.quotation_date || new Date().toISOString().slice(0, 10),
        valid_until: data.valid_until,
        currency_id: currencyId,
        exchange_rate: exchangeRate,
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
            if (pli.priceList && pli.priceList.currency_id !== currencyId) {
              price = await convertBetweenCurrencies(
                price,
                pli.priceList.currency_id,
                currencyId,
                exchangeRate
              );
            }
            if (discPercent === 0) discPercent = Number(pli.discount_percent);
          }
        }

        // Nếu vẫn = 0 thì lấy giá mặc định của Product
        if (price === 0) {
          const product = await Product.findByPk(line.product_id, { transaction: t });
          if (product) {
            price = await convertBetweenCurrencies(
              Number(product.sale_price || 0),
              null,
              currencyId,
              exchangeRate
            );
          }
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
          uom_id: line.uom_id ?? null,
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

      // Chiết khấu cấp đơn (order-level discount): giảm trừ vào doanh thu chịu thuế
      // TRƯỚC khi tính VAT (chuẩn thuế GTGT VN). Áp dụng cùng hệ số lên cả base và
      // tax (thuế tỉ lệ thuận với base) để thuế giảm theo, đồng thời tránh để tổng âm.
      let discountFactor = 1;
      if (quotation.discount_percent > 0) {
        discountFactor = 1 - quotation.discount_percent / 100;
      } else if (quotation.discount_amount > 0 && totalBeforeTax > 0) {
        discountFactor = Math.max(0, 1 - quotation.discount_amount / totalBeforeTax);
      }
      totalBeforeTax = totalBeforeTax * discountFactor;
      totalTax = totalTax * discountFactor;
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
    return await sequelize.transaction(async (t) => {
      const q = await Quotation.findByPk(id, { transaction: t });
      if (!q) throw new Error("Quotation not found");

      // Permission Checks
      if (q.approval_status !== "draft" && q.status !== "draft") {
        throw new Error("Chỉ báo giá nháp mới có thể cập nhật.");
      }

      const companyBranchIds = await getCompanyBranchIds(user);
      if (!companyBranchIds.includes(Number(q.branch_id))) {
        throw new Error("Access denied (cross-company)");
      }

      if (user.role !== "ADMIN" && user.role !== "CEO" && q.branch_id !== user.branch_id) {
        throw new Error("Access denied (cross-branch)");
      }

      if (user.role === "SALES" && q.sales_person_id !== user.id) {
        throw new Error("Access denied: bạn không phụ trách báo giá này");
      }

      // Calculate exchange rate if currency is updated
      let exchangeRate = Number(data.exchange_rate || 0);
      if (data.currency_id && (!exchangeRate || exchangeRate <= 0)) {
        exchangeRate = await getCurrencyRateToVnd(data.currency_id, null);
      } else if (!exchangeRate || exchangeRate <= 0) {
        exchangeRate = Number(q.exchange_rate || 1);
      }

      // Update quotation header
      await q.update({
        customer_id: data.customer_id,
        opportunity_id: data.opportunity_id || null,
        sales_person_id: data.sales_person_id || user.id,
        quotation_date: data.quotation_date || q.quotation_date,
        valid_until: data.valid_until,
        currency_id: data.currency_id ?? null,
        exchange_rate: exchangeRate,
        payment_term_id: data.payment_term_id,
        discount_percent: data.discount_percent || 0,
        discount_amount: data.discount_amount || 0,
        customer_notes: data.customer_notes,
        internal_notes: data.internal_notes,
      }, { transaction: t });

      // Delete removed lines
      if (data.deletedLineIds?.length) {
        await QuotationLine.destroy({
          where: { id: data.deletedLineIds, quotation_id: q.id },
          transaction: t,
        });
      }

      // Update / Add lines
      const updatedLines = [];
      let totalBeforeTax = 0;
      let totalTax = 0;

      const lines = data.lines || [];
      for (const line of lines) {
        const qty = Number(line.quantity || 0);
        let price = Number(line.unit_price || 0);
        if (qty < 0 || price < 0) throw new Error("Invalid price/qty");

        const discPercent = Number(line.discount_percent || 0);
        const discAmount = Number(line.discount_amount || 0);

        let lineSub = qty * price;
        if (discPercent > 0) lineSub = lineSub * (1 - discPercent / 100);
        else if (discAmount > 0) lineSub = lineSub - discAmount;

        // Auto tax rate lookup
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

        const lineData = {
          product_id: line.product_id,
          uom_id: line.uom_id ?? null,
          description: line.description,
          quantity: qty,
          unit_price: price,
          discount_percent: discPercent,
          discount_amount: discAmount,
          tax_rate_id: taxRateId,
          line_total: lineSub,
          line_tax: lineTaxAmt,
          line_total_after_tax: lineSub + lineTaxAmt,
        };

        if (line.id) {
          const existingLine = await QuotationLine.findByPk(line.id, { transaction: t });
          if (!existingLine || existingLine.quotation_id !== q.id) {
            throw new Error("Invalid quotation line");
          }
          await existingLine.update(lineData, { transaction: t });
          updatedLines.push(existingLine);
        } else {
          const newLine = await QuotationLine.create({
            quotation_id: q.id,
            ...lineData,
          }, { transaction: t });
          updatedLines.push(newLine);
        }

        totalBeforeTax += lineSub;
        totalTax += lineTaxAmt;
      }

      // Order-level discount recalculation
      let discountFactor = 1;
      const discount_percent = Number(data.discount_percent || 0);
      const discount_amount = Number(data.discount_amount || 0);

      if (discount_percent > 0) {
        discountFactor = 1 - discount_percent / 100;
      } else if (discount_amount > 0 && totalBeforeTax > 0) {
        discountFactor = Math.max(0, 1 - discount_amount / totalBeforeTax);
      }

      totalBeforeTax = totalBeforeTax * discountFactor;
      totalTax = totalTax * discountFactor;
      const totalAftertax = totalBeforeTax + totalTax;

      await q.update({
        total_before_tax: totalBeforeTax,
        total_tax: totalTax,
        total_after_tax: totalAftertax,
      }, { transaction: t });

      return q;
    });
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

  async reject(id: number, user: any, reason: string) {
    const q = await this.getById(id, user);
    if (q.approval_status !== "waiting_approval") throw new Error("Quote is not waiting for approval");
    await q.update({
      status: "rejected",
      approval_status: "rejected",
      reject_reason: reason,
      approved_by: user.id,
      approved_at: new Date(),
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
    if (q.valid_until) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const validUntilStr = new Date(q.valid_until).toISOString().slice(0, 10);
      if (todayStr > validUntilStr) {
        throw new Error("Báo giá đã hết hạn. Không thể chấp nhận.");
      }
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
        include: [{ model: QuotationLine, as: "lines" }],
        lock: t.LOCK.UPDATE,
        transaction: t,
      }) as any;
      if (!q) throw new Error("Không tìm thấy báo giá.");

      // Chống tạo đơn trùng (kể cả khi 2 request đồng thời): nếu đã tồn tại đơn
      // hàng gắn với báo giá này thì dừng ngay.
      const dupOrder = await SaleOrder.findOne({
        where: { quotation_id: q.id },
        order: [["id", "DESC"]],
        transaction: t,
      });
      if (dupOrder) {
        throw new Error(
          `Báo giá này đã được tạo đơn hàng trước đó (${dupOrder.order_no}). Không thể chuyển đổi lại.`,
        );
      }

      // Đã chuyển đổi trước đó → báo rõ ràng thay vì để rơi vào lỗi trạng thái chung.
      if (q.status === "converted") {
        const existingOrder = await SaleOrder.findOne({
          where: { quotation_id: q.id },
          order: [["id", "DESC"]],
        });
        throw new Error(
          existingOrder
            ? `Báo giá này đã được tạo đơn hàng trước đó (${existingOrder.order_no}). Không thể chuyển đổi lại.`
            : "Báo giá này đã được chuyển thành đơn hàng trước đó. Không thể chuyển đổi lại.",
        );
      }

      if (q.status !== "accepted") {
        throw new Error("Chỉ được chuyển đổi đơn hàng từ báo giá đã được khách hàng đồng ý.");
      }
      if (q.approval_status !== "approved") {
        throw new Error("Báo giá phải được duyệt trước khi chuyển thành đơn hàng.");
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

      const createdLines = [];
      for (const line of q.lines) {
        const createdLine = await SaleOrderLine.create({
          order_id: order.id,
          product_id: line.product_id,
          uom_id: line.uom_id ?? null,
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
        createdLines.push(createdLine);
      }

      await order.update({
        total_before_tax: q.total_before_tax,
        total_tax: q.total_tax,
        total_after_tax: q.total_after_tax
      }, { transaction: t });

      if (canAutoApproveSaleOrder(user)) {
        const partner = await Partner.findByPk(order.customer_id, { transaction: t });
        if (partner && partner.credit_limit && Number(partner.credit_limit) > 0) {
          const confirmedOrders = await SaleOrder.findAll({
            where: { customer_id: partner.id, status: { [Op.in]: ["confirmed"] } },
            transaction: t,
          });
          const totalDebt = confirmedOrders.reduce(
            (sum, item) => sum + Number(item.total_after_tax || 0) * Number(item.exchange_rate || 1),
            0,
          );
          const currentDebt = totalDebt + Number(order.total_after_tax || 0) * Number(order.exchange_rate || 1);
          if (currentDebt > Number(partner.credit_limit)) {
            throw new Error(
              `Don hang vuot qua han muc cong no toi da cua khach hang. (Muc no du kien: ${currentDebt} > Han muc: ${partner.credit_limit})`,
            );
          }
        }

        await order.update({
          approval_status: "approved",
          approved_at: new Date(),
          approved_by: user.id,
          status: "confirmed",
          delivery_status: "pending",
        }, { transaction: t });

        const moveDate = new Date();
        const movePrefix = `SM-${moveDate.getFullYear()}${String(moveDate.getMonth() + 1).padStart(2, "0")}${String(moveDate.getDate()).padStart(2, "0")}`;
        const latestMove = await StockMove.findOne({
          where: { move_no: { [Op.like]: `${movePrefix}%` } },
          order: [["id", "DESC"]],
          transaction: t,
        });
        const moveSeq = latestMove?.move_no ? Number(latestMove.move_no.slice(-4)) + 1 : 1;
        const stockMove = await StockMove.create({
          move_no: `${movePrefix}-${String(moveSeq).padStart(4, "0")}`,
          move_date: new Date(),
          type: "issue",
          reference_type: "sale_order",
          reference_id: order.id,
          branch_id: order.branch_id ?? null,
          warehouse_from_id: null,
          status: "draft",
          created_by: user.id,
          note: `Tu dong tao lenh xuat kho cho Sale Order: ${order.order_no}`,
        }, { transaction: t });

        if (createdLines.length) {
          await StockMoveLine.bulkCreate(
            createdLines.map((line: any) => ({
              move_id: stockMove.id,
              product_id: line.product_id,
              quantity: line.quantity,
            })),
            { transaction: t },
          );
        }

        if (q.opportunity_id) {
          const opp = await Opportunity.findByPk(q.opportunity_id, { transaction: t });
          if (opp && opp.stage !== "won") {
            await opp.update({
              stage: "won",
              expected_value: order.total_after_tax || 0,
              currency_id: order.currency_id ?? null,
              exchange_rate: Number(order.exchange_rate || 1),
            }, { transaction: t });
          }
        }
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
