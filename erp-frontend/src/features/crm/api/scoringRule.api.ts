import axiosClient from "../../../api/axiosClient";

export const getAllScoringRules = () => axiosClient.get("/crm/scoring-rules");

export const createScoringRule = (data: {
  name: string;
  field: string;
  operator: string;
  value?: string;
  score: number;
}) => axiosClient.post("/crm/scoring-rules", data);

export const updateScoringRule = (
  id: number,
  data: {
    name?: string;
    field?: string;
    operator?: string;
    value?: string;
    score?: number;
    is_active?: boolean;
  }
) => axiosClient.put(`/crm/scoring-rules/${id}`, data);

export const deleteScoringRule = (id: number) =>
  axiosClient.delete(`/crm/scoring-rules/${id}`);
