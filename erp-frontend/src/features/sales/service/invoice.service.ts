import * as api from "../api/invoice.api";
import {
  ArInvoiceDto,
  CreateInvoiceDto,
  RejectInvoiceDto,
} from "../dto/invoice.dto";
import { SaleOrderDto } from "../dto/saleOrder.dto";

export async function getInvoices(): Promise<ArInvoiceDto[]> {
  const res = await api.getInvoices();
  return res.data.data as ArInvoiceDto[];
}

export async function getInvoiceById(id: number): Promise<ArInvoiceDto> {
  const res = await api.getInvoiceById(id);
  return res.data.data as ArInvoiceDto;
}

export async function createInvoice(
  data: CreateInvoiceDto
): Promise<ArInvoiceDto> {
  const res = await api.createInvoice(data);
  return res.data.data as ArInvoiceDto;
}


export async function submitInvoice(id: number): Promise<ArInvoiceDto> {
  const res = await api.submitInvoice(id);
  return res.data.data as ArInvoiceDto;
}

export async function approveInvoice(id: number): Promise<ArInvoiceDto> {
  const res = await api.approveInvoice(id);
  return res.data.data as ArInvoiceDto;
}

export async function rejectInvoice(
  id: number,
  reason: string
): Promise<ArInvoiceDto> {
  const payload: RejectInvoiceDto = { reason };
  const res = await api.rejectInvoice(id, payload);
  return res.data.data as ArInvoiceDto;
}

export async function getAvailableOrders(): Promise<SaleOrderDto[]> {
  const res = await api.getAvailableOrders();
  return res.data.data as SaleOrderDto[];
}
