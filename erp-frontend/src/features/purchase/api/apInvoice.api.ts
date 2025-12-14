import { Partner } from "@/features/partner/store/partner.types";
import axiosClient from "../../../api/axiosClient";
import { ApInvoice, ApPostedSummary } from "../store/apInvoice/apInvoice.types";

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
  getPostedSummaryBySupplier: async (
    supplierId: number
  ): Promise<ApPostedSummary> => {
    const res = await axiosClient.get("ap/invoices/posted-summary", {
      params: { supplier_id: supplierId },
    });
    return res.data.data;
  },

  getPostedSuppliers: async (): Promise<Partner[]> => {
    const res = await axiosClient.get("/ap/invoices/posted-suppliers");
    return res.data.data;
  },
};
