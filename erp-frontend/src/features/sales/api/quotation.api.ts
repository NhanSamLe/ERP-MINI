import axiosClient from "@/api/axiosClient";
import {
  QuotationDto,
  CreateQuotationDto,
  UpdateQuotationDto,
} from "../dto/quotation.dto";

const BASE = "/sales/quotations";

export const quotationApi = {
  getAll: (): Promise<{ data: { data: QuotationDto[] } }> =>
    axiosClient.get(BASE),

  getById: (id: number): Promise<{ data: { data: QuotationDto } }> =>
    axiosClient.get(`${BASE}/${id}`),

  create: (data: CreateQuotationDto): Promise<{ data: { data: QuotationDto } }> =>
    axiosClient.post(BASE, data),

  update: (id: number, data: UpdateQuotationDto): Promise<{ data: { data: QuotationDto } }> =>
    axiosClient.put(`${BASE}/${id}`, data),

  submit: (id: number): Promise<{ data: { data: QuotationDto } }> =>
    axiosClient.patch(`${BASE}/${id}/submit`),

  approve: (id: number): Promise<{ data: { data: QuotationDto } }> =>
    axiosClient.patch(`${BASE}/${id}/approve`),

  reject: (id: number, reason: string): Promise<{ data: { data: QuotationDto } }> =>
    axiosClient.patch(`${BASE}/${id}/reject`, { reason }),

  markAccepted: (id: number): Promise<{ data: { data: QuotationDto } }> =>
    axiosClient.patch(`${BASE}/${id}/accept`),

  convertToOrder: (id: number): Promise<{ data: { data: { id: number; order_no: string } } }> =>
    axiosClient.post(`${BASE}/${id}/convert-to-order`),
};
