import axiosClient from "../../../api/axiosClient";
import { ApInvoice } from "../store/apInvoice/apInvoice.types";

export const apInvoiceApi = {
  getAll: async (): Promise<ApInvoice[]> => {
    const res = await axiosClient.get("ap/invoices");
    return res.data.data;
  },

  getById: async (id: number): Promise<ApInvoice> => {
    const res = await axiosClient.get(`ap/invoices/${id}`);
    return res.data.data;
  },

  createFromPO: async (poId: number): Promise<ApInvoice> => {
    const res = await axiosClient.post(`ap/invoices/from-po/${poId}`);
    return res.data;
  },

  submitForApproval: async (id: number): Promise<ApInvoice> => {
    const res = await axiosClient.post(`ap/invoices/${id}/submit`);
    return res.data.data;
  },

  approve: async (id: number): Promise<ApInvoice> => {
    const res = await axiosClient.put(`ap/invoices/${id}/approve`);
    return res.data.data;
  },

  reject: async (id: number, reason: string): Promise<ApInvoice> => {
    const res = await axiosClient.put(`ap/invoices/${id}/reject`, { reason });
    return res.data.data;
  },
};
