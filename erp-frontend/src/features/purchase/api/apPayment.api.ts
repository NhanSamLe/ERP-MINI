import axiosClient from "../../../api/axiosClient";
import { ApPayment } from "../store/apPayment/apPayment.types";

export const apPaymentApi = {
  getAll: async (): Promise<ApPayment[]> => {
    const res = await axiosClient.get("ap/payments");
    return res.data.data;
  },

  getById: async (id: number): Promise<ApPayment> => {
    const res = await axiosClient.get(`ap/payments/${id}`);
    return res.data.data;
  },

  create: async (payload: Partial<ApPayment>): Promise<ApPayment> => {
    const res = await axiosClient.post("ap/payments", payload);
    return res.data.data;
  },

  submitForApproval: async (id: number): Promise<ApPayment> => {
    const res = await axiosClient.post(`ap/payments/${id}/submit`);
    return res.data.data;
  },

  approve: async (id: number): Promise<ApPayment> => {
    const res = await axiosClient.put(`ap/payments/${id}/approve`);
    return res.data.data;
  },

  reject: async (id: number, reason: string): Promise<ApPayment> => {
    const res = await axiosClient.put(`ap/payments/${id}/reject`, { reason });
    return res.data.data;
  },
};
