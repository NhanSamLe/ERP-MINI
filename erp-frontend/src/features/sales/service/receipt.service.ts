import * as api from "../api/receipt.api";
import {
  ArReceiptDto,
  CreateReceiptDto,
  UpdateReceiptDto,
  AllocateReceiptDto,
} from "../dto/receipt.dto";

export async function getReceipts(): Promise<ArReceiptDto[]> {
  const res = await api.getReceipts();
  return res.data.data as ArReceiptDto[];
}

export async function getReceiptById(id: number): Promise<ArReceiptDto> {
  const res = await api.getReceiptById(id);
  return res.data.data as ArReceiptDto;
}

export async function createReceipt(
  data: CreateReceiptDto
): Promise<ArReceiptDto> {
  const res = await api.createReceipt(data);
  return res.data.data as ArReceiptDto;
}

export async function updateReceipt(
  id: number,
  data: UpdateReceiptDto
): Promise<ArReceiptDto> {
  const res = await api.updateReceipt(id, data);
  return res.data.data as ArReceiptDto;
}

export async function submitReceipt(id: number): Promise<ArReceiptDto> {
  const res = await api.submitReceipt(id);
  return res.data.data as ArReceiptDto;
}

export async function approveReceipt(id: number): Promise<ArReceiptDto> {
  const res = await api.approveReceipt(id);
  return res.data.data as ArReceiptDto;
}

export async function rejectReceipt(
  id: number,
  reason: string
): Promise<ArReceiptDto> {
  const res = await api.rejectReceipt(id, reason);
  return res.data.data as ArReceiptDto;
}

export async function allocateReceipt(
  id: number,
  allocations: AllocateReceiptDto[]
): Promise<ArReceiptDto> {
  const res = await api.allocateReceipt(id, allocations);
  return res.data.data as ArReceiptDto;
}
