import { PurchaseOrder } from "../models/purchaseOrder.model";
import { PurchaseOrderLine } from "../models/purchaseOrderLine.model";
import { PurchaseOrderUpdateDto } from "../dto/purchaseOrderUpdate.dto";

export const purchaseOrderService = {
  async getAllPO() {
    return await PurchaseOrder.findAll({
      include: [{ model: PurchaseOrderLine, as: "lines" }],
      order: [["id", "DESC"]],
    });
  },

  async getByStatus(status: string) {
    return PurchaseOrder.findAll({
      include: [{ model: PurchaseOrderLine, as: "lines" }],
      where: { status },
    });
  },

  async getPOById(id: number) {
    const po = await PurchaseOrder.findByPk(id, {
      include: [{ model: PurchaseOrderLine, as: "lines" }],
    });

    if (!po) throw new Error("Purchase order not found");
    return po;
  },

  async create(data: any) {
    const po = await PurchaseOrder.create({
      branch_id: data.branch_id,
      po_no: data.po_no,
      supplier_id: data.supplier_id,
      order_date: data.order_date,
      total_before_tax: data.total_before_tax,
      total_tax: data.total_tax,
      total_after_tax: data.total_after_tax,
      status: "draft",
      description: data.description,
    });

    for (const line of data.lines) {
      await PurchaseOrderLine.create({
        ...line,
        po_id: po.id,
      });
    }

    return this.getPOById(po.id);
  },

  async update(id: number, data: PurchaseOrderUpdateDto) {
    const po = await PurchaseOrder.findByPk(id, {
      include: [{ model: PurchaseOrderLine, as: "lines" }],
    });

    if (!po) throw new Error("Purchase order not found");
    if (po.status !== "draft") {
      throw new Error("Only draft purchase orders can be updated");
    }

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

  async delete(id: number) {
    const po = await PurchaseOrder.findByPk(id);
    if (!po) throw new Error("Purchase order not found");
    if (po.status !== "draft") {
      throw new Error("Only purchase orders in 'draft' status can be updated");
    }
    await po.destroy();
    return { success: true };
  },
};
