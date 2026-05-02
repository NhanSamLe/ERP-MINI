import axiosClient from "../../../api/axiosClient";

export const getAllPipelines = () => {
  return axiosClient.get("/crm/pipelines");
};

export const createPipeline = (data: { name: string; description?: string }) => {
  return axiosClient.post("/crm/pipelines", data);
};

export const addStage = (pipelineId: number, data: { name: string; sequence: number; is_won?: boolean }) => {
  return axiosClient.post(`/crm/pipelines/${pipelineId}/stages`, data);
};
