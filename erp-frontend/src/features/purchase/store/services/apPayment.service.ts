import { apPaymentApi } from "../../api/apPayment.api";
import { ApPayment } from "../apPayment/apPayment.types";

export const apPaymentService = {
  async getAll(): Promise<ApPayment[]> {
    return apPaymentApi.getAll();
  },

  async getById(id: number): Promise<ApPayment> {
    return apPaymentApi.getById(id);
  },

  async create(payload: Partial<ApPayment>): Promise<ApPayment> {
    return apPaymentApi.create(payload);
  },

  async submit(id: number): Promise<ApPayment> {
    return apPaymentApi.submitForApproval(id);
  },

  async approve(id: number): Promise<ApPayment> {
    return apPaymentApi.approve(id);
  },

  async reject(id: number, reason: string): Promise<ApPayment> {
    return apPaymentApi.reject(id, reason);
  },
};
