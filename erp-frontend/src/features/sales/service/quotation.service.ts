import { quotationApi } from "../api/quotation.api";
import { CreateQuotationDto, UpdateQuotationDto } from "../dto/quotation.dto";

export const getQuotations                  = async () => (await quotationApi.getAll()).data.data;
export const getQuotationsByOpportunity     = async (oppId: number) => (await quotationApi.getByOpportunity(oppId)).data.data;
export const getQuotationById               = async (id: number) => (await quotationApi.getById(id)).data.data;
export const createQuotation   = async (data: CreateQuotationDto) => (await quotationApi.create(data)).data.data;
export const updateQuotation   = async (id: number, data: UpdateQuotationDto) => (await quotationApi.update(id, data)).data.data;
export const submitQuotation   = async (id: number) => (await quotationApi.submit(id)).data.data;
export const approveQuotation  = async (id: number) => (await quotationApi.approve(id)).data.data;
export const rejectQuotation   = async (id: number, reason: string) => (await quotationApi.reject(id, reason)).data.data;
export const acceptQuotation   = async (id: number) => (await quotationApi.markAccepted(id)).data.data;
export const convertQuotation  = async (id: number) => (await quotationApi.convertToOrder(id)).data.data;
