import { purchaseOrderApi } from "./api/purchaseOrder.api";
import {
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
} from "./store/purchaseOrder.types";

export const purchaseOrderService = {
  async getAllPO(): Promise<PurchaseOrder[]> {
    const res = await purchaseOrderApi.getAll();
    return res;
  },

  async getPOById(id: number): Promise<PurchaseOrder> {
    const res = await purchaseOrderApi.getById(id);
    return res;
  },

  async getPOByStatus(status: string): Promise<PurchaseOrder[]> {
    const res = await purchaseOrderApi.getByStatus(status);
    return res;
  },

  async create(body: PurchaseOrderCreate): Promise<PurchaseOrder> {
    const res = await purchaseOrderApi.create(body);
    return res;
  },

  async update(id: number, body: PurchaseOrderUpdate): Promise<PurchaseOrder> {
    const res = await purchaseOrderApi.update(id, body);
    return res;
  },

  async delete(id: number): Promise<void> {
    await purchaseOrderApi.delete(id);
  },
};
