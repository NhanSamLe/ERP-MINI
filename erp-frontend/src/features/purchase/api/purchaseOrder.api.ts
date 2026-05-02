import axiosClient from "../../../api/axiosClient";
import {
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
} from "../store/purchaseOrder.types";

export interface PoInvoiceSummaryLine {
  po_line_id: number;
  product_id?: number;
  quantity: number;
  unit_price: number;
  uom_id?: number | null;
  tax_rate_id?: number | null;
  line_total: number;
  line_tax: number;
  line_total_after_tax: number;
  invoiced_qty: number;
  remaining_qty: number;
}

export interface PoInvoiceSummary {
  po_id: number;
  po_no: string;
  total_after_tax: number;
  invoiced_amount: number;
  remaining_amount: number;
  invoice_count: number;
  lines: PoInvoiceSummaryLine[];
}

export const purchaseOrderApi = {
  getAll: async (): Promise<PurchaseOrder[]> => {
    const res = await axiosClient.get("/purchase-order");
    return res.data;
  },

  getAvailableForInvoice: async (): Promise<PurchaseOrder[]> => {
    const res = await axiosClient.get("/purchase-order/available-for-invoice");
    return res.data.data;
  },

  getPoInvoiceSummary: async (poId: number): Promise<PoInvoiceSummary> => {
    const res = await axiosClient.get(
      `/purchase-order/${poId}/invoice-summary`,
    );
    return res.data.data;
  },

  getById: async (id: number): Promise<PurchaseOrder> => {
    const res = await axiosClient.get(`/purchase-order/${id}`);
    return res.data;
  },

  getByStatus: async (status: string): Promise<PurchaseOrder[]> => {
    const res = await axiosClient.get(
      `/purchase-order/by-status?status=${status}`,
    );
    return res.data;
  },

  create: async (body: PurchaseOrderCreate): Promise<PurchaseOrder> => {
    const res = await axiosClient.post("/purchase-order", body);
    return res.data;
  },

  update: async (
    id: number,
    body: PurchaseOrderUpdate,
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

  search: async (
    filters: any,
  ): Promise<{ items: PurchaseOrder[]; pagination: any }> => {
    const res = await axiosClient.get("/purchase-order/search", {
      params: filters,
    });
    return {
      items: res.data.data,
      pagination: res.data.pagination,
    };
  },

  bulkApprove: async (po_ids: number[]): Promise<any> => {
    const res = await axiosClient.post("/purchase-order/bulk-approve", {
      po_ids,
    });
    return res.data;
  },

  bulkCancel: async (po_ids: number[], reason: string): Promise<any> => {
    const res = await axiosClient.post("/purchase-order/bulk-cancel", {
      po_ids,
      reason,
    });
    return res.data;
  },
};
