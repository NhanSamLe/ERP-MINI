import axiosClient from "../../../api/axiosClient";

export interface RfqLine {
  id?: number;
  rfq_id?: number;
  product_id: number;
  description?: string | null;
  quantity: number;
  uom_id?: number | null;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate_id?: number | null;
  line_total?: number;
  line_tax?: number;
  line_total_after_tax?: number;
  lead_time_days?: number | null;
  product?: { id: number; name: string; image_url?: string };
}

export interface Rfq {
  id: number;
  branch_id: number;
  rfq_no: string;
  supplier_id?: number | null;
  currency_id?: number | null;
  exchange_rate?: number;
  payment_term_id?: number | null;
  rfq_date: string;
  valid_until?: string | null;
  status:
    | "draft"
    | "sent"
    | "received"
    | "accepted"
    | "rejected"
    | "expired"
    | "cancelled";
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  version: number;
  parent_id?: number | null;
  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;
  discount_percent: number;
  discount_amount: number;
  supplier_notes?: string | null;
  internal_notes?: string | null;
  buyer_id?: number | null;
  created_by: number;
  approved_by?: number | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;
  sent_at?: string | null;
  received_at?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { id: number; name: string; email?: string; phone?: string };
  creator?: { id: number; full_name: string; avatar_url?: string };
  approver?: { id: number; full_name: string; avatar_url?: string };
  currency?: { id: number; name: string; code: string };
  paymentTerm?: { id: number; name: string; days: number };
  lines?: RfqLine[];
}

export interface RfqCompareResult {
  rfqs: {
    id: number;
    rfq_no: string;
    supplier: { id: number; name: string } | null;
    total_after_tax: number;
    valid_until: string | null;
    status: string;
  }[];
  products: {
    product_id: number;
    product_name: string;
    by_rfq: Record<
      number,
      {
        unit_price: number;
        quantity: number;
        discount_percent: number;
        line_total_after_tax: number;
        lead_time_days: number | null;
      }
    >;
  }[];
}

export const rfqApi = {
  getAll: async (params?: Record<string, any>): Promise<Rfq[]> => {
    const res = await axiosClient.get("/purchase/rfqs", { params });
    return res.data.data;
  },

  getById: async (id: number): Promise<Rfq> => {
    const res = await axiosClient.get(`/purchase/rfqs/${id}`);
    return res.data.data;
  },

  create: async (
    body: Partial<Rfq> & { lines: Partial<RfqLine>[] },
  ): Promise<Rfq> => {
    const res = await axiosClient.post("/purchase/rfqs", body);
    return res.data.data;
  },

  update: async (
    id: number,
    body: Partial<Rfq> & { lines?: Partial<RfqLine>[] },
  ): Promise<Rfq> => {
    const res = await axiosClient.put(`/purchase/rfqs/${id}`, body);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/purchase/rfqs/${id}`);
  },

  send: async (id: number): Promise<Rfq> => {
    const res = await axiosClient.post(`/purchase/rfqs/${id}/send`);
    return res.data.data;
  },

  markReceived: async (id: number): Promise<Rfq> => {
    const res = await axiosClient.post(`/purchase/rfqs/${id}/mark-received`);
    return res.data.data;
  },

  accept: async (id: number): Promise<Rfq> => {
    const res = await axiosClient.post(`/purchase/rfqs/${id}/accept`);
    return res.data.data;
  },

  reject: async (id: number): Promise<Rfq> => {
    const res = await axiosClient.post(`/purchase/rfqs/${id}/reject`);
    return res.data.data;
  },

  submit: async (id: number): Promise<Rfq> => {
    const res = await axiosClient.post(`/purchase/rfqs/${id}/submit`);
    return res.data.data;
  },

  approve: async (id: number): Promise<Rfq> => {
    const res = await axiosClient.post(`/purchase/rfqs/${id}/approve`);
    return res.data.data;
  },

  rejectApproval: async (id: number, reason: string): Promise<Rfq> => {
    const res = await axiosClient.post(`/purchase/rfqs/${id}/reject-approval`, {
      reason,
    });
    return res.data.data;
  },

  convertToPo: async (
    id: number,
  ): Promise<{ po_id: number; rfq_id: number }> => {
    const res = await axiosClient.post(`/purchase/rfqs/${id}/convert-to-po`);
    return res.data.data;
  },

  createNewVersion: async (id: number): Promise<Rfq> => {
    const res = await axiosClient.post(`/purchase/rfqs/${id}/new-version`);
    return res.data.data;
  },

  compare: async (ids: number[]): Promise<RfqCompareResult> => {
    const res = await axiosClient.get("/purchase/rfqs/compare", {
      params: { ids: ids.join(",") },
    });
    return res.data.data;
  },
};
