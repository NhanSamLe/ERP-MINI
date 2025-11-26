import axios from "axios";
import { Partner, PartnerFilter } from "../store/partner.types";

const baseUrl = "/api/partners";

export async function fetchPartners(filter?: PartnerFilter): Promise<Partner[]> {
  const res = await axios.get<Partner[]>(baseUrl, { params: filter });
  return res.data;
}

export async function fetchPartnerById(id: number): Promise<Partner> {
  const res = await axios.get<Partner>(`${baseUrl}/${id}`);
  return res.data;
}

export async function createPartnerApi(payload: Partial<Partner>): Promise<Partner> {
  const res = await axios.post<Partner>(baseUrl, payload);
  return res.data;
}

export async function updatePartnerApi(
  id: number,
  payload: Partial<Partner>
): Promise<Partner> {
  const res = await axios.put<Partner>(`${baseUrl}/${id}`, payload);
  return res.data;
}

export async function deletePartnerApi(id: number): Promise<void> {
  await axios.delete(`${baseUrl}/${id}`);
}
