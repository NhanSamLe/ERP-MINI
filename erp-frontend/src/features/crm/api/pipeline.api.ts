import axiosClient from "../../../api/axiosClient";

export const getAllPipelines = (isActive?: boolean) => {
  const params: Record<string, string> = {};
  if (isActive !== undefined) params.is_active = String(isActive);
  return axiosClient.get("/crm/pipelines", { params });
};

export const createPipeline = (data: { name: string; description?: string }) =>
  axiosClient.post("/crm/pipelines", data);

export const updatePipeline = (id: number, data: { name?: string; description?: string; is_active?: boolean }) =>
  axiosClient.put(`/crm/pipelines/${id}`, data);

export const addStage = (pipelineId: number, data: { name: string; sequence: number; probability?: number; is_won?: boolean; is_lost?: boolean; color?: string }) =>
  axiosClient.post(`/crm/pipelines/${pipelineId}/stages`, data);

export const updateStage = (stageId: number, data: { name?: string; sequence?: number; probability?: number; is_won?: boolean; is_lost?: boolean; color?: string }) =>
  axiosClient.put(`/crm/pipelines/stages/${stageId}`, data);

export const deleteStage = (stageId: number) =>
  axiosClient.delete(`/crm/pipelines/stages/${stageId}`);
