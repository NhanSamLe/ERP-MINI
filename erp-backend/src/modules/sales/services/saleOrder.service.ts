// saleOrder.service.ts
import { SaleOrder } from "../models/saleOrder.model";
import { SaleOrderLine } from "../models/saleOrderLine.model";
import { TaxRate } from "../../master-data/models/taxRate.model";
import { Branch, Partner,  Product, User } from "../../../models";
import { ProductImage } from "../../product/models/productImage.model";
import { Op } from "sequelize";
import { JwtPayload } from "../../../core/types/jwt";
import { generateOrderNo
 } from "../utils";
export const saleOrderService = {
    
  /** -----------------------------------------------------
   * HELPER: Tính thuế từng dòng
   * ---------------------------------------------------- */
  async calcLineTax(line: any) {
    const qty = Number(line.quantity || 0);
    const price = Number(line.unit_price || 0);
    const line_total = qty * price;

    let line_tax = 0;
    let line_total_after_tax = line_total;

    if (line.tax_rate_id) {
      const tax = await TaxRate.findByPk(line.tax_rate_id);
      const rate = tax ? Number(tax.rate) : 0;
      line_tax = (line_total * rate) / 100;
      line_total_after_tax = line_total + line_tax;
    }

    return { line_total, line_tax, line_total_after_tax };
  },

  /** -----------------------------------------------------
   * HELPER: Tổng tiền toàn bộ Order
   * ---------------------------------------------------- */
  async calcTotals(lines: any[]) {
    let total_before_tax = 0;
    let total_tax = 0;
    let total_after_tax = 0;

    for (const line of lines) {
      total_before_tax += Number(line.line_total || 0);
      total_tax += Number(line.line_tax || 0);
      total_after_tax += Number(line.line_total_after_tax || 0);
    }

    return { total_before_tax, total_tax, total_after_tax };
  },
  /** -----------------------------------------------------
   * GET ALL — lọc branch + ownership
   * ---------------------------------------------------- */
  async getAll(user: JwtPayload) {
    const where: any = { branch_id: user.branch_id};

    if (user.role === "SALES") {
      where.created_by = user.id;
    }

    return SaleOrder.findAll({
      where,
      include: [{ model: SaleOrderLine, as: "lines" }, {
        model: User,
        as: "creator",                           // ⭐ LẤY THÊM NGƯỜI TẠO
        attributes: ["id", "username", "full_name"],
      }],
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
          model: User,
          as: "creator",   
          attributes: ["id", "username", "full_name"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "username", "full_name"],
        },
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
    });
    if (!order) throw new Error("Sale order not found");
    if (order.branch_id !== user.branch_id) throw new Error("Cross-branch access denied");
    if (user.role === "SALES" && order.created_by !== user.id)
      throw new Error("You can only view your own sale orders");

    return order;
  },

  /** -----------------------------------------------------
   * CREATE — Sales
   * ---------------------------------------------------- */
  async create(data: any, user: any) {
    const order = await SaleOrder.create({
      branch_id: user.branch_id,
      order_no: await generateOrderNo(), 
      customer_id: data.customer_id,
      created_by: user.id,
      order_date: data.order_date,
      approval_status: "draft",
      status: "draft",
    });

    const createdLines = [];

    for (const line of data.lines) {
      const taxes = await this.calcLineTax(line);

      const createdLine = await SaleOrderLine.create({
        order_id: order.id,
        product_id: line.product_id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        tax_rate_id: line.tax_rate_id,
        line_total: taxes.line_total,
        line_tax: taxes.line_tax,
        line_total_after_tax: taxes.line_total_after_tax,
      });

      createdLines.push(createdLine);
    }

    const totals = await this.calcTotals(createdLines);

    await order.update({
      total_before_tax: totals.total_before_tax,
      total_tax: totals.total_tax,
      total_after_tax: totals.total_after_tax,
    });

    return this.getById(order.id, user);
  },

  /** -----------------------------------------------------
   * UPDATE — Sales nhưng chỉ khi DRAFT + same branch
   * ---------------------------------------------------- */
  async update(id: number, data: any, user: any) {
        const order = await SaleOrder.findByPk(id);
        if (!order) throw new Error("Order not found");

        // Permission Checks
        if (order.approval_status !== "draft")
            throw new Error("Only draft orders can be updated");

        if (order.branch_id !== user.branch_id)
            throw new Error("Cross-branch denied");

        if (user.role === "SALES" && order.created_by !== user.id)
            throw new Error("You can only modify your own orders");

        // Update order header
        await order.update({
            customer_id: data.customer_id,
            order_date: data.order_date,
        });

        // ============================
        // Delete removed lines
        // ============================
        if (data.deletedLineIds?.length) {
            await SaleOrderLine.destroy({ where: { id: data.deletedLineIds, order_id: order.id } });
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
            const existingLine = await SaleOrderLine.findByPk(line.id);
            if (!existingLine || existingLine.order_id !== order.id)
                throw new Error("Invalid order line");

            await existingLine.update({
                product_id: line.product_id,
                description: line.description,
                quantity,
                unit_price,
                tax_rate_id: line.tax_rate_id,
                line_total: taxes.line_total,
                line_tax: taxes.line_tax,
                line_total_after_tax: taxes.line_total_after_tax,
            });

            updatedLines.push(existingLine);
            } else {
            const newLine = await SaleOrderLine.create({
                order_id: order.id,
                product_id: line.product_id,
                description: line.description,
                quantity,
                unit_price,
                tax_rate_id: line.tax_rate_id,
                line_total: taxes.line_total,
                line_tax: taxes.line_tax,
                line_total_after_tax: taxes.line_total_after_tax,
            });

            updatedLines.push(newLine);
            }
        }

        // ============================
        // Recalculate totals
        // ============================
        const totals = await this.calcTotals(updatedLines);

        await order.update({
            total_before_tax: totals.total_before_tax,
            total_tax: totals.total_tax,
            total_after_tax: totals.total_after_tax,
        });

        return this.getById(id, user);
        },


  /** -----------------------------------------------------
   * SUBMIT — Sales
   * ---------------------------------------------------- */
  async submit(id: number, user: any) {
    const order = await SaleOrder.findByPk(id);

    if (!order) throw new Error("Order not found");
    if (order.approval_status !== "draft") throw new Error("Order already submitted");
    if (order.branch_id !== user.branch_id) throw new Error("Cross-branch denied");
    if (order.created_by !== user.id) throw new Error("Only the creator can submit");

    await order.update({
      approval_status: "waiting_approval",
      submitted_at: new Date(),
    });

    return order;
  },

  /** -----------------------------------------------------
   * APPROVE — Sale Manager
   * ---------------------------------------------------- */
  async approve(id: number, manager: any) {
    const order = await SaleOrder.findByPk(id);

    if (!order) throw new Error("Order not found");
    if (order.approval_status !== "waiting_approval")
      throw new Error("Order not in approval stage");

    if (order.branch_id !== manager.branch_id) throw new Error("Cross-branch denied");

    await order.update({
      approval_status: "approved",
      approved_at: new Date(),
      approved_by: manager.id,
      status: "confirmed",
    });

    return order;
  },

  /** -----------------------------------------------------
   * REJECT — Sale Manager
   * ---------------------------------------------------- */
  async reject(id: number, manager: any, reason: string) {
    const order = await SaleOrder.findByPk(id);

    if (!order) throw new Error("Order not found");
    if (order.approval_status !== "waiting_approval") throw new Error("Invalid stage");

    if (order.branch_id !== manager.branch_id) throw new Error("Cross-branch denied");

    await order.update({
      approval_status: "rejected",
      reject_reason: reason,
      approved_by: manager.id,
      status: "draft",
    });

    return order;
  },
};


