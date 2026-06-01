// saleOrder.service.ts
import { SaleOrder } from "../models/saleOrder.model";
import { SaleOrderLine } from "../models/saleOrderLine.model";
import { TaxRate } from "../../master-data/models/taxRate.model";
import { Branch, Currency, Partner, Product, User, Uom, sequelize } from "../../../models";
import { Quotation } from "../models/quotation.model";
import { Opportunity } from "../../crm/models/opportunity.model";
import { StockMove } from "../../inventory/models/stockMove.model";
import { StockMoveLine } from "../../inventory/models/stockMoveLine.model";
import { ProductImage } from "../../product/models/productImage.model";
import { Op } from "sequelize";
import { JwtPayload } from "../../../core/types/jwt";
import { generateOrderNo } from "../utils";
import { Role } from "../../../core/types/enum";
import { notificationService } from "../../../core/services/notification.service";

export const saleOrderService = {
  /** -----------------------------------------------------
   * HELPER: Tính thuế từng dòng
   * ---------------------------------------------------- */
  async calcLineTax(line: any) {
    const qty = Number(line.quantity || 0);
    const price = Number(line.unit_price || 0);
    const discountPercent = Number(line.discount_percent || 0);
    const discountAmount = Number(line.discount_amount || 0);

    // Tính line_total có trừ discount
    let line_total = qty * price;
    if (discountPercent > 0) {
      line_total -= (line_total * discountPercent) / 100;
    }
    if (discountAmount > 0) {
      line_total -= discountAmount;
    }
    if (line_total < 0) line_total = 0;

    let line_tax = 0;
    let line_total_after_tax = line_total;

    if (line.tax_rate_id) {
      const tax = await TaxRate.findByPk(line.tax_rate_id);
      const rate = tax ? Number(tax.rate) : 0;
      line_tax = (line_total * rate) / 100;
      line_total_after_tax = line_total + line_tax;
    }

    return {
      line_total,
      line_tax,
      line_total_after_tax,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
    };
  },

  /** -----------------------------------------------------
   * HELPER: Tổng tiền toàn bộ Order
   * ---------------------------------------------------- */
  async calcTotals(lines: any[], globalDiscountPercent = 0, globalDiscountAmount = 0) {
    let total_before_tax = 0;
    let total_tax = 0;
    let total_after_tax = 0;

    for (const line of lines) {
      total_before_tax += Number(line.line_total || 0);
      total_tax += Number(line.line_tax || 0);
    }

    if (globalDiscountPercent > 0) {
      total_before_tax -= (total_before_tax * globalDiscountPercent) / 100;
    } else if (globalDiscountAmount > 0) {
      total_before_tax -= globalDiscountAmount;
    }

    if (total_before_tax < 0) total_before_tax = 0;

    total_after_tax = total_before_tax + total_tax;

    return { total_before_tax, total_tax, total_after_tax };
  },

  /** -----------------------------------------------------
   * GET ALL — lọc branch + ownership
   * ---------------------------------------------------- */
  async getAll(user: JwtPayload) {
    const where: any = { branch_id: user.branch_id };

    if (user.role === "SALES") {
      where.created_by = user.id;
    }

    return SaleOrder.findAll({
      where,
      include: [
        { model: SaleOrderLine, as: "lines" },
        {
          model: Partner,
          as: "customer",
          attributes: ["id", "name", "phone", "email", "tax_code"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "full_name"],
        },
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol", "name"] },
      ],
      order: [["id", "DESC"]],
    });
  },

  /** -----------------------------------------------------
   * GET DETAIL — kiểm tra quyền branch + ownership
   * ---------------------------------------------------- */
  async getById(id: number, user: any) {
    const order = await SaleOrder.findByPk(id, {
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "name"],
        },
        {
          model: Partner,
          as: "customer",
          attributes: ["id", "name", "email", "phone", "tax_code", "address"],
        },
        {
          model: Quotation,
          as: "quotation",
          attributes: ["id", "quotation_no"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "full_name"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "username", "full_name"],
        },
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol", "name"] },
        {
          model: SaleOrderLine,
          as: "lines",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "sku", "image_url", "sale_price"],
              include: [
                {
                  model: ProductImage,
                  as: "images",
                  attributes: ["id", "image_url"],
                },
                {
                  model: Uom,
                  as: "uom",
                  attributes: ["id", "name", "code"],
                },
              ],
            },
            {
              model: TaxRate,
              as: "taxRate",
              attributes: ["id", "name", "rate"],
            },
          ],
        },
      ],
    });
    if (!order) throw new Error("Sale order not found");
    if (order.branch_id !== user.branch_id) throw new Error("Cross-branch access denied");
    if (user.role === "SALES" && order.created_by !== user.id)
      throw new Error("You can only view your own sale orders");

    return order;
  },

  async getByStatus(status: string, user: any) {
    const where: any = {
      branch_id: user.branch_id,
      status: status,
    };
    if (user.role === Role.SALES) {
      where.created_by = user.id;
    }
    return SaleOrder.findAll({
      where,
      include: [
        {
          model: Partner,
          as: "customer",
          attributes: ["id", "name", "email", "phone", "tax_code", "address"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "full_name"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "username", "full_name"],
        },
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol", "name"] },
        {
          model: SaleOrderLine,
          as: "lines",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image_url", "sale_price"],
              include: [
                {
                  model: ProductImage,
                  as: "images",
                  attributes: ["id", "image_url"],
                },
              ],
            },
            {
              model: TaxRate,
              as: "taxRate",
              attributes: ["id", "name", "rate"],
            },
          ],
        },
      ],
      order: [["id", "DESC"]],
    });
  },

  /** -----------------------------------------------------
   * CREATE — Sales (Atomic Transaction)
   * ---------------------------------------------------- */
  async create(data: any, user: any) {
    return await sequelize.transaction(async (t) => {
      const quotation = data.quotation_id
        ? await Quotation.findByPk(data.quotation_id, { transaction: t })
        : null;
      const currencyId = data.currency_id ?? quotation?.currency_id ?? null;
      const exchangeRate = Number(data.exchange_rate || quotation?.exchange_rate || 1);

      const order = await SaleOrder.create(
        {
          branch_id: user.branch_id,
          order_no: await generateOrderNo(),
          customer_id: data.customer_id,
          created_by: user.id,
          order_date: data.order_date,
          approval_status: "draft",
          status: "draft",
          // Phase 3 enhancements
          quotation_id: data.quotation_id || null,
          currency_id: currencyId,
          exchange_rate: exchangeRate,
          payment_term_id: data.payment_term_id || quotation?.payment_term_id || null,
          discount_percent: data.discount_percent || quotation?.discount_percent || 0,
          discount_amount: data.discount_amount || quotation?.discount_amount || 0,
          customer_po_number: data.customer_po_number || null,
          delivery_address: data.delivery_address || null,
          expected_delivery_date: data.expected_delivery_date || null,
          sales_person_id: data.sales_person_id || quotation?.sales_person_id || user.id,
          internal_notes: data.internal_notes || quotation?.internal_notes || null,
          customer_notes: data.customer_notes || quotation?.customer_notes || null,
        },
        { transaction: t }
      );

      const createdLines = [];

      for (const line of data.lines) {
        const taxes = await this.calcLineTax(line);

        const createdLine = await SaleOrderLine.create(
          {
            order_id: order.id,
            product_id: line.product_id,
            uom_id: line.uom_id ?? null,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            tax_rate_id: line.tax_rate_id,
            line_total: taxes.line_total,
            line_tax: taxes.line_tax,
            line_total_after_tax: taxes.line_total_after_tax,
            discount_percent: taxes.discount_percent,
            discount_amount: taxes.discount_amount,
          },
          { transaction: t }
        );

        createdLines.push(createdLine);
      }

      const totals = await this.calcTotals(createdLines, order.discount_percent, order.discount_amount);

      await order.update(
        {
          total_before_tax: totals.total_before_tax,
          total_tax: totals.total_tax,
          total_after_tax: totals.total_after_tax,
        },
        { transaction: t }
      );

      return order;
    });
  },

  /** -----------------------------------------------------
   * UPDATE — Sales (Atomic Transaction)
   * ---------------------------------------------------- */
  async update(id: number, data: any, user: any) {
    return await sequelize.transaction(async (t) => {
      const order = await SaleOrder.findByPk(id, { transaction: t });
      if (!order) throw new Error("Order not found");

      // Permission Checks
      if (order.approval_status !== "draft") throw new Error("Only draft orders can be updated");

      if (order.branch_id !== user.branch_id) throw new Error("Cross-branch denied");

      if (user.role === "SALES" && order.created_by !== user.id) throw new Error("You can only modify your own orders");

      // Update order header
      await order.update(
        {
          customer_id: data.customer_id,
          order_date: data.order_date,
          // Phase 3 enhancements
          currency_id: data.currency_id,
          exchange_rate: data.exchange_rate,
          payment_term_id: data.payment_term_id,
          discount_percent: data.discount_percent,
          discount_amount: data.discount_amount,
          customer_po_number: data.customer_po_number,
          delivery_address: data.delivery_address,
          expected_delivery_date: data.expected_delivery_date,
          sales_person_id: data.sales_person_id,
          internal_notes: data.internal_notes,
          customer_notes: data.customer_notes,
        },
        { transaction: t }
      );

      // ============================
      // Delete removed lines
      // ============================
      if (data.deletedLineIds?.length) {
        await SaleOrderLine.destroy({
          where: { id: data.deletedLineIds, order_id: order.id },
          transaction: t,
        });
      }

      // ============================
      // Update / Add lines safely
      // ============================
      const updatedLines = [];

      for (const line of data.lines) {
        // Validate line format
        const quantity = Number(line.quantity || 0);
        const unit_price = Number(line.unit_price || 0);
        if (quantity < 0 || unit_price < 0) throw new Error("Invalid price/qty");

        const taxes = await this.calcLineTax({ ...line, quantity, unit_price });

        if (line.id) {
          // Validate line belongs to this order
          const existingLine = await SaleOrderLine.findByPk(line.id, { transaction: t });
          if (!existingLine || existingLine.order_id !== order.id) throw new Error("Invalid order line");

          await existingLine.update(
            {
              product_id: line.product_id,
              uom_id: line.uom_id ?? null,
              description: line.description,
              quantity,
              unit_price,
              tax_rate_id: line.tax_rate_id,
              line_total: taxes.line_total,
              line_tax: taxes.line_tax,
              line_total_after_tax: taxes.line_total_after_tax,
            },
            { transaction: t }
          );

          updatedLines.push(existingLine);
        } else {
          const newLine = await SaleOrderLine.create(
            {
              order_id: order.id,
              product_id: line.product_id,
              uom_id: line.uom_id ?? null,
              description: line.description,
              quantity,
              unit_price,
              tax_rate_id: line.tax_rate_id,
              line_total: taxes.line_total,
              line_tax: taxes.line_tax,
              line_total_after_tax: taxes.line_total_after_tax,
            },
            { transaction: t }
          );

          updatedLines.push(newLine);
        }
      }

      // ============================
      // Recalculate totals
      // ============================
      const totals = await this.calcTotals(updatedLines, order.discount_percent, order.discount_amount);

      await order.update(
        {
          total_before_tax: totals.total_before_tax,
          total_tax: totals.total_tax,
          total_after_tax: totals.total_after_tax,
        },
        { transaction: t }
      );

      return order;
    });
  },

  /** -----------------------------------------------------
   * SUBMIT — Sales (Atomic Transaction)
   * ---------------------------------------------------- */
  async submit(id: number, user: any, app?: any) {
    return await sequelize.transaction(async (t) => {
      const order = await SaleOrder.findByPk(id, { transaction: t });

      if (!order) throw new Error("Order not found");
      if (order.approval_status !== "draft") throw new Error("Order already submitted");
      if (order.branch_id !== user.branch_id) throw new Error("Cross-branch denied");
      if (order.created_by !== user.id) throw new Error("Only the creator can submit");

      await order.update(
        {
          approval_status: "waiting_approval",
          submitted_at: new Date(),
        },
        { transaction: t }
      );

      // Gửi thông báo
      if (app) {
        const io = app.get("io");
        setImmediate(async () => {
          await notificationService.createNotification({
            type: "SUBMIT",
            referenceType: "SALE_ORDER",
            referenceId: order.id!,
            referenceNo: order.order_no!,
            branchId: order.branch_id!,
            submitterId: user.id,
            submitterName: user.fullName || user.username,
            io,
          });
        });
      }

      return order;
    });
  },

  /** -----------------------------------------------------
   * APPROVE — Sale Manager (Atomic Transaction)
   * ---------------------------------------------------- */
  async approve(id: number, manager: any, app?: any) {
    return await sequelize.transaction(async (t) => {
      const order = (await SaleOrder.findByPk(id, {
        include: [{ model: SaleOrderLine, as: "lines" }],
        transaction: t,
      })) as any;

      if (!order) throw new Error("Order not found");
      if (order.approval_status !== "waiting_approval") throw new Error("Order not in approval stage");

      if (order.branch_id !== manager.branch_id) throw new Error("Cross-branch denied");

      // KIỂM TRA CREDIT LIMIT
      const partner = await Partner.findByPk(order.customer_id, { transaction: t });
      if (partner && partner.credit_limit && Number(partner.credit_limit) > 0) {
        const confirmedOrders = await SaleOrder.findAll({
          where: { customer_id: partner.id, status: { [Op.in]: ["confirmed"] } },
          transaction: t,
        });
        const totalDebt = confirmedOrders.reduce(
          (sum, item) => sum + Number(item.total_after_tax || 0) * Number(item.exchange_rate || 1),
          0
        );
        const currentDebt = totalDebt + Number(order.total_after_tax || 0) * Number(order.exchange_rate || 1);
        if (currentDebt > Number(partner.credit_limit)) {
          throw new Error(
            `Đơn hàng vượt quá Hạn Mức Công Nợ tối đa của khách hàng. (Mức nợ dự kiến: ${currentDebt} > Hạn mức: ${partner.credit_limit})`
          );
        }
      }

      await order.update(
        {
          approval_status: "approved",
          approved_at: new Date(),
          approved_by: manager.id,
          status: "confirmed",
        },
        { transaction: t }
      );

      // AUTO STOCK MOVE
      const now = new Date();
      const prefixStr = `SM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

      const latestSm = await StockMove.findOne({
        where: { move_no: { [Op.like]: `${prefixStr}%` } },
        order: [["id", "DESC"]],
        transaction: t,
      });
      let seqSm = 1;
      if (latestSm && latestSm.move_no) {
        seqSm = Number(latestSm.move_no.slice(-4)) + 1;
      }
      const moveNo = `${prefixStr}-${String(seqSm).padStart(4, "0")}`;

      const newMove = await StockMove.create(
        {
          move_no: moveNo,
          move_date: new Date(),
          type: "issue",
          reference_type: "sale_order",
          reference_id: order.id,
          branch_id: order.branch_id,
          status: "waiting_approval",
          created_by: manager.id,
          note: `Tự động tạo lệnh xuất kho cho Sale Order: ${order.order_no}`,
        },
        { transaction: t }
      );

      if (order.lines?.length) {
        const moveLines = order.lines.map((line: any) => ({
          move_id: newMove.id,
          product_id: line.product_id,
          quantity: line.quantity,
        }));
        await StockMoveLine.bulkCreate(moveLines, { transaction: t });
      }

      // CRM LOOPBACK
      if (order.quotation_id) {
        const q = await Quotation.findByPk(order.quotation_id, { transaction: t });
        if (q && q.opportunity_id) {
          const opp = await Opportunity.findByPk(q.opportunity_id, { transaction: t });
          if (opp && opp.stage !== "won") {
            await opp.update(
              {
                stage: "won",
                expected_value: order.total_after_tax || 0,
                currency_id: order.currency_id,
                exchange_rate: order.exchange_rate,
              },
              { transaction: t }
            );
          }
        }
      }

      // Notifications
      if (app && order.created_by) {
        const io = app.get("io");
        setImmediate(async () => {
          await notificationService.createNotification({
            type: "APPROVE",
            referenceType: "SALE_ORDER",
            referenceId: order.id!,
            referenceNo: order.order_no!,
            branchId: order.branch_id!,
            submitterId: order.created_by,
            approverName: manager.fullName || manager.username,
            io,
          });
        });
      }

      return order;
    });
  },

  /** -----------------------------------------------------
   * REJECT — Sale Manager (Atomic Transaction)
   * ---------------------------------------------------- */
  async reject(id: number, manager: any, reason: string, app?: any) {
    return await sequelize.transaction(async (t) => {
      const order = await SaleOrder.findByPk(id, { transaction: t });

      if (!order) throw new Error("Order not found");
      if (order.approval_status !== "waiting_approval") throw new Error("Invalid stage");

      if (order.branch_id !== manager.branch_id) throw new Error("Cross-branch denied");

      await order.update(
        {
          approval_status: "rejected",
          reject_reason: reason,
          approved_by: manager.id,
          status: "draft",
        },
        { transaction: t }
      );

      // Gửi thông báo
      if (app && order.created_by) {
        const io = app.get("io");
        setImmediate(async () => {
          await notificationService.createNotification({
            type: "REJECT",
            referenceType: "SALE_ORDER",
            referenceId: order.id!,
            referenceNo: order.order_no!,
            branchId: order.branch_id!,
            submitterId: order.created_by,
            approverName: manager.fullName || manager.username,
            rejectReason: reason,
            io,
          });
        });
      }

      return order;
    });
  },
};
