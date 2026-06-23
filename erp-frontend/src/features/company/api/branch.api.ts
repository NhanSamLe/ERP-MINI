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

export type BranchPayload = Omit<Branch, "id">;
export type BranchUpdatePayload = Partial<BranchPayload>;

export const BranchAPI = {
  list:   () => axiosClient.get<Branch[]>("/branch"),
  get:    (id: number)            => axiosClient.get<Branch>(`/branch/${id}`),
  create: (payload: BranchPayload)       => axiosClient.post<Branch>("/branch", payload),
  update: (id: number, p: BranchUpdatePayload) => axiosClient.put<Branch>(`/branch/${id}`, p),
  deactivate: (id: number)        => axiosClient.patch(`/branch/${id}/deactivate`),
  activate:    (id: number)            => axiosClient.patch(`/branch/${id}/activate`),
  remove: (id: number)            => axiosClient.delete(`/branch/${id}`),
};
