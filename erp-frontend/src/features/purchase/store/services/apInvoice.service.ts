import { Partner } from "@/features/partner/store/partner.types";
import { apInvoiceApi } from "../../api/apInvoice.api";
import { ApInvoice, ApPostedSummary } from "../apInvoice/apInvoice.types";

export const apInvoiceService = {
  /* ================= GET ALL ================= */
  async getAll(): Promise<ApInvoice[]> {
    return await apInvoiceApi.getAll();
  },

  async getById(id: number): Promise<ApInvoice> {
    return await apInvoiceApi.getById(id);
  },

  async createFromPO(poId: number): Promise<ApInvoice> {
    return await apInvoiceApi.createFromPO(poId);
  },

  async submit(id: number) {
    return apInvoiceApi.submitForApproval(id);
  },

  async approve(id: number) {
    return apInvoiceApi.approve(id);
  },

  async reject(id: number, reason: string) {
    return apInvoiceApi.reject(id, reason);
  },

  async getPostedSummaryBySupplier(
    supplierId: number
  ): Promise<ApPostedSummary> {
    return await apInvoiceApi.getPostedSummaryBySupplier(supplierId);
  },

  async getPostedSuppliers(): Promise<Partner[]> {
    return await apInvoiceApi.getPostedSuppliers();
  },
};
