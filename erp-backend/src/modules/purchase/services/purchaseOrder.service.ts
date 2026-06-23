import { PurchaseOrder } from "../models/purchaseOrder.model";
import { PurchaseOrderLine } from "../models/purchaseOrderLine.model";
import { PurchaseOrderUpdateDto } from "../dto/purchaseOrderUpdate.dto";
import { StockMoveLine } from "../../inventory/models/stockMoveLine.model";
import { StockMove } from "../../inventory/models/stockMove.model";
import { productService } from "../../product/services/product.service";
import { UomConversion } from "../../master-data/models/uomConversion.model";
import { JwtPayload } from "../../../core/types/jwt";
import {
  ApInvoice,
  ApInvoiceLine,
  Branch,
  Partner,
  Product,
  sequelize,
  TaxRate,
  User,
  Uom,
  PaymentTerm,
  Currency,
} from "../../../models";
import { Role } from "../../../core/types/enum";
import { literal, Op } from "sequelize";
import { notificationService } from "../../../core/services/notification.service";
import { validationService } from "./validationService";
import { auditService } from "./auditService";
import { generatePoNo } from "../utils/poNoGenerator";

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

  // Step 5: Fallback — no conversion found
  return quantity;
}

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

  /**
   * getAllPOWithFilters — hỗ trợ filter mở rộng:
   *   ?receipt_status=pending|partial|fully_received
   *   ?invoice_status=not_invoiced|partial|invoiced
   *   ?buyer_id=123
   *   ?overdue_delivery=true  (expected_delivery_date < today, receipt_status != fully_received)
   *   ?status=draft,confirmed,...
   *   ?supplier_id=5
   *   ?date_from / date_to
   */
  async getAllPOWithFilters(query: any, user: any) {
    const where: any = { branch_id: user.branch_id };

    if (user.role === Role.PURCHASE) where.created_by = user.id;

    if (query.status) {
      where.status = Array.isArray(query.status)
        ? { [Op.in]: query.status }
        : query.status.includes(",")
          ? { [Op.in]: query.status.split(",") }
          : query.status;
    }
    if (query.supplier_id) where.supplier_id = Number(query.supplier_id);
    if (query.buyer_id) where.buyer_id = Number(query.buyer_id);
    if (query.receipt_status) where.receipt_status = query.receipt_status;
    if (query.invoice_status) where.invoice_status = query.invoice_status;

    if (query.date_from || query.date_to) {
      where.order_date = {};
      if (query.date_from) where.order_date[Op.gte] = new Date(query.date_from);
      if (query.date_to) where.order_date[Op.lte] = new Date(query.date_to);
    }

    // overdue_delivery: expected_delivery_date < today AND not fully received
    if (query.overdue_delivery === "true") {
      where.expected_delivery_date = { [Op.lt]: new Date() };
      where.receipt_status = { [Op.notIn]: ["fully_received"] };
      where.status = { [Op.notIn]: ["cancelled", "draft"] };
    }

    return PurchaseOrder.findAll({
      where,
      include: [
        { model: PurchaseOrderLine, as: "lines" },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "full_name"],
        },
        {
          model: User,
          as: "buyer",
          attributes: ["id", "full_name"],
        },
      ],
      order: [["created_at", "DESC"]],
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
        {
          model: PurchaseOrderLine,
          as: "lines",
          include: [
            { model: Product, as: "product" },
            { model: Uom, as: "uom", attributes: ["id", "name"] },
          ],
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
        {
          model: PaymentTerm,
          as: "paymentTerm",
          attributes: ["id", "name", "days", "code"],
        },
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "symbol", "name"],
        },
      ],
    });

    if (!po) throw new Error("Không tìm thấy đơn mua hàng");
    return po;
  },

  async create(data: any, user: any) {
    const allowedRoles = ["PURCHASE"];
    if (!allowedRoles.includes(user.role)) {
      throw new Error("Bạn không có quyền tạo đơn mua hàng.");
    }

    if (data.branch_id !== user.branch_id) {
      throw new Error("Bạn không thể tạo đơn mua hàng cho chi nhánh khác.");
    }

    // Tự gen po_no nếu không được cung cấp (ví dụ: tạo từ AI chatbot)
    if (!data.po_no || data.po_no.trim() === "") {
      data.po_no = generatePoNo();
    }

    // Tự set order_date nếu không có
    if (!data.order_date) {
      data.order_date = new Date();
    }

    // Validate input
    await validationService.validatePO(data);

    const poId = await sequelize.transaction(async (t) => {
      // 1. Calculate each line's initial values (before header discount)
      const calculatedLines = [];
      let totalBeforeHeaderDiscount = 0;

      for (const line of data.lines) {
        if (!line.tax_rate_id) {
          const productForTax = await productService.getById(line.product_id);
          if ((productForTax as any)?.tax_rate_id) {
            line.tax_rate_id = (productForTax as any).tax_rate_id;
          }
        }
        const calc = await this.calculateLine(line);
        calculatedLines.push({
          line,
          calc,
        });
        totalBeforeHeaderDiscount += calc.line_total;
      }

      // 2. Determine Header Discount Amount
      let headerDiscountAmount = 0;
      let headerDiscountPercent = 0;

      if (data.discount_type === "fixed") {
        headerDiscountAmount = Number(data.discount_amount || 0);
        headerDiscountPercent = totalBeforeHeaderDiscount > 0
          ? (headerDiscountAmount / totalBeforeHeaderDiscount) * 100
          : 0;
      } else {
        headerDiscountPercent = Number(data.discount_percent || 0);
        headerDiscountAmount = totalBeforeHeaderDiscount * (headerDiscountPercent / 100);
      }

      const po = await PurchaseOrder.create(
        {
          branch_id: data.branch_id,
          po_no: data.po_no,
          supplier_id: data.supplier_id,
          payment_term_id: data.payment_term_id || null,
          currency_id: data.currency_id || null,
          exchange_rate: data.exchange_rate || 1.0,
          order_date: data.order_date,
          created_by: user.id,
          status: "draft",
          description: data.description,
          discount_percent: headerDiscountPercent,
          discount_amount: headerDiscountAmount,
        },
        { transaction: t },
      );

      let totalBeforeTax = 0;
      let totalTax = 0;
      let totalAfterTax = 0;

      for (const item of calculatedLines) {
        const line = item.line;
        const calc = item.calc;

        // Pro-rata distribution of header discount
        const weight = totalBeforeHeaderDiscount > 0 ? (calc.line_total / totalBeforeHeaderDiscount) : 0;
        const distributedDiscount = headerDiscountAmount * weight;

        const netLineTotal = calc.line_total - distributedDiscount;
        const taxRate = line.tax_rate_id ? await TaxRate.findByPk(line.tax_rate_id) : null;
        const rate = taxRate ? Number(taxRate.rate) : 0;
        const lineTax = (netLineTotal * rate) / 100;
        const lineTotalAfterTax = netLineTotal + lineTax;

        totalBeforeTax += netLineTotal;
        totalTax += lineTax;
        totalAfterTax += lineTotalAfterTax;

        const product = await productService.getById(line.product_id);
        const productStockUomId = product?.uom_id ?? null;
        const qty_in_stock_uom = await resolveQtyInStockUom(
          line.quantity,
          line.uom_id ?? null,
          productStockUomId,
          line.product_id,
        );

        await PurchaseOrderLine.create(
          {
            po_id: po.id,
            product_id: line.product_id,
            quantity: line.quantity,
            ...(line.uom_id != null && { uom_id: line.uom_id }),
            qty_in_stock_uom,
            unit_price: line.unit_price,
            discount_percent: calc.discount_percent ?? 0,
            discount_amount: calc.discount_amount,
            ...(line.tax_rate_id != null && { tax_rate_id: line.tax_rate_id }),
            line_total: netLineTotal,
            line_tax: lineTax,
            line_total_after_tax: lineTotalAfterTax,
          },
          { transaction: t },
        );
      }

      await po.update(
        {
          total_before_tax: totalBeforeTax,
          total_tax: totalTax,
          total_after_tax: totalAfterTax,
        },
        { transaction: t },
      );

      return po.id; // ✅ chỉ return id
    });

    // 👉 transaction COMMIT xong mới query
    const po = await this.getPOById(poId);

    // Log creation
    await auditService.logCreate(po, user);

    return po;
  },

  async update(id: number, data: PurchaseOrderUpdateDto, user: any) {
    const allowedRoles = ["PURCHASE"];
    if (!allowedRoles.includes(user.role)) {
      throw new Error("Bạn không có quyền chỉnh sửa đơn mua hàng.");
    }

    if (data.branch_id !== user.branch_id) {
      throw new Error(
        "Bạn không thể chỉnh sửa đơn mua hàng của chi nhánh khác.",
      );
    }

    const po = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: PurchaseOrderLine,
          as: "lines",
          include: [
            { model: Product, as: "product" },
            { model: Uom, as: "uom", attributes: ["id", "name"] },
          ],
        },
      ],
    });

    if (!po) throw new Error("Không tìm thấy đơn mua hàng");
    if (po.status !== "draft") {
      throw {
        status: 400,
        message: "Không thể chỉnh sửa đơn mua hàng đã được phê duyệt",
      };
    }

    if (po.created_by !== user.id)
      throw new Error("Bạn chỉ có thể chỉnh sửa đơn mua hàng của mình");

    await sequelize.transaction(async (t) => {
      // 1. Calculate each line's initial values (before header discount)
      const calculatedLines = [];
      let totalBeforeHeaderDiscount = 0;

      if (data.lines?.length) {
        for (const line of data.lines) {
          const calc = await this.calculateLine(line);
          calculatedLines.push({
            line,
            calc,
          });
          totalBeforeHeaderDiscount += calc.line_total;
        }
      }

      // 2. Determine Header Discount Amount
      let headerDiscountAmount = 0;
      let headerDiscountPercent = 0;

      if (data.discount_type === "fixed") {
        headerDiscountAmount = Number(data.discount_amount || 0);
        headerDiscountPercent = totalBeforeHeaderDiscount > 0
          ? (headerDiscountAmount / totalBeforeHeaderDiscount) * 100
          : 0;
      } else {
        headerDiscountPercent = Number(data.discount_percent || 0);
        headerDiscountAmount = totalBeforeHeaderDiscount * (headerDiscountPercent / 100);
      }

      await po.update(
        {
          branch_id: data.branch_id,
          po_no: data.po_no,
          supplier_id: data.supplier_id,
          payment_term_id: data.payment_term_id || null,
          currency_id: data.currency_id || null,
          exchange_rate: data.exchange_rate || 1.0,
          order_date: new Date(data.order_date),
          description: data.description,
          discount_percent: headerDiscountPercent,
          discount_amount: headerDiscountAmount,
        },
        { transaction: t },
      );

      if (data.deletedLineIds?.length) {
        await PurchaseOrderLine.destroy({
          where: { id: data.deletedLineIds, po_id: id },
          transaction: t,
        });
      }

      let totalBeforeTax = 0;
      let totalTax = 0;
      let totalAfterTax = 0;

      for (const item of calculatedLines) {
        const line = item.line;
        const calc = item.calc;

        // Pro-rata distribution of header discount
        const weight = totalBeforeHeaderDiscount > 0 ? (calc.line_total / totalBeforeHeaderDiscount) : 0;
        const distributedDiscount = headerDiscountAmount * weight;

        const netLineTotal = calc.line_total - distributedDiscount;
        const taxRate = line.tax_rate_id ? await TaxRate.findByPk(line.tax_rate_id) : null;
        const rate = taxRate ? Number(taxRate.rate) : 0;
        const lineTax = (netLineTotal * rate) / 100;
        const lineTotalAfterTax = netLineTotal + lineTax;

        totalBeforeTax += netLineTotal;
        totalTax += lineTax;
        totalAfterTax += lineTotalAfterTax;

        const product = await productService.getById(line.product_id);
        const productStockUomId = product?.uom_id ?? null;
        const qty_in_stock_uom = await resolveQtyInStockUom(
          line.quantity,
          line.uom_id ?? null,
          productStockUomId,
          line.product_id,
        );

        if (line.id) {
          await PurchaseOrderLine.update(
            {
              product_id: line.product_id,
              quantity: line.quantity,
              ...(line.uom_id != null && { uom_id: line.uom_id }),
              qty_in_stock_uom,
              unit_price: line.unit_price,
              discount_percent: calc.discount_percent ?? 0,
              discount_amount: calc.discount_amount,
              ...(line.tax_rate_id != null && {
                tax_rate_id: line.tax_rate_id,
              }),
              line_total: netLineTotal,
              line_tax: lineTax,
              line_total_after_tax: lineTotalAfterTax,
            },
            { where: { id: line.id, po_id: id }, transaction: t },
          );
        } else {
          await PurchaseOrderLine.create(
            {
              po_id: id,
              product_id: line.product_id,
              quantity: line.quantity,
              ...(line.uom_id != null && { uom_id: line.uom_id }),
              qty_in_stock_uom,
              unit_price: line.unit_price,
              discount_percent: calc.discount_percent ?? 0,
              discount_amount: calc.discount_amount,
              ...(line.tax_rate_id != null && {
                tax_rate_id: line.tax_rate_id,
              }),
              line_total: netLineTotal,
              line_tax: lineTax,
              line_total_after_tax: lineTotalAfterTax,
            },
            { transaction: t },
          );
        }
      }

      await po.update(
        {
          total_before_tax: totalBeforeTax,
          total_tax: totalTax,
          total_after_tax: totalAfterTax,
        },
        { transaction: t },
      );
    });

    // ✅ query sau commit
    return this.getPOById(id);
  },

  async delete(id: number, user: any) {
    const po = await PurchaseOrder.findByPk(id);
    const allowedRoles = ["PURCHASE"];

    if (!allowedRoles.includes(user.role)) {
      throw new Error("Bạn không có quyền xóa đơn mua hàng.");
    }

    if (po?.branch_id !== user.branch_id) {
      throw new Error("Bạn không thể xóa đơn mua hàng của chi nhánh khác.");
    }

    if (!po) throw new Error("Không tìm thấy đơn mua hàng");
    if (po.status !== "draft") {
      throw new Error("Không thể xóa đơn mua hàng đã được phê duyệt");
    }
    if (po.created_by !== user.id)
      throw new Error("Bạn chỉ có thể xóa đơn mua hàng của mình");

    await po.destroy();
    return { success: true };
  },

  async approvalPO(id: number, user: any, app?: any) {
    const po = await this.getPOById(id);
    if (!po) throw new Error("Không tìm thấy đơn mua hàng");

    if (user.role !== Role.PURCHASEMANAGER) {
      throw new Error("Bạn không có quyền phê duyệt đơn mua hàng.");
    }
    if (po.branch_id !== user.branch_id) {
      throw new Error(
        "Bạn không thể phê duyệt đơn mua hàng của chi nhánh khác.",
      );
    }

    if (po.status !== "waiting_approval") {
      throw new Error("Chỉ có thể phê duyệt đơn mua hàng đang chờ duyệt.");
    }
    po.status = "confirmed";
    po.approved_by = user.id;
    po.approved_at = new Date();
    await po.save();

    // Log approval
    await auditService.logApprove(po, user);

    // Gửi thông báo
    if (app && po.created_by) {
      const io = app.get("io");
      await notificationService.createNotification({
        type: "APPROVE",
        referenceType: "PURCHASE_ORDER",
        referenceId: po.id!,
        referenceNo: po.po_no!,
        branchId: po.branch_id!,
        submitterId: po.created_by,
        approverName: user.fullName || user.username,
        io,
      });
    }

    return po;
  },

  async cancelPO(id: number, user: any, reason: string, app?: any) {
    const po = await this.getPOById(id);
    if (!po) throw new Error("Không tìm thấy đơn mua hàng");

    if (user.role !== Role.PURCHASEMANAGER) {
      throw new Error("Bạn không có quyền hủy đơn mua hàng.");
    }

    if (po.branch_id !== user.branch_id) {
      throw new Error("Bạn không thể hủy đơn mua hàng của chi nhánh khác.");
    }

    if (po.status !== "waiting_approval") {
      throw new Error("Chỉ có thể hủy đơn mua hàng đang chờ duyệt.");
    }

    if (!reason || reason.trim() === "") {
      throw new Error("Vui lòng nhập lý do hủy đơn mua hàng.");
    }

    po.status = "cancelled";
    po.approved_by = user.id;
    po.approved_at = new Date();
    po.reject_reason = reason.trim();
    await po.save();

    // Log cancellation
    await auditService.logCancel(po, reason, user);

    // Gửi thông báo (cancel = reject)
    if (app && po.created_by) {
      const io = app.get("io");
      await notificationService.createNotification({
        type: "REJECT",
        referenceType: "PURCHASE_ORDER",
        referenceId: po.id!,
        referenceNo: po.po_no!,
        branchId: po.branch_id!,
        submitterId: po.created_by,
        approverName: user.fullName || user.username,
        rejectReason: reason,
        io,
      });
    }

    return po;
  },

  async submitForApproval(id: number, user: any, app?: any) {
    const po = await this.getPOById(id);
    if (!po) throw new Error("Không tìm thấy đơn mua hàng");

    if (po.branch_id !== user.branch_id) {
      throw new Error(
        "Bạn không thể gửi duyệt đơn mua hàng của chi nhánh khác.",
      );
    }

    if (po.status !== "draft") {
      throw new Error("Chỉ có thể gửi duyệt đơn mua hàng ở trạng thái nháp.");
    }

    if (po.created_by !== user.id)
      throw new Error("Chỉ người tạo mới có thể gửi duyệt đơn mua hàng.");

    po.status = "waiting_approval";
    po.submitted_at = new Date();

    await po.save();

    // Gửi thông báo
    if (app) {
      const io = app.get("io");
      await notificationService.createNotification({
        type: "SUBMIT",
        referenceType: "PURCHASE_ORDER",
        referenceId: po.id!,
        referenceNo: po.po_no!,
        branchId: po.branch_id!,
        submitterId: user.id,
        submitterName: user.fullName || user.username,
        io,
      });
    }

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
        message: "The Purchase Order has no product lines.",
      };
    }

    return lines;
  },

  /** Lấy tổng số lượng đã nhập cho 1 sản phẩm từ các StockMove đã posted */
  async getAlreadyReceivedQty(
    poId: number,
    productId: number,
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
    productId: number,
  ) {
    const poLine = map.get(productId);
    if (!poLine) {
      const productResult = await productService.getById(productId);
      throw {
        status: 400,
        message: `Product ${productResult?.name} is not included in the Purchase Order.`,
      };
    }
    return poLine;
  },

  /**
   * Validate số lượng nhập kho không vượt quá số lượng còn lại trong PO.
   * inputQty và poQty đều phải theo STOCK UOM (đã quy đổi).
   */
  async validateRemainingQuantity(
    productId: number,
    inputQty: number,
    poQty: number,
    receivedQty: number,
  ) {
    // poQty ở đây là qty_in_stock_uom (đã quy đổi về stock UOM)
    const remaining = poQty - receivedQty;

    if (inputQty > remaining) {
      const productResult = await productService.getById(productId);
      throw {
        status: 400,
        message: `Product ${productResult?.name} exceeds the remaining quantity in the Purchase Order. Remaining: ${remaining}, entered: ${inputQty}`,
      };
    }
  },

  async getAvailablePurchaseOrders(user: any) {
    // Step 1: Fetch POs
    const pos = await PurchaseOrder.findAll({
      where: {
        branch_id: user.branch_id,
        status: {
          [Op.in]: ["confirmed", "partially_received", "completed"],
        },
      },
      include: [
        {
          // Include ALL invoices (no where filter here — filter in JS)
          model: ApInvoice,
          as: "invoices",
          required: false,
          attributes: ["id", "total_after_tax", "status"],
        },
        {
          model: PurchaseOrderLine,
          as: "lines",
          required: false,
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "email", "phone", "avatar_url"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "email", "full_name", "phone", "avatar_url"],
        },
        {
          model: Partner,
          as: "supplier",
          attributes: ["id", "email", "name", "phone"],
        },
        {
          model: PaymentTerm,
          as: "paymentTerm",
          required: false,
        },
        {
          model: Currency,
          as: "currency",
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Step 2: Calculate invoiced/remaining in JS — exclude cancelled invoices
    return pos.map((po: any) => {
      const allInvoices: any[] = po.invoices ?? [];
      const activeInvoices = allInvoices.filter(
        (inv: any) => inv.status !== "cancelled",
      );

      const invoicedAmount = activeInvoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.total_after_tax ?? 0),
        0,
      );
      const poTotal = Number(po.total_after_tax ?? 0);
      const remainingAmount = Math.max(0, poTotal - invoicedAmount);
      const invoiceCount = activeInvoices.length;

      return {
        ...po.toJSON(),
        invoiced_amount: invoicedAmount,
        remaining_amount: remainingAmount,
        invoice_count: invoiceCount,
      };
    });
  },

  /**
   * Get invoice summary for a specific PO — used when creating partial invoices.
   * Returns per-line invoiced quantities so frontend can show remaining qty.
   */
  async getPoInvoiceSummary(poId: number, user: any) {
    const po = await PurchaseOrder.findOne({
      where: { id: poId, branch_id: user.branch_id },
      include: [
        {
          model: PurchaseOrderLine,
          as: "lines",
          required: false,
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image_url"],
              required: false,
            },
          ],
        },
        {
          model: ApInvoice,
          as: "invoices",
          required: false,
          attributes: ["id", "total_after_tax", "status"],
          include: [
            {
              model: ApInvoiceLine,
              as: "lines",
              required: false,
            },
          ],
        },
      ],
    });

    if (!po) throw { status: 404, message: "Purchase Order not found" };

    const poLines = (po as any).lines ?? [];
    // Filter out cancelled invoices in JS
    const invoices = ((po as any).invoices ?? []).filter(
      (inv: any) => inv.status !== "cancelled",
    );

    // Sum invoiced qty per po_line_id across all non-cancelled invoices
    const invoicedQtyByPoLine: Record<number, number> = {};
    for (const inv of invoices) {
      for (const invLine of inv.lines ?? []) {
        if (invLine.po_line_id) {
          invoicedQtyByPoLine[invLine.po_line_id] =
            (invoicedQtyByPoLine[invLine.po_line_id] ?? 0) +
            Number(invLine.quantity ?? 0);
        }
      }
    }

    const linesSummary = poLines.map((line: any) => ({
      po_line_id: line.id,
      product_id: line.product_id,
      product_name: line.product?.name ?? null,
      product_image: line.product?.image_url ?? null,
      quantity: Number(line.quantity ?? 0),
      unit_price: Number(line.unit_price ?? 0),
      uom_id: line.uom_id,
      tax_rate_id: line.tax_rate_id,
      discount_percent: Number(line.discount_percent ?? 0),
      discount_amount: Number(line.discount_amount ?? 0),
      line_total: Number(line.line_total ?? 0),
      line_tax: Number(line.line_tax ?? 0),
      line_total_after_tax: Number(line.line_total_after_tax ?? 0),
      invoiced_qty: invoicedQtyByPoLine[line.id] ?? 0,
      remaining_qty:
        Number(line.quantity ?? 0) - (invoicedQtyByPoLine[line.id] ?? 0),
    }));

    const totalInvoiced = invoices.reduce(
      (sum: number, inv: any) => sum + Number(inv.total_after_tax ?? 0),
      0,
    );

    return {
      po_id: po.id,
      po_no: (po as any).po_no,
      total_after_tax: Number((po as any).total_after_tax ?? 0),
      invoiced_amount: totalInvoiced,
      remaining_amount: Math.max(
        0,
        Number((po as any).total_after_tax ?? 0) - totalInvoiced,
      ),
      invoice_count: invoices.length,
      lines: linesSummary,
    };
  },
  async calculateLine(line: any) {
    const taxRate = line.tax_rate_id
      ? await TaxRate.findByPk(line.tax_rate_id)
      : null;

    const rate = taxRate ? Number(taxRate.rate) : 0;
    const grossTotal = Number(line.quantity) * Number(line.unit_price);
    
    let discountAmount = 0;
    let discountPercent = 0;

    if (line.discount_type === "fixed") {
      discountAmount = Number(line.discount_amount || 0);
      discountPercent = grossTotal > 0 ? (discountAmount / grossTotal) * 100 : 0;
    } else {
      discountPercent = Number(line.discount_percent || 0);
      discountAmount = grossTotal * (discountPercent / 100);
    }

    const lineTotal = grossTotal - discountAmount;
    const lineTax = (lineTotal * rate) / 100;
    const lineTotalAfterTax = lineTotal + lineTax;

    return {
      line_total: lineTotal,
      line_tax: lineTax,
      line_total_after_tax: lineTotalAfterTax,
      discount_amount: discountAmount,
      discount_percent: discountPercent,
    };
  },

  // ─── RECEIPT / INVOICE STATUS TRACKING ────────────────────────────────────

  /**
   * Cập nhật receipt_status của PO dựa trên qty_received của tất cả lines.
   * Gọi sau khi GRN (stock move) được confirm và qty_received đã được cập nhật.
   */
  async updateReceiptStatus(poId: number): Promise<void> {
    const lines = await PurchaseOrderLine.findAll({ where: { po_id: poId } });
    if (!lines.length) return;

    const allReceived = lines.every(
      (l) => Number(l.qty_received ?? 0) >= Number(l.quantity ?? 0),
    );
    const anyReceived = lines.some((l) => Number(l.qty_received ?? 0) > 0);

    const receiptStatus = allReceived
      ? "fully_received"
      : anyReceived
        ? "partial"
        : "pending";

    await PurchaseOrder.update({ receipt_status: receiptStatus } as any, {
      where: { id: poId },
    });
  },

  /**
   * Cập nhật invoice_status của PO dựa trên qty_invoiced của tất cả lines.
   * Gọi sau khi AP Invoice line được link với PO line (po_line_id).
   */
  async updateInvoiceStatus(poId: number): Promise<void> {
    const lines = await PurchaseOrderLine.findAll({ where: { po_id: poId } });
    if (!lines.length) return;

    const allInvoiced = lines.every(
      (l) => Number(l.qty_invoiced ?? 0) >= Number(l.quantity ?? 0),
    );
    const anyInvoiced = lines.some((l) => Number(l.qty_invoiced ?? 0) > 0);

    const invoiceStatus = allInvoiced
      ? "invoiced"
      : anyInvoiced
        ? "partial"
        : "not_invoiced";

    await PurchaseOrder.update({ invoice_status: invoiceStatus } as any, {
      where: { id: poId },
    });
  },

  /**
   * Hook gọi khi GRN (stock move type=receipt) được confirm.
   * Cập nhật qty_received trên PO lines liên quan, sau đó cập nhật receipt_status.
   *
   * @param stockMoveId - ID của stock move vừa được confirm
   */
  async onGrnConfirmed(stockMoveId: number): Promise<void> {
    // Lấy stock move để biết po_id
    const move = await StockMove.findByPk(stockMoveId, {
      include: [{ model: StockMoveLine, as: "lines" }],
    });
    if (!move || move.reference_type !== "purchase_order" || !move.reference_id)
      return;

    const poId = move.reference_id;
    const moveLines: StockMoveLine[] = (move as any).lines ?? [];

    // Cập nhật qty_received cho từng PO line dựa trên product_id
    for (const moveLine of moveLines) {
      // Tìm PO line khớp product_id
      const poLine = await PurchaseOrderLine.findOne({
        where: { po_id: poId, product_id: moveLine.product_id },
      });
      if (!poLine) continue;

      const currentReceived = Number(poLine.qty_received ?? 0);
      const addedQty = Number(moveLine.quantity ?? 0);

      await poLine.update({ qty_received: currentReceived + addedQty } as any);
    }

    await this.updateReceiptStatus(poId);
  },

  /**
   * Hook gọi khi AP Invoice line được link với PO line.
   * Cập nhật qty_invoiced trên PO line, sau đó cập nhật invoice_status.
   *
   * @param poLineId - ID của PO line
   * @param qty      - Số lượng vừa được lập hóa đơn
   * @param delta    - +qty khi tạo invoice, -qty khi hủy invoice
   */
  async onApInvoiceLineLinked(
    poLineId: number,
    qty: number,
    delta: 1 | -1 = 1,
  ): Promise<void> {
    const poLine = await PurchaseOrderLine.findByPk(poLineId);
    if (!poLine) return;

    const currentInvoiced = Number(poLine.qty_invoiced ?? 0);
    const newInvoiced = Math.max(0, currentInvoiced + qty * delta);

    await poLine.update({ qty_invoiced: newInvoiced } as any);
    await this.updateInvoiceStatus(poLine.po_id);
  },
};
