import * as api from "../api/saleOrder.api";
import {
  SaleOrderDto,
  CreateSaleOrderDto,
  UpdateSaleOrderDto,
  RejectSaleOrderDto,
} from "../dto/saleOrder.dto";

export async function getSaleOrders(): Promise<SaleOrderDto[]> {
  const res = await api.getSaleOrders();
  return res.data.data as SaleOrderDto[];
}

export async function getSaleOrderById(id: number): Promise<SaleOrderDto> {
  const res = await api.getSaleOrderById(id);
  return res.data.data as SaleOrderDto;
}

export async function createSaleOrder(
  data: CreateSaleOrderDto
): Promise<SaleOrderDto> {
  const res = await api.createSaleOrder(data);
  return res.data.data as SaleOrderDto;
}

export async function updateSaleOrder(
  id: number,
  data: UpdateSaleOrderDto
): Promise<SaleOrderDto> {
  const res = await api.updateSaleOrder(id, data);
  return res.data.data as SaleOrderDto;
}

export async function submitSaleOrder(id: number): Promise<SaleOrderDto> {
  const res = await api.submitSaleOrder(id);
  return res.data.data as SaleOrderDto;
}

export async function approveSaleOrder(id: number): Promise<SaleOrderDto> {
  const res = await api.approveSaleOrder(id);
  return res.data.data as SaleOrderDto;
}

export async function rejectSaleOrder(
  id: number,
  reason: string
): Promise<SaleOrderDto> {
  const payload: RejectSaleOrderDto = { reason };
  const res = await api.rejectSaleOrder(id, payload);
  return res.data.data as SaleOrderDto;
}
