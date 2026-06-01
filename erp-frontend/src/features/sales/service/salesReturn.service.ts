import { salesReturnApi } from "../api/salesReturn.api";
import {
  CreateRmaDto,
  CreateSalesReturnFromRmaDto,
  SalesReturnAuthorizationDto,
  SalesReturnDto,
} from "../dto/salesReturn.dto";

export async function getRmas(): Promise<SalesReturnAuthorizationDto[]> {
  const res = await salesReturnApi.getRmas();
  return res.data.data;
}

export async function getRma(id: number): Promise<SalesReturnAuthorizationDto> {
  const res = await salesReturnApi.getRma(id);
  return res.data.data;
}

export async function createRma(data: CreateRmaDto): Promise<SalesReturnAuthorizationDto> {
  const res = await salesReturnApi.createRma(data);
  return res.data.data;
}

export async function submitRma(id: number): Promise<SalesReturnAuthorizationDto> {
  const res = await salesReturnApi.submitRma(id);
  return res.data.data;
}

export async function approveRma(id: number): Promise<SalesReturnAuthorizationDto> {
  const res = await salesReturnApi.approveRma(id);
  return res.data.data;
}

export async function rejectRma(id: number, reason: string): Promise<SalesReturnAuthorizationDto> {
  const res = await salesReturnApi.rejectRma(id, reason);
  return res.data.data;
}

export async function createReturnFromRma(
  id: number,
  data: CreateSalesReturnFromRmaDto
): Promise<SalesReturnDto> {
  const res = await salesReturnApi.createReturnFromRma(id, data);
  return res.data.data;
}

export async function getReturns(): Promise<SalesReturnDto[]> {
  const res = await salesReturnApi.getReturns();
  return res.data.data;
}

export async function getReturn(id: number): Promise<SalesReturnDto> {
  const res = await salesReturnApi.getReturn(id);
  return res.data.data;
}

export async function inspectReturn(id: number, data: unknown): Promise<SalesReturnDto> {
  const res = await salesReturnApi.inspectReturn(id, data);
  return res.data.data;
}

export async function completeReturn(id: number): Promise<SalesReturnDto> {
  const res = await salesReturnApi.completeReturn(id);
  return res.data.data;
}

export async function createCreditNote(id: number) {
  const res = await salesReturnApi.createCreditNote(id);
  return res.data.data;
}
