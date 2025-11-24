import { PurchaseOrder } from "../models/purchaseOrder.model";
import { PurchaseOrderLine } from "../models/purchaseOrderLine.model";

export const purchaseOrderService = {
  async getAllPO() {
    return await PurchaseOrder.findAll({
      include: [{ model: PurchaseOrderLine, as: "lines" }],
      order: [["id", "DESC"]],
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
    });

    for (const line of data.lines) {
      await PurchaseOrderLine.create({
        ...line,
        po_id: po.id,
      });
    }

    return this.getPOById(po.id);
  },

  async update(id: number, data: any) {
    const po = await PurchaseOrder.findByPk(id);
    if (!po) throw new Error("Purchase order not found");
    if (po.status !== "draft") {
      throw new Error("Only purchase orders in 'draft' status can be updated");
    }
    await po.update(data);
    return this.getPOById(id);
  },
  async delete(id: number) {
    const po = await PurchaseOrder.findByPk(id);
    if (!po) throw new Error("Purchase order not found");
    if (po.status !== "draft") {
      throw new Error("Only purchase orders in 'draft' status can be updated");
    }
    await po.destroy();
    return this.getPOById(id);
  },
};
