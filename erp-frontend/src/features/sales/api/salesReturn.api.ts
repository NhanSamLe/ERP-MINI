import axiosClient from "@/api/axiosClient";
import { CreateRmaDto, CreateSalesReturnFromRmaDto } from "../dto/salesReturn.dto";

export const salesReturnApi = {
  getRmas: () => axiosClient.get("/sales/returns/rmas"),
  getRma: (id: number) => axiosClient.get(`/sales/returns/rmas/${id}`),
  getReturnByRmaId: (rmaId: number) => axiosClient.get(`/sales/returns/rmas/${rmaId}/return`),
  createRma: (data: CreateRmaDto) => axiosClient.post("/sales/returns/rmas", data),
  submitRma: (id: number) => axiosClient.post(`/sales/returns/rmas/${id}/submit`),
  approveRma: (id: number) => axiosClient.post(`/sales/returns/rmas/${id}/approve`),
  rejectRma: (id: number, reason: string) => axiosClient.post(`/sales/returns/rmas/${id}/reject`, { reason }),
  createReturnFromRma: (id: number, data: CreateSalesReturnFromRmaDto) =>
    axiosClient.post(`/sales/returns/rmas/${id}/create-return`, data),

  getReturns: () => axiosClient.get("/sales/returns/returns"),
  getReturn: (id: number) => axiosClient.get(`/sales/returns/returns/${id}`),
  inspectReturn: (id: number, data: unknown) => axiosClient.post(`/sales/returns/returns/${id}/inspect`, data),
  completeReturn: (id: number) => axiosClient.post(`/sales/returns/returns/${id}/complete`),
  createCreditNote: (id: number) => axiosClient.post(`/sales/returns/returns/${id}/create-credit-note`),

  getCreditNotes: () => axiosClient.get("/sales/returns/credit-notes"),
  approveCreditNote: (id: number) => axiosClient.post(`/sales/returns/credit-notes/${id}/approve`),
  createRefund: (id: number, data: unknown) => axiosClient.post(`/sales/returns/credit-notes/${id}/create-refund`, data),
  getRefunds: () => axiosClient.get("/sales/returns/refunds"),
  approveRefund: (id: number) => axiosClient.post(`/sales/returns/refunds/${id}/approve`),
};
