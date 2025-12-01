import axiosClient from "../../../api/axiosClient";
import {
  CreateSaleOrderDto,
  UpdateSaleOrderDto,
  RejectSaleOrderDto,
} from "../dto/saleOrder.dto";

export const getSaleOrders = () => axiosClient.get("/sales/orders");

export const getSaleOrderById = (id: number) =>
  axiosClient.get(`/sales/orders/${id}`);

export const createSaleOrder = (data: CreateSaleOrderDto) =>
  axiosClient.post("/sales/orders", data);

export const updateSaleOrder = (id: number, data: UpdateSaleOrderDto) =>
  axiosClient.put(`/sales/orders/${id}`, data);

export const submitSaleOrder = (id: number) =>
  axiosClient.post(`/sales/orders/${id}/submit`);

export const approveSaleOrder = (id: number) =>
  axiosClient.post(`/sales/orders/${id}/approve`);

export const rejectSaleOrder = (id: number, data: RejectSaleOrderDto) =>
  axiosClient.post(`/sales/orders/${id}/reject`, data);

export const fetchSaleOrdersByStatusApi = (status: string) =>
  axiosClient.get(`/sales/orders/status/${status}`);
