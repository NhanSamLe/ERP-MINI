import { Op } from "sequelize";
import {
  ArCreditNote,
  ArCreditNoteLine,
  ArInvoice,
  ArRefund,
  Currency,
  Partner,
  Product,
  SaleOrder,
  SaleOrderLine,
  StockBalance,
  SalesReturn,
  SalesReturnAuthorization,
  SalesReturnLine,
  StockMove,
  TaxRate,
  User,
  Warehouse,
  sequelize,
} from "../../../models";
import { GlJournal } from "../../finance/models/glJournal.model";
import { GlEntry } from "../../finance/models/glEntry.model";
import { GlEntryLine } from "../../finance/models/glEntryLine.model";
import { requireGlAccounts } from "../../finance/services/glAccount.helper";
import { getCompanyIdFromBranch, getCompanyBranchIds } from "../../finance/services/companyScope.service";
import {
  generateCreditNoteNo,
  generateRefundNo,
  generateReturnNo,
  generateRmaNo,
} from "../utils";
import { Role } from "../../../core/types/enum";

async function withBranchContext(user: any) {
  if (user.role === "CEO" || user.role === "ADMIN") return user;
  if (user?.branch_id) return user;
  const dbUser = await User.findByPk(user.id, { attributes: ["id", "branch_id"] });
  const branchId = (dbUser as any)?.branch_id;
  if (!branchId) throw new Error("User branch is missing. Please login again.");
  return { ...user, branch_id: branchId };
}

const RETURN_INCLUDE = [
  { model: SalesReturnLine, as: "lines", include: [{ model: Product, as: "product", attributes: ["id", "sku", "name"] }] },
  { model: SalesReturnAuthorization, as: "rma" },
  { model: Partner, as: "customer", attributes: ["id", "name", "email", "phone"] },
  { model: Warehouse, as: "warehouse", attributes: ["id", "name", "code"] },
  { model: SaleOrder, as: "saleOrder", attributes: ["id", "order_no", "delivery_status", "invoice_status"] },
  { model: StockMove, as: "stockMove" },
];

const RMA_INCLUDE = [
  { model: SaleOrder, as: "saleOrder", attributes: ["id", "order_no", "status", "approval_status", "delivery_status", "invoice_status", "total_after_tax"] },
  { model: ArInvoice, as: "invoice", attributes: ["id", "invoice_no", "status", "total_after_tax"] },
  { model: Partner, as: "customer", attributes: ["id", "name", "email", "phone"] },
  { model: User, as: "creator", attributes: ["id", "username", "full_name"] },
  { model: User, as: "approver", attributes: ["id", "username", "full_name"] },
];

function requireManager(user: any) {
  if (user.role === Role.ADMIN) return;
  if (![Role.SALESMANAGER, Role.BRANCH_MANAGER].includes(user.role)) {
    throw new Error("Only sales manager or branch manager can approve return requests");
  }
}

function requireAccountant(user: any) {
  if (user.role === Role.ADMIN) return;
  if (user.role !== Role.ACCOUNT) {
    throw new Error("Only accountant can create refunds");
  }
}

function requireCreditNoteCreator(user: any) {
  if (user.role === Role.ADMIN) return;
  if (![Role.ACCOUNT, Role.CHACC].includes(user.role)) {
    throw new Error("Only accountant or chief accountant can create credit notes");
  }
}

function requireWarehouse(user: any) {
  if (user.role === Role.ADMIN) return;
  if (![Role.WHSTAFF, Role.WHMANAGER].includes(user.role)) {
    throw new Error("Only warehouse staff or warehouse manager can receive and inspect returned goods");
  }
}

function requireChiefAccountant(user: any) {
  if (user.role === Role.ADMIN) return;
  if (user.role !== Role.CHACC) {
    throw new Error("Only chief accountant can approve/post credit notes or refunds");
  }
}

async function getOrderForReturn(orderId: number, user: any) {
  const order = await SaleOrder.findByPk(orderId, {
    include: [{ model: SaleOrderLine, as: "lines" }],
  });
  if (!order) throw new Error("Sale order not found");
  if (user.role !== "CEO" && user.role !== "ADMIN") {
    if (order.branch_id !== user.branch_id) throw new Error("Cross-branch return is not allowed");
  }
  if (user.role === Role.SALES && order.created_by !== user.id) {
    throw new Error("Sales can only create return requests for their own sale orders");
  }
  if (order.approval_status !== "approved") throw new Error("Only approved sale orders can be returned");
  if (!["confirmed", "shipped", "completed"].includes(order.status)) {
    throw new Error("Sale order is not eligible for return");
  }
  return order as any;
}

async function getReturnedQtyByProduct(orderId: number) {
  const returns = await SalesReturn.findAll({
    where: { sale_order_id: orderId, status: { [Op.ne]: "cancelled" } },
    include: [{ model: SalesReturnLine, as: "lines" }],
  });
  const qty = new Map<number, number>();
  for (const ret of returns as any[]) {
    for (const line of ret.lines ?? []) {
      qty.set(line.product_id, (qty.get(line.product_id) ?? 0) + Number(line.quantity_returned || 0));
    }
  }
  return qty;
}

async function buildReturnLines(order: any, inputLines: any[]) {
  if (!Array.isArray(inputLines) || inputLines.length === 0) {
    throw new Error("Return lines are required");
  }

  const returnedByProduct = await getReturnedQtyByProduct(order.id);
  const orderLines = new Map<number, any>();
  for (const line of order.lines ?? []) {
    orderLines.set(line.product_id, line);
  }

  return inputLines.map((line) => {
    const orderLine = orderLines.get(Number(line.product_id));
    if (!orderLine) throw new Error("Returned product does not belong to the sale order");

    const quantityReturned = Number(line.quantity_returned || 0);
    const quantityReceived = Number(line.quantity_received ?? quantityReturned);
    const quantityRejected = Number(line.quantity_rejected || 0);
    if (quantityReturned <= 0) throw new Error("Returned quantity must be greater than 0");
    if (quantityReceived < 0 || quantityRejected < 0) throw new Error("Received/rejected quantity cannot be negative");
    if (Math.abs(quantityReceived + quantityRejected - quantityReturned) > 0.0001) {
      throw new Error("Received plus rejected quantity must equal returned quantity");
    }

    const alreadyReturned = returnedByProduct.get(Number(line.product_id)) ?? 0;
    const orderedQty = Number(orderLine.quantity || 0);
    if (alreadyReturned + quantityReturned > orderedQty + 0.0001) {
      throw new Error("Cannot return more than the ordered quantity");
    }

    const unitPrice = Number(line.unit_price ?? orderLine.unit_price ?? 0);
    return {
      product_id: Number(line.product_id),
      quantity_returned: quantityReturned,
      quantity_received: quantityReceived,
      quantity_rejected: quantityRejected,
      unit_price: unitPrice,
      line_total: quantityReturned * unitPrice,
      reason: line.reason || null,
      condition: line.condition || "good",
      tax_rate_id: orderLine.tax_rate_id ?? null,
    };
  });
}

async function increaseReturnStock(ret: any, transaction: any) {
  if (!ret.warehouse_id) {
    throw new Error("Return warehouse is required before completing returned goods receipt");
  }

  for (const line of ret.lines ?? []) {
    const quantityAccepted = Number(line.quantity_received || 0);
    if (quantityAccepted <= 0) continue;

    const where: any = {
      warehouse_id: ret.warehouse_id,
      product_id: line.product_id,
      location_id: null,
      lot_id: null,
    };

    const balance = await StockBalance.findOne({
      where,
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (balance) {
      const oldQty = Number(balance.quantity || 0);
      const unitCost = Number(balance.unit_cost || line.unit_price || 0);
      const newQty = oldQty + quantityAccepted;
      await balance.update(
        {
          quantity: newQty,
          unit_cost: unitCost,
          total_value: newQty * unitCost,
        },
        { transaction },
      );
    } else {
      await StockBalance.create(
        {
          warehouse_id: ret.warehouse_id,
          product_id: line.product_id,
          location_id: null,
          lot_id: null,
          quantity: quantityAccepted,
          unit_cost: Number(line.unit_price || 0),
          total_value: quantityAccepted * Number(line.unit_price || 0),
        },
        { transaction },
      );
    }
  }
}

async function resolveReturnDeliveryStatus(
  saleOrderId: number,
  fallbackStatus: any,
  transaction: any,
): Promise<"pending" | "partial" | "delivered" | "partially_returned" | "returned"> {
  const order = await SaleOrder.findByPk(saleOrderId, {
    include: [{ model: SaleOrderLine, as: "lines" }],
    transaction,
  }) as any;
  if (!order) return fallbackStatus || "delivered";

  const orderedByProduct = new Map<number, number>();
  for (const line of order.lines ?? []) {
    const productId = Number(line.product_id || 0);
    if (!productId) continue;
    orderedByProduct.set(productId, (orderedByProduct.get(productId) ?? 0) + Number(line.quantity || 0));
  }
  if (orderedByProduct.size === 0) return fallbackStatus || "delivered";

  const completedReturns = await SalesReturn.findAll({
    where: { sale_order_id: saleOrderId, status: "completed" },
    include: [{ model: SalesReturnLine, as: "lines" }],
    transaction,
  }) as any[];

  const receivedByProduct = new Map<number, number>();
  for (const ret of completedReturns) {
    for (const line of ret.lines ?? []) {
      const productId = Number(line.product_id || 0);
      if (!productId) continue;
      receivedByProduct.set(productId, (receivedByProduct.get(productId) ?? 0) + Number(line.quantity_received || 0));
    }
  }

  const totalReceived = Array.from(receivedByProduct.values()).reduce((sum, qty) => sum + qty, 0);
  if (totalReceived <= 0) return fallbackStatus || "delivered";

  const fullyReturned = Array.from(orderedByProduct.entries()).every(
    ([productId, orderedQty]) => (receivedByProduct.get(productId) ?? 0) >= orderedQty - 0.0001,
  );
  return fullyReturned ? "returned" : "partially_returned";
}

export const salesReturnService = {
  async getRmas(user: any) {
    user = await withBranchContext(user);
    const companyBranchIds = await getCompanyBranchIds(user);
    const where: any = {};
    if (user.role === Role.CEO || user.role === Role.ADMIN) {
      where.branch_id = { [Op.in]: companyBranchIds };
    } else {
      where.branch_id = user.branch_id;
      if (user.role === Role.SALES) where.created_by = user.id;
    }
    return SalesReturnAuthorization.findAll({
      where,
      include: RMA_INCLUDE,
      order: [["id", "DESC"]],
    });
  },

  async getRma(id: number, user: any) {
    user = await withBranchContext(user);
    const rma = await SalesReturnAuthorization.findByPk(id, { include: RMA_INCLUDE });
    if (!rma) throw new Error("Return request not found");
    const companyBranchIds = await getCompanyBranchIds(user);
    if (!companyBranchIds.includes(Number(rma.branch_id))) {
      throw new Error("Access denied (cross-company)");
    }
    if (user.role !== Role.CEO && user.role !== Role.ADMIN) {
      if (rma.branch_id !== user.branch_id) throw new Error("Cross-branch access denied");
    }
    if (user.role === Role.SALES && rma.created_by !== user.id) {
      throw new Error("Sales can only access return requests they created");
    }
    return rma;
  },

  async createRma(data: any, user: any) {
    user = await withBranchContext(user);
    const order = await getOrderForReturn(Number(data.sale_order_id), user);
    const rmaId = await sequelize.transaction(async (t) => {
      const rma = await SalesReturnAuthorization.create(
        {
          branch_id: order.branch_id,
          rma_no: await generateRmaNo(),
          sale_order_id: order.id,
          invoice_id: data.invoice_id || null,
          customer_id: order.customer_id,
          reason: data.reason,
          return_type: data.return_type || "credit_note",
          status: "draft",
          approval_status: "draft",
          total_return_amount: 0,
          created_by: user.id,
          approved_by: null,
          submitted_at: null,
          approved_at: null,
          reject_reason: null,
          notes: data.notes || null,
        } as any,
        { transaction: t },
      );
      return rma.id;
    });
    return this.getRma(rmaId, user);
  },

  async submitRma(id: number, user: any) {
    const rma = await this.getRma(id, user);
    if (rma.status !== "draft") throw new Error("Only draft return requests can be submitted");
    await rma.update({ status: "submitted", approval_status: "waiting_approval", submitted_at: new Date() });
    return this.getRma(id, user);
  },

  async approveRma(id: number, user: any) {
    requireManager(user);
    const rma = await this.getRma(id, user);
    if (rma.approval_status !== "waiting_approval") throw new Error("Return request is not waiting for approval");
    await rma.update({
      status: "approved",
      approval_status: "approved",
      approved_by: user.id,
      approved_at: new Date(),
      reject_reason: null,
    });
    return this.getRma(id, user);
  },

  async rejectRma(id: number, reason: string, user: any) {
    requireManager(user);
    if (!reason) throw new Error("Reject reason is required");
    const rma = await this.getRma(id, user);
    if (rma.approval_status !== "waiting_approval") throw new Error("Return request is not waiting for approval");
    await rma.update({
      status: "rejected",
      approval_status: "rejected",
      approved_by: user.id,
      approved_at: new Date(),
      reject_reason: reason,
    });
    return this.getRma(id, user);
  },

  async getReturns(user: any) {
    user = await withBranchContext(user);
    const companyBranchIds = await getCompanyBranchIds(user);
    const where: any = {};
    if (user.role === Role.CEO || user.role === Role.ADMIN) {
      where.branch_id = { [Op.in]: companyBranchIds };
    } else {
      where.branch_id = user.branch_id;
      if (user.role === Role.SALES) {
        const orders = await SaleOrder.findAll({
          where: { branch_id: user.branch_id, created_by: user.id },
          attributes: ["id"],
        });
        where.sale_order_id = { [Op.in]: orders.map((order: any) => order.id) };
      }
    }
    return SalesReturn.findAll({
      where,
      include: RETURN_INCLUDE,
      order: [["id", "DESC"]],
    });
  },

  async getReturn(id: number, user: any) {
    user = await withBranchContext(user);
    const ret = await SalesReturn.findByPk(id, { include: RETURN_INCLUDE });
    if (!ret) throw new Error("Sales return not found");
    const companyBranchIds = await getCompanyBranchIds(user);
    if (!companyBranchIds.includes(Number(ret.branch_id))) {
      throw new Error("Access denied (cross-company)");
    }
    if (user.role !== Role.CEO && user.role !== Role.ADMIN) {
      if (ret.branch_id !== user.branch_id) throw new Error("Cross-branch access denied");
    }
    if (user.role === Role.SALES) {
      const order = await SaleOrder.findByPk(ret.sale_order_id || undefined, { attributes: ["id", "created_by"] });
      if (!order || (order as any).created_by !== user.id) {
        throw new Error("Sales can only access returns for their own sale orders");
      }
    }
    return ret;
  },

  async getReturnByRmaId(rmaId: number, user: any) {
    user = await withBranchContext(user);
    const companyBranchIds = await getCompanyBranchIds(user);
    const where: any = { rma_id: rmaId };
    if (user.role === Role.CEO || user.role === Role.ADMIN) {
      where.branch_id = { [Op.in]: companyBranchIds };
    } else {
      where.branch_id = user.branch_id;
    }
    const ret = await SalesReturn.findOne({
      where,
      include: RETURN_INCLUDE,
      order: [["id", "DESC"]],
    });
    return ret || null;
  },

  async createReturnFromRma(rmaId: number, data: any, user: any) {
    requireWarehouse(user);
    const rma = await this.getRma(rmaId, user);
    if (rma.approval_status !== "approved") throw new Error("Return request must be approved first");
    if (!data.warehouse_id) throw new Error("Return warehouse is required");
    const warehouse = await Warehouse.findByPk(Number(data.warehouse_id));
    if (!warehouse) throw new Error("Return warehouse not found");
    if (Number((warehouse as any).branch_id) !== Number(rma.branch_id)) {
      throw new Error("Return warehouse must belong to the same branch as the RMA");
    }
    const order = await getOrderForReturn(rma.sale_order_id, user);
    const lines = await buildReturnLines(order, data.lines);
    const total = lines.reduce((sum, line) => sum + line.line_total, 0);

    const returnId = await sequelize.transaction(async (t) => {
      const ret = await SalesReturn.create(
        {
          branch_id: rma.branch_id,
          return_no: await generateReturnNo(),
          rma_id: rma.id,
          sale_order_id: rma.sale_order_id,
          customer_id: rma.customer_id,
          return_date: data.return_date || new Date().toISOString().slice(0, 10),
          warehouse_id: Number(data.warehouse_id),
          status: "received",
          approval_status: "approved",
          total_return_amount: total,
          created_by: user.id,
          approved_by: user.id,
          submitted_at: new Date(),
          approved_at: new Date(),
          notes: data.notes || null,
        } as any,
        { transaction: t },
      );

      await SalesReturnLine.bulkCreate(
        lines.map((line) => ({
          return_id: ret.id,
          product_id: line.product_id,
          quantity_returned: line.quantity_returned,
          quantity_received: line.quantity_received,
          quantity_rejected: line.quantity_rejected,
          unit_price: line.unit_price,
          line_total: line.line_total,
          reason: line.reason,
          condition: line.condition,
        })),
        { transaction: t },
      );

      const { StockMove } = await import("../../inventory/models/stockMove.model");
      const { StockMoveLine } = await import("../../inventory/models/stockMoveLine.model");

      const move = await StockMove.create({
        move_no: `SM-SR-${ret.id}-${Date.now()}`,
        move_date: new Date(),
        type: "receipt",
        warehouse_to_id: Number(data.warehouse_id),
        reference_type: "sales_return",
        reference_id: ret.id,
        status: "draft",
        created_by: user.id,
        branch_id: rma.branch_id,
      }, { transaction: t });

      for (const line of lines) {
        await StockMoveLine.create({
          move_id: move.id,
          product_id: line.product_id,
          quantity: line.quantity_received,
          uom_id: null,
          lot_id: null,
        }, { transaction: t });
      }

      await ret.update({ stock_move_id: move.id }, { transaction: t });

      await rma.update({ status: "processing", total_return_amount: total }, { transaction: t });
      return ret.id;
    });
    return this.getReturn(returnId, user);
  },

  async inspectReturn(id: number, data: any, user: any) {
    requireWarehouse(user);
    const ret = await this.getReturn(id, user);
    if (!["received", "inspected"].includes(ret.status)) throw new Error("Only received returns can be inspected");
    const lines = data.lines ?? [];

    await sequelize.transaction(async (t) => {
      for (const line of lines) {
        const row = await SalesReturnLine.findOne({ where: { id: line.id, return_id: id }, transaction: t });
        if (!row) throw new Error("Return line not found");
        const quantityReceived = Number(line.quantity_received ?? row.quantity_received);
        const quantityRejected = Number(line.quantity_rejected ?? row.quantity_rejected);
        if (Math.abs(quantityReceived + quantityRejected - Number(row.quantity_returned)) > 0.0001) {
          throw new Error("Received plus rejected quantity must equal returned quantity");
        }
        await row.update(
          {
            quantity_received: quantityReceived,
            quantity_rejected: quantityRejected,
            condition: line.condition ?? row.condition,
            reason: line.reason ?? row.reason,
          },
          { transaction: t },
        );
        if (ret.stock_move_id) {
          const { StockMoveLine } = await import("../../inventory/models/stockMoveLine.model");
          const moveLine = await StockMoveLine.findOne({
            where: { move_id: ret.stock_move_id, product_id: row.product_id },
            transaction: t,
          });
          if (moveLine) {
            await moveLine.update({ quantity: quantityReceived }, { transaction: t });
          }
        }
      }
      await ret.update({ status: "inspected" }, { transaction: t });
    });
    return this.getReturn(id, user);
  },

  async completeReturn(id: number, user: any) {
    requireWarehouse(user);
    const ret = await this.getReturn(id, user);
    if (ret.status !== "inspected") throw new Error("Return must be inspected before completion");
    await sequelize.transaction(async (t) => {
      const lockedReturn = await SalesReturn.findByPk(id, {
        include: [{ model: SalesReturnLine, as: "lines" }],
        lock: t.LOCK.UPDATE,
        transaction: t,
      }) as any;
      if (!lockedReturn) throw new Error("Sales return not found");
      if (lockedReturn.status !== "inspected") throw new Error("Return must be inspected before completion");

      if (lockedReturn.stock_move_id) {
        const { StockMove } = await import("../../inventory/models/stockMove.model");
        const move = await StockMove.findByPk(lockedReturn.stock_move_id, { transaction: t });
        if (!move || move.status !== "posted") {
          throw new Error("Warehouse manager has not approved the stock receipt yet. Please have them approve the stock move first.");
        }
      }
      await lockedReturn.update({ status: "completed" }, { transaction: t });
      if (lockedReturn.sale_order_id) {
        const order = await SaleOrder.findByPk(lockedReturn.sale_order_id, {
          attributes: ["id", "delivery_status"],
          transaction: t,
        }) as any;
        const nextDeliveryStatus = await resolveReturnDeliveryStatus(
          lockedReturn.sale_order_id,
          order?.delivery_status || "delivered",
          t,
        );
        await SaleOrder.update(
          { delivery_status: nextDeliveryStatus },
          { where: { id: lockedReturn.sale_order_id }, transaction: t },
        );
      }
      if (lockedReturn.rma_id) {
        await SalesReturnAuthorization.update(
          { status: "completed" },
          { where: { id: lockedReturn.rma_id }, transaction: t },
        );
      }
    });
    return this.getReturn(id, user);
  },

  async createCreditNoteFromReturn(returnId: number, user: any) {
    requireCreditNoteCreator(user);
    const ret = await this.getReturn(returnId, user);
    if (ret.status !== "completed") throw new Error("Return must be completed before creating credit note");
    const existed = await ArCreditNote.findOne({ where: { sales_return_id: returnId } });
    if (existed) return this.getCreditNote(existed.id, user);

    const order = await SaleOrder.findByPk(ret.sale_order_id || undefined, {
      include: [{ model: SaleOrderLine, as: "lines" }],
    }) as any;
    const orderLineByProduct = new Map<number, any>((order?.lines ?? []).map((line: any) => [line.product_id, line]));
    const returnLines = await SalesReturnLine.findAll({ where: { return_id: returnId } });

    let totalBeforeTax = 0;
    let totalTax = 0;
    const creditLines: any[] = [];
    for (const line of returnLines as any[]) {
      const orderLine = orderLineByProduct.get(line.product_id);
      const taxRate = orderLine?.tax_rate_id ? await TaxRate.findByPk(orderLine.tax_rate_id) : null;
      const lineTotal = Number(line.line_total || 0);
      const lineTax = lineTotal * (Number((taxRate as any)?.rate || 0) / 100);
      totalBeforeTax += lineTotal;
      totalTax += lineTax;
      creditLines.push({
        product_id: line.product_id,
        description: line.reason || "Sales return credit",
        quantity: line.quantity_received || line.quantity_returned,
        unit_price: line.unit_price,
        tax_rate_id: orderLine?.tax_rate_id ?? null,
        line_total: lineTotal,
        line_tax: lineTax,
        line_total_after_tax: lineTotal + lineTax,
      });
    }

    const creditId = await sequelize.transaction(async (t) => {
      const credit = await ArCreditNote.create(
        {
          branch_id: ret.branch_id,
          credit_note_no: await generateCreditNoteNo(),
          sales_return_id: ret.id,
          original_invoice_id: (ret as any).rma?.invoice_id || null,
          customer_id: ret.customer_id,
          credit_note_date: new Date().toISOString().slice(0, 10),
          status: "draft",
          approval_status: "draft",
          total_before_tax: totalBeforeTax,
          total_tax: totalTax,
          total_after_tax: totalBeforeTax + totalTax,
          currency_id: order?.currency_id || null,
          exchange_rate: order?.exchange_rate || 1,
          created_by: user.id,
          approved_by: null,
          notes: "Created from sales return",
        } as any,
        { transaction: t },
      );

      await ArCreditNoteLine.bulkCreate(
        creditLines.map((line) => ({ ...line, credit_note_id: credit.id })),
        { transaction: t },
      );
      return credit.id;
    });
    return this.getCreditNote(creditId, user);
  },

  async getCreditNotes(user: any) {
    user = await withBranchContext(user);
    const companyBranchIds = await getCompanyBranchIds(user);
    const where: any = {};
    if (user.role === Role.CEO || user.role === Role.ADMIN) {
      where.branch_id = { [Op.in]: companyBranchIds };
    } else {
      where.branch_id = user.branch_id;
    }
    return ArCreditNote.findAll({
      where,
      include: [
        { model: ArCreditNoteLine, as: "lines", include: [{ model: Product, as: "product", attributes: ["id", "sku", "name"] }] },
        { model: Partner, as: "customer", attributes: ["id", "name", "email", "phone"] },
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol"] },
      ],
      order: [["id", "DESC"]],
    });
  },

  async getCreditNote(id: number, user: any) {
    user = await withBranchContext(user);
    const note = await ArCreditNote.findByPk(id, {
      include: [
        { model: ArCreditNoteLine, as: "lines", include: [{ model: Product, as: "product", attributes: ["id", "sku", "name"] }] },
        { model: Partner, as: "customer", attributes: ["id", "name", "email", "phone"] },
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol"] },
      ],
    });
    if (!note) throw new Error("Credit note not found");
    const companyBranchIds = await getCompanyBranchIds(user);
    if (!companyBranchIds.includes(Number(note.branch_id))) {
      throw new Error("Access denied (cross-company)");
    }
    if (user.role !== Role.CEO && user.role !== Role.ADMIN) {
      if (note.branch_id !== user.branch_id) throw new Error("Cross-branch access denied");
    }
    return note;
  },

  async approveCreditNote(id: number, user: any) {
    requireChiefAccountant(user);

    const note = await this.getCreditNote(id, user);
    if (note.approval_status === "approved") return note;
    const companyId = await getCompanyIdFromBranch(note.branch_id);

    await sequelize.transaction(async (t) => {
      await note.update(
        { approval_status: "approved", status: "posted", approved_by: user.id },
        { transaction: t }
      );

      // GL Posting: Credit Note đảo ngược bút toán doanh thu
      // Nợ 511, Nợ 3331, Có 131 — lấy tài khoản theo company
      const salesJournal = await GlJournal.findOne({ where: { code: "SALES" }, transaction: t });
      if (!salesJournal) throw new Error("GL Journal 'SALES' not found");

      const accounts = await requireGlAccounts(companyId, ["131", "511", "3331"], t);
      const arAcc = accounts["131"]!;
      const revenueAcc = accounts["511"]!;
      const vatAcc = accounts["3331"]!;

      const rate = Number((note as any).exchange_rate || 1);
      const totalBeforeTax = Number(note.total_before_tax || 0) * rate;
      const totalTax = Number(note.total_tax || 0) * rate;
      const totalAfterTax = Number(note.total_after_tax || 0) * rate;

      const entry = await GlEntry.create(
        {
          journal_id: salesJournal.id,
          entry_no: `CN-${(note as any).credit_note_no}`,
          entry_date: new Date(),
          reference_type: "AR_CREDIT_NOTE",
          reference_id: note.id,
          memo: `Credit Note ${(note as any).credit_note_no}`,
          status: "posted",
          branch_id: note.branch_id ?? null,
        } as any,
        { transaction: t }
      );

      await GlEntryLine.bulkCreate(
        [
          { entry_id: entry.id, account_id: revenueAcc.id, partner_id: note.customer_id ?? null, debit: totalBeforeTax, credit: 0 },
          { entry_id: entry.id, account_id: vatAcc.id, debit: totalTax, credit: 0 },
          { entry_id: entry.id, account_id: arAcc.id, partner_id: note.customer_id ?? null, debit: 0, credit: totalAfterTax },
        ] as any,
        { transaction: t }
      );
    });

    return this.getCreditNote(id, user);
  },

  async createRefundFromCreditNote(creditNoteId: number, data: any, user: any) {
    requireAccountant(user);
    const note = await this.getCreditNote(creditNoteId, user);
    if (note.approval_status !== "approved" || note.status !== "posted") {
      throw new Error("Credit note must be posted before refund");
    }
    const existingRefund = await ArRefund.findOne({
      where: {
        credit_note_id: creditNoteId,
        status: { [Op.in]: ["draft", "posted"] },
      },
      order: [["id", "DESC"]],
    });
    if (existingRefund) {
      throw new Error("This sales return already has a refund request or has already been refunded");
    }
    const amount = Number(data.amount || note.total_after_tax);
    if (amount <= 0) throw new Error("Refund amount must be greater than 0");
    if (amount > Number(note.total_after_tax) + 0.0001) {
      throw new Error("Refund amount exceeds available credit");
    }

    const refund = await ArRefund.create({
      branch_id: note.branch_id,
      refund_no: await generateRefundNo(),
      credit_note_id: note.id,
      customer_id: note.customer_id,
      refund_date: data.refund_date || new Date().toISOString().slice(0, 10),
      amount,
      currency_id: note.currency_id || null,
      exchange_rate: Number(note.exchange_rate || 1),
      method: data.method || "bank",
      bank_account_id: data.bank_account_id || null,
      status: "draft",
      approval_status: "draft",
      gl_entry_id: null,
      created_by: user.id,
      approved_by: null,
      notes: data.notes || null,
    } as any);
    return this.getRefund(refund.id, user);
  },

  async getRefund(id: number, user: any) {
    user = await withBranchContext(user);
    const refund = await ArRefund.findByPk(id, {
      include: [
        { model: ArCreditNote, as: "creditNote", attributes: ["id", "credit_note_no", "total_after_tax"] },
        { model: Partner, as: "customer", attributes: ["id", "name", "email", "phone"] },
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol"] },
      ],
    });
    if (!refund) throw new Error("Refund not found");
    const companyBranchIds = await getCompanyBranchIds(user);
    if (!companyBranchIds.includes(Number(refund.branch_id))) {
      throw new Error("Access denied (cross-company)");
    }
    if (user.role !== Role.CEO && user.role !== Role.ADMIN) {
      if (refund.branch_id !== user.branch_id) throw new Error("Cross-branch access denied");
    }
    return refund;
  },

  async getRefunds(user: any) {
    user = await withBranchContext(user);
    const companyBranchIds = await getCompanyBranchIds(user);
    const where: any = {};
    if (user.role === Role.CEO || user.role === Role.ADMIN) {
      where.branch_id = { [Op.in]: companyBranchIds };
    } else {
      where.branch_id = user.branch_id;
    }
    return ArRefund.findAll({
      where,
      include: [
        { model: ArCreditNote, as: "creditNote", attributes: ["id", "credit_note_no", "total_after_tax"] },
        { model: Partner, as: "customer", attributes: ["id", "name", "email", "phone"] },
        { model: Currency, as: "currency", attributes: ["id", "code", "symbol"] },
      ],
      order: [["id", "DESC"]],
    });
  },

  async approveRefund(id: number, user: any) {
    requireChiefAccountant(user);

    const refund = await this.getRefund(id, user);
    if (refund.status === "posted" && refund.approval_status === "approved") return refund;
    const companyId = await getCompanyIdFromBranch(refund.branch_id);

    await sequelize.transaction(async (t) => {
      await refund.update(
        { status: "posted", approval_status: "approved", approved_by: user.id },
        { transaction: t }
      );

      if (refund.credit_note_id) {
        await ArCreditNote.update(
          { status: "applied" },
          { where: { id: refund.credit_note_id }, transaction: t },
        );
      }

      // GL Posting: hoàn tiền KH — Nợ 131, Có 111/112 — lấy tài khoản theo company
      const journalCode = (refund as any).method === "cash" ? "CASH" : "BANK";
      const cashAccCode = (refund as any).method === "cash" ? "111" : "112";

      const journal = await GlJournal.findOne({ where: { code: journalCode }, transaction: t });
      if (!journal) throw new Error(`GL Journal '${journalCode}' not found`);

      const accounts = await requireGlAccounts(companyId, ["131", cashAccCode], t);
      const arAcc = accounts["131"]!;
      const cashAcc = accounts[cashAccCode]!;

      const rate = Number((refund as any).exchange_rate || 1);
      const amount = Number((refund as any).amount || 0) * rate;

      const entry = await GlEntry.create(
        {
          journal_id: journal.id,
          entry_no: `RF-${(refund as any).refund_no}`,
          entry_date: new Date(),
          reference_type: "AR_REFUND",
          reference_id: refund.id,
          memo: `AR Refund ${(refund as any).refund_no}`,
          status: "posted",
          branch_id: refund.branch_id ?? null,
        } as any,
        { transaction: t }
      );

      await GlEntryLine.bulkCreate(
        [
          { entry_id: entry.id, account_id: arAcc.id, partner_id: refund.customer_id ?? null, debit: amount, credit: 0 },
          { entry_id: entry.id, account_id: cashAcc.id, debit: 0, credit: amount },
        ] as any,
        { transaction: t }
      );

      await refund.update({ gl_entry_id: entry.id } as any, { transaction: t });
    });

    return this.getRefund(id, user);
  },
};
