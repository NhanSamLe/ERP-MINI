import axiosClient from "../../../api/axiosClient";


export type Branch = {
  id?: number;
  company_id: number;
  code: string;
  name: string;
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  tax_code?: string;
  bank_account?: string;
  bank_name?: string;
  status?: "active" | "inactive";
};

export const BranchAPI = {
  list:   () => axiosClient.get<Branch[]>("/branch"),
  get:    (id: number)            => axiosClient.get<Branch>(`/branch/${id}`),
  create: (payload: Branch)       => axiosClient.post<Branch>("/branch", payload),
  update: (id: number, p: Branch) => axiosClient.put<Branch>(`/branch/${id}`, p),
  deactivate: (id: number)        => axiosClient.patch(`/branch/${id}/deactivate`),
   activate:    (id: number)            => axiosClient.patch(`/branch/${id}/activate`),
  remove: (id: number)            => axiosClient.delete(`/branch/${id}`),
};
