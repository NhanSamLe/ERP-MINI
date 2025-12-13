import axiosClient from "../../../api/axiosClient";
import {
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
} from "../store/purchaseOrder.types";

export const purchaseOrderApi = {
  getAll: async (): Promise<PurchaseOrder[]> => {
    const res = await axiosClient.get("/purchase-order");
    return res.data;
  },

  getAvailableForInvoice: async (): Promise<PurchaseOrder[]> => {
    const res = await axiosClient.get("/purchase-order/available-for-invoice");
    return res.data.data;
  },

  getById: async (id: number): Promise<PurchaseOrder> => {
    const res = await axiosClient.get(`/purchase-order/${id}`);
    return res.data;
  },

  getByStatus: async (status: string): Promise<PurchaseOrder[]> => {
    const res = await axiosClient.get(
      `/purchase-order/by-status?status=${status}`
    );
    return res.data;
  },

  create: async (body: PurchaseOrderCreate): Promise<PurchaseOrder> => {
    const res = await axiosClient.post("/purchase-order", body);
    return res.data;
  },

  update: async (
    id: number,
    body: PurchaseOrderUpdate
  ): Promise<PurchaseOrder> => {
    return axiosClient
      .put(`/purchase-order/${id}`, body)
      .then((res) => res.data);
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/purchase-order/${id}`);
  },

  submitForApproval: async (id: number): Promise<PurchaseOrder> => {
    const res = await axiosClient.patch(`/purchase-order/${id}/submit`);
    return res.data;
  },

  approve: async (id: number): Promise<PurchaseOrder> => {
    const res = await axiosClient.put(`/purchase-order/${id}/approve`);
    return res.data;
  },
  cancel: async (id: number, reason: string): Promise<PurchaseOrder> => {
    const res = await axiosClient.put(`/purchase-order/${id}/cancel`, {
      reason,
    });
    return res.data;
  },
};
