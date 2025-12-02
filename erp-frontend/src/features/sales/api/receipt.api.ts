import axiosClient from "../../../api/axiosClient";
import {
  CreateReceiptDto,
  UpdateReceiptDto,
  AllocateReceiptDto,
  ReceiptFilterDto,
} from "../dto/receipt.dto";

export const searchReceipts = (filters: ReceiptFilterDto) =>
  axiosClient.get("/ar/receipts", { params: filters });


export const getReceiptById = (id: number) =>
  axiosClient.get(`/ar/receipts/${id}`);

export const createReceipt = (data: CreateReceiptDto) =>
  axiosClient.post("/ar/receipts", data);

export const updateReceipt = (id: number, data: UpdateReceiptDto) =>
  axiosClient.put(`/ar/receipts/${id}`, data);

export const submitReceipt = (id: number) =>
  axiosClient.post(`/ar/receipts/${id}/submit`);

export const approveReceipt = (id: number) =>
  axiosClient.post(`/ar/receipts/${id}/approve`);

export const rejectReceipt = (id: number, reason: string) =>
  axiosClient.post(`/ar/receipts/${id}/reject`, { reason });

export const allocateReceipt = (id: number, allocations: AllocateReceiptDto[]) =>
  axiosClient.post(`/ar/receipts/${id}/allocate`, { allocations });

export const getCustomerUnpaidInvoices = (customerId: number) =>
  axiosClient.get(`/ar/receipts/customer/${customerId}/unpaid`);

export const apiGetCustomersWithDebt = () =>
  axiosClient.get("/ar/receipts/customers/debt");
