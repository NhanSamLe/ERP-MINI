import axiosClient from "../../../api/axiosClient";

export const getAllLeadSources = () => axiosClient.get("/crm/lead-sources");

export const createLeadSource = (data: { name: string; description?: string }) =>
  axiosClient.post("/crm/lead-sources", data);

export const updateLeadSource = (id: number, data: { name?: string; description?: string; is_active?: boolean }) =>
  axiosClient.put(`/crm/lead-sources/${id}`, data);

export const deleteLeadSource = (id: number) =>
  axiosClient.delete(`/crm/lead-sources/${id}`);
