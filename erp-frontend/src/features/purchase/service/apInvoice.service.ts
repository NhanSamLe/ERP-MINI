import axiosClient from "../../../api/axiosClient";
import {
  ApInvoiceDto,
  CreateApInvoiceDto,
  UpdateApInvoiceDto,
  RejectApInvoiceDto,
} from "../dto/apInvoice.dto";

// ================= GET LIST =================
export async function getApInvoices(): Promise<ApInvoiceDto[]> {
  const res = await axiosClient.get<ApInvoiceDto[]>("/ap/invoices");
  return res.data;
}

// ================= GET DETAIL =================
export async function getApInvoiceById(id: number): Promise<ApInvoiceDto> {
  const res = await axiosClient.get<ApInvoiceDto>(`/ap/invoices/${id}`);
  return res.data;
}

// ================= CREATE =================
export async function createApInvoice(
  data: CreateApInvoiceDto
): Promise<ApInvoiceDto> {
  const res = await axiosClient.post<ApInvoiceDto>("/ap/invoices", data);
  return res.data;
}

// ================= UPDATE =================
export async function updateApInvoice(
  id: number,
  data: UpdateApInvoiceDto
): Promise<ApInvoiceDto> {
  const res = await axiosClient.put<ApInvoiceDto>(`/ap/invoices/${id}`, data);
  return res.data;
}

// ================= SUBMIT =================
export async function submitApInvoice(id: number): Promise<ApInvoiceDto> {
  const res = await axiosClient.post<ApInvoiceDto>(`/ap/invoices/${id}/submit`);
  return res.data;
}

// ================= APPROVE =================
export async function approveApInvoice(id: number): Promise<ApInvoiceDto> {
  const res = await axiosClient.post<ApInvoiceDto>(`/ap/invoices/${id}/approve`);
  return res.data;
}

// ================= REJECT =================
export async function rejectApInvoice(
  id: number,
  data: RejectApInvoiceDto
): Promise<ApInvoiceDto> {
  const res = await axiosClient.post<ApInvoiceDto>(
    `/ap/invoices/${id}/reject`,
    data
  );
  return res.data;
}
