import axiosClient from "../../../api/axiosClient";
import {
  CreateInvoiceDto,
  RejectInvoiceDto,
} from "../dto/invoice.dto";

export const getInvoices = () => axiosClient.get("/ar/invoices");

export const getInvoiceById = (id: number) =>
  axiosClient.get(`/ar/invoices/${id}`);

export const createInvoice = (data: CreateInvoiceDto) =>
  axiosClient.post("/ar/invoices", data);

export const submitInvoice = (id: number) =>
  axiosClient.post(`/ar/invoices/${id}/submit`);

export const approveInvoice = (id: number) =>
  axiosClient.post(`/ar/invoices/${id}/approve`);

export const rejectInvoice = (id: number, data: RejectInvoiceDto) =>
  axiosClient.post(`/ar/invoices/${id}/reject`, data);

export const getAvailableOrders = () =>
  axiosClient.get("/ar/invoices/available-orders");
