import { Partner } from "@/features/partner/store/partner.types";
import axiosClient from "../../../api/axiosClient";
import {
  ApInvoice,
  ApInvoiceSource,
  ApPostedSummary,
} from "../store/apInvoice/apInvoice.types";

export interface CreateManualInvoicePayload {
  invoice_no: string;
  invoice_date: string;
  due_date?: string;
  supplier_id: number;
  po_id?: number | null;
  invoice_series?: string;
  invoice_template?: string;
  tax_code?: string;
  total_before_tax?: number;
  total_tax?: number;
  total_after_tax?: number;
  lines: Array<{
    product_id?: number | null;
    description?: string;
    quantity: number;
    unit_price: number;
    uom_id?: number | null;
    tax_rate_id?: number | null;
    line_total?: number;
    line_tax?: number;
    line_total_after_tax?: number;
    po_line_id?: number | null;
  }>;
  overrideDuplicate?: boolean;
  override_reason?: string;
}

export interface GetAllInvoicesParams {
  status?: string;
  approval_status?: string;
  source?: ApInvoiceSource;
}

export const apInvoiceApi = {
  getAll: async (params?: GetAllInvoicesParams): Promise<ApInvoice[]> => {
    const res = await axiosClient.get("ap/invoices", { params });
    return res.data.data;
  },

  getById: async (id: number): Promise<ApInvoice> => {
    const res = await axiosClient.get(`ap/invoices/${id}`);
    return res.data.data;
  },

  /** Tạo invoice thủ công — không cần PO */
  createManual: async (
    payload: CreateManualInvoicePayload,
  ): Promise<{ invoice: ApInvoice; duplicateWarning?: any }> => {
    const res = await axiosClient.post("ap/invoices", payload);
    return {
      invoice: res.data.data,
      duplicateWarning: res.data.duplicateWarning,
    };
  },

  createFromPO: async (poId: number): Promise<ApInvoice> => {
    const res = await axiosClient.post(`ap/invoices/from-po/${poId}`);
    return res.data.data;
  },

  createPartialFromPO: async (
    poId: number,
    lines: Array<{ po_line_id: number; quantity: number }>,
  ): Promise<ApInvoice> => {
    const res = await axiosClient.post(`ap/invoices/from-po/${poId}/partial`, {
      lines,
    });
    return res.data.data;
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

  deleteInvoice: async (id: number): Promise<void> => {
    await axiosClient.delete(`ap/invoices/${id}`);
  },

  getPostedSummaryBySupplier: async (
    supplierId: number,
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
