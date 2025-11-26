import { Partner, PartnerFilter } from "./store/partner.types";
import apiClient from "../../api/axiosClient";

const BASE_URL = "/partners";

/**
 * GET /partners?search=&type=&status=
 */
export const fetchPartners = async (filter?: PartnerFilter): Promise<Partner[]> => {
  const res = await apiClient.get(BASE_URL, { params: filter });
  return res.data;
};

/**
 * GET /partners/:id
 */
export const fetchPartnerById = async (id: number): Promise<Partner> => {
  const res = await apiClient.get(`${BASE_URL}/${id}`);
  return res.data;
};

/**
 * POST /partners
 */
export const createPartnerApi = async (payload: Partial<Partner>): Promise<Partner> => {
  const res = await apiClient.post(BASE_URL, payload);
  return res.data;
};

/**
 * PUT /partners/:id
 */
export const updatePartnerApi = async (
  id: number,
  payload: Partial<Partner>
): Promise<Partner> => {
  const res = await apiClient.put(`${BASE_URL}/${id}`, payload);
  return res.data;
};

/**
 * DELETE /partners/:id
 */
export const deletePartnerApi = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};
