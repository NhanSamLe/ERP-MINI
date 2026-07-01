import apiClient from "../../../api/axiosClient";

export interface CostCenterDTO {
  id?: number;
  branch_id?: number;
  code: string;
  name: string;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface CostCenterFilter {
  search?: string;
}

export const costCenterApi = {
  getAll: (params?: CostCenterFilter) =>
    apiClient.get<CostCenterDTO[]>("/finance/cost-centers", { params }).then(res => res.data),

  getById: (id: number) =>
    apiClient.get<CostCenterDTO>(`/finance/cost-centers/${id}`).then(res => res.data),

  create: (data: Partial<CostCenterDTO>) =>
    apiClient.post<CostCenterDTO>("/finance/cost-centers", data).then(res => res.data),

  update: (id: number, data: Partial<CostCenterDTO>) =>
    apiClient.put<CostCenterDTO>(`/finance/cost-centers/${id}`, data).then(res => res.data),

  remove: (id: number) =>
    apiClient.delete(`/finance/cost-centers/${id}`).then(res => res.data),
};
