import { apInvoiceApi } from "../../api/apInvoice.api";
import { ApInvoice } from "../apInvoice/apInvoice.types";

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
};
