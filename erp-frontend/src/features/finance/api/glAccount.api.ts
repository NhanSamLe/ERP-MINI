import apiClient from "../../../api/axiosClient";
import { GlAccountDTO, GlAccountFilter } from "../dto/glAccount.dto";

const BASE_URL = "/finance/gl-accounts";

export const glAccountApi = {
  getAll: (params?: GlAccountFilter) =>
    apiClient.get<GlAccountDTO[]>(BASE_URL, { params }),
  getById: (id: number) => apiClient.get<GlAccountDTO>(`${BASE_URL}/${id}`),
  create: (data: GlAccountDTO) => apiClient.post<GlAccountDTO>(BASE_URL, data),
  update: (id: number, data: Partial<GlAccountDTO>) =>
    apiClient.put<GlAccountDTO>(`${BASE_URL}/${id}`, data),
  remove: (id: number) => apiClient.delete(`${BASE_URL}/${id}`),
};
