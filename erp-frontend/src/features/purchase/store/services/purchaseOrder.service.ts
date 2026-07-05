import { purchaseOrderApi } from "../../api/purchaseOrder.api";
import {
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
} from "../purchaseOrder.types";

export const purchaseOrderService = {
  async getAllPO(): Promise<PurchaseOrder[]> {
    const res = await purchaseOrderApi.getAll();
    return res;
  },

  async getAvailableForInvoice(): Promise<PurchaseOrder[]> {
    const res = await purchaseOrderApi.getAvailableForInvoice();
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

  async submitForApproval(id: number): Promise<PurchaseOrder> {
    const res = await purchaseOrderApi.submitForApproval(id);
    return res;
  },

  async approve(id: number): Promise<PurchaseOrder> {
    const res = await purchaseOrderApi.approve(id);
    return res;
  },

  async cancel(id: number, reason: string): Promise<PurchaseOrder> {
    const res = await purchaseOrderApi.cancel(id, reason);
    return res;
  },

  async search(
    filters: any,
  ): Promise<{ items: PurchaseOrder[]; pagination: any }> {
    const res = await purchaseOrderApi.search(filters);
    return res;
  },

  async bulkApprove(po_ids: number[]): Promise<any> {
    const res = await purchaseOrderApi.bulkApprove(po_ids);
    return res;
  },

  async bulkCancel(po_ids: number[], reason: string): Promise<any> {
    const res = await purchaseOrderApi.bulkCancel(po_ids, reason);
    return res;
  },

  async getAuditLogs(id: number): Promise<any[]> {
    return purchaseOrderApi.getAuditLogs(id);
  },

  async sendEmail(id: number): Promise<{ success: boolean; message: string; po: PurchaseOrder }> {
    return purchaseOrderApi.sendEmail(id);
  },
};
