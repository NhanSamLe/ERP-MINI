// documentIntelligence.api.ts
import axiosClient from "@/api/axiosClient";
import {
  StatusResponse,
  EnrichedResult,
  ConfirmPayload,
  DuplicateCheckResult,
  HistoryParams,
  HistoryResponse,
  ThreeWayMatchResult,
  MatchingResult,
} from "../store/documentIntelligence/documentIntelligence.types";

export const documentIntelligenceApi = {
  /**
   * Upload an invoice file for OCR processing.
   * Uses multipart/form-data.
   */
  uploadDocument: async (
    file: File,
  ): Promise<{ documentId: number; status: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axiosClient.post("documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  /**
   * Poll the OCR processing status for a document.
   */
  getStatus: async (id: number): Promise<StatusResponse> => {
    const res = await axiosClient.get(`documents/${id}/status`);
    return res.data;
  },

  /**
   * Get the enriched OCR result (vendor match, product matches, duplicate warning).
   */
  getResult: async (id: number): Promise<EnrichedResult> => {
    const res = await axiosClient.get(`documents/${id}/result`);
    return res.data;
  },

  /**
   * Confirm the OCR result and create an AP Invoice.
   */
  confirmDocument: async (
    id: number,
    payload: ConfirmPayload,
  ): Promise<{ purchase_invoice_id: number }> => {
    const res = await axiosClient.post(`documents/${id}/confirm`, payload);
    return res.data;
  },

  /**
   * Check for a duplicate invoice before confirming.
   */
  checkDuplicate: async (
    invoice_no: string,
    supplier_id: number,
    branch_id: number,
  ): Promise<DuplicateCheckResult> => {
    const res = await axiosClient.post("documents/check-duplicate", {
      invoice_no,
      supplier_id,
      branch_id,
    });
    return res.data;
  },

  /**
   * Get the upload history with optional filters and pagination.
   */
  getHistory: async (params: HistoryParams): Promise<HistoryResponse> => {
    const res = await axiosClient.get("documents/history", { params });
    return res.data;
  },

  /**
   * Run three-way matching for a confirmed AP invoice.
   */
  threeWayMatch: async (invoiceId: number): Promise<ThreeWayMatchResult> => {
    const res = await axiosClient.post("matching/three-way", { invoiceId });
    return res.data;
  },

  /**
   * Get the stored three-way matching result for an AP invoice.
   */
  getMatchingResult: async (invoiceId: number): Promise<MatchingResult> => {
    const res = await axiosClient.get(`matching/${invoiceId}`);
    return res.data;
  },

  /**
   * Get purchase orders available for invoicing, optionally filtered by supplier.
   */
  getPurchaseOrdersForVendor: async (
    supplierId?: number,
  ): Promise<
    Array<{
      id: number;
      po_no: string;
      total_after_tax: number;
      order_date: string;
    }>
  > => {
    const params: any = {};
    if (supplierId) params.supplier_id = supplierId;
    const res = await axiosClient.get("documents/po-suggestions", { params });
    return res.data.data ?? [];
  },
};
