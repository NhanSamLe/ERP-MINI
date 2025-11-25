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

  getById: async (id: number): Promise<PurchaseOrder> => {
    const res = await axiosClient.get(`/purchase-order/${id}`);
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
};
