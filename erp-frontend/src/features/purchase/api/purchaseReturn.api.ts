import axiosClient from "../../../api/axiosClient";

// ─── PRA ──────────────────────────────────────────────────────────────────────

export interface Pra {
  id: number;
  branch_id: number;
  pra_no: string;
  purchase_order_id: number;
  ap_invoice_id?: number | null;
  supplier_id: number;
  reason: string;
  return_type: "refund" | "replacement" | "debit_note";
  status:
    | "draft"
    | "submitted"
    | "approved"
    | "rejected"
    | "processing"
    | "completed"
    | "cancelled";
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  total_return_amount: number;
  created_by: number;
  approved_by?: number | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  reject_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { id: number; name: string; email?: string };
  creator?: { id: number; full_name: string; avatar_url?: string };
}

// ─── Purchase Return ───────────────────────────────────────────────────────────

export interface PurchaseReturnLine {
  id: number;
  return_id: number;
  product_id: number;
  po_line_id?: number | null;
  quantity_returned: number;
  uom_id?: number | null;
  qty_in_stock_uom: number;
  quantity_confirmed: number;
  quantity_confirmed_stock_uom: number;
  quantity_rejected: number;
  quantity_rejected_stock_uom: number;
  unit_price: number;
  line_total: number;
  reason?: string | null;
  condition: "good" | "damaged" | "defective";
  product?: { id: number; name: string };
}

export interface PurchaseReturn {
  id: number;
  branch_id: number;
  return_no: string;
  pra_id?: number | null;
  purchase_order_id?: number | null;
  supplier_id: number;
  return_date: string;
  warehouse_id?: number | null;
  status: "draft" | "shipped" | "confirmed" | "completed" | "cancelled";
  total_return_amount: number;
  return_type?: "refund" | "replacement" | "debit_note";
  stock_move_id?: number | null;
  created_by: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { id: number; name: string };
  creator?: { id: number; full_name: string; avatar_url?: string };
  lines?: PurchaseReturnLine[];
}

// ─── AP Debit Note ─────────────────────────────────────────────────────────────

export interface ApDebitNoteLine {
  id: number;
  debit_note_id: number;
  product_id?: number | null;
  return_line_id?: number | null;
  description?: string | null;
  quantity: number;
  unit_price: number;
  tax_rate_id?: number | null;
  line_total: number;
  line_tax: number;
  line_total_after_tax: number;
  product?: { id: number; name: string };
}

export interface ApDebitNote {
  id: number;
  branch_id: number;
  debit_note_no: string;
  purchase_return_id?: number | null;
  original_ap_invoice_id?: number | null;
  supplier_id: number;
  debit_note_date: string;
  status: "draft" | "posted" | "applied" | "cancelled";
  total_before_tax: number;
  total_tax: number;
  total_after_tax: number;
  currency_id?: number | null;
  exchange_rate?: number;
  gl_entry_id?: number | null;
  created_by: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { id: number; name: string };
  creator?: { id: number; full_name: string; avatar_url?: string };
  lines?: ApDebitNoteLine[];
}

// ─── Vendor Refund ─────────────────────────────────────────────────────────────

export interface VendorRefund {
  id: number;
  branch_id: number;
  refund_no: string;
  debit_note_id?: number | null;
  supplier_id: number;
  refund_date: string;
  amount: number;
  method: "cash" | "bank" | "transfer";
  bank_account_id?: number | null;
  transaction_reference?: string | null;
  currency_id?: number | null;
  exchange_rate?: number;
  status: "draft" | "posted";
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  gl_entry_id?: number | null;
  created_by: number;
  approved_by?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { id: number; name: string };
  creator?: { id: number; full_name: string; avatar_url?: string };
  debitNote?: { id: number; debit_note_no: string; total_after_tax: number };
}

// ─── API functions ─────────────────────────────────────────────────────────────

export const praApi = {
  getAll: async (params?: Record<string, any>): Promise<Pra[]> => {
    const res = await axiosClient.get("/purchase/return-authorizations", {
      params,
    });
    return res.data.data;
  },
  getById: async (id: number): Promise<Pra> => {
    const res = await axiosClient.get(`/purchase/return-authorizations/${id}`);
    return res.data.data;
  },
  create: async (body: Partial<Pra>): Promise<Pra> => {
    const res = await axiosClient.post("/purchase/return-authorizations", body);
    return res.data.data;
  },
  update: async (id: number, body: Partial<Pra>): Promise<Pra> => {
    const res = await axiosClient.put(
      `/purchase/return-authorizations/${id}`,
      body,
    );
    return res.data.data;
  },
  submit: async (id: number): Promise<Pra> => {
    const res = await axiosClient.post(
      `/purchase/return-authorizations/${id}/submit`,
    );
    return res.data.data;
  },
  approve: async (id: number): Promise<Pra> => {
    const res = await axiosClient.post(
      `/purchase/return-authorizations/${id}/approve`,
    );
    return res.data.data;
  },
  reject: async (id: number, reason: string): Promise<Pra> => {
    const res = await axiosClient.post(
      `/purchase/return-authorizations/${id}/reject`,
      { reason },
    );
    return res.data.data;
  },
};

export const purchaseReturnApi = {
  getAll: async (params?: Record<string, any>): Promise<PurchaseReturn[]> => {
    const res = await axiosClient.get("/purchase/returns", { params });
    return res.data.data;
  },
  getById: async (id: number): Promise<PurchaseReturn> => {
    const res = await axiosClient.get(`/purchase/returns/${id}`);
    return res.data.data;
  },
  create: async (
    body: Partial<PurchaseReturn> & { lines: Partial<PurchaseReturnLine>[] },
  ): Promise<PurchaseReturn> => {
    const res = await axiosClient.post("/purchase/returns", body);
    return res.data.data;
  },
  update: async (
    id: number,
    body: Partial<PurchaseReturn> & { lines: Partial<PurchaseReturnLine>[] },
  ): Promise<PurchaseReturn> => {
    const res = await axiosClient.put(`/purchase/returns/${id}`, body);
    return res.data.data;
  },
  ship: async (id: number): Promise<PurchaseReturn> => {
    const res = await axiosClient.post(`/purchase/returns/${id}/ship`);
    return res.data.data;
  },
  confirm: async (
    id: number,
    lines: { line_id: number; qty_confirmed: number; qty_rejected: number }[],
  ): Promise<PurchaseReturn> => {
    const res = await axiosClient.post(`/purchase/returns/${id}/confirm`, {
      lines,
    });
    return res.data.data;
  },
  complete: async (id: number): Promise<PurchaseReturn> => {
    const res = await axiosClient.post(`/purchase/returns/${id}/complete`);
    return res.data.data;
  },
};

export const apDebitNoteApi = {
  getAll: async (params?: Record<string, any>): Promise<ApDebitNote[]> => {
    const res = await axiosClient.get("/purchase/debit-notes", { params });
    return res.data.data;
  },
  getById: async (id: number): Promise<ApDebitNote> => {
    const res = await axiosClient.get(`/purchase/debit-notes/${id}`);
    return res.data.data;
  },
  createFromReturn: async (returnId: number): Promise<ApDebitNote> => {
    const res = await axiosClient.post(
      `/purchase/debit-notes/from-return/${returnId}`,
    );
    return res.data.data;
  },
  getPreview: async (returnId: number): Promise<any> => {
    const res = await axiosClient.get(
      `/purchase/debit-notes/from-return/${returnId}/preview`,
    );
    return res.data.data;
  },
  post: async (id: number): Promise<ApDebitNote> => {
    const res = await axiosClient.post(`/purchase/debit-notes/${id}/post`);
    return res.data.data;
  },
  cancel: async (id: number): Promise<ApDebitNote> => {
    const res = await axiosClient.post(`/purchase/debit-notes/${id}/cancel`);
    return res.data.data;
  },
};

export const vendorRefundApi = {
  getAll: async (params?: Record<string, any>): Promise<VendorRefund[]> => {
    const res = await axiosClient.get("/purchase/vendor-refunds", { params });
    return res.data.data;
  },
  getById: async (id: number): Promise<VendorRefund> => {
    const res = await axiosClient.get(`/purchase/vendor-refunds/${id}`);
    return res.data.data;
  },
  create: async (body: Partial<VendorRefund>): Promise<VendorRefund> => {
    const res = await axiosClient.post("/purchase/vendor-refunds", body);
    return res.data.data;
  },
  post: async (id: number): Promise<VendorRefund> => {
    const res = await axiosClient.post(`/purchase/vendor-refunds/${id}/post`);
    return res.data.data;
  },
};
