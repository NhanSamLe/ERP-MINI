import axiosClient from "../../../api/axiosClient";
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
} from "../dto/opportunity.dto";

export const getAllOpportunities = () => {
  return axiosClient.get("/crm/opportunities");
}
export const getOpportunityById = (oppId: number) => {
  return axiosClient.get(`/crm/opportunities/${oppId}`);
}
export const createOpportunity = (data: CreateOpportunityDto) => {
  return axiosClient.post("/crm/opportunities", data);
}
export const updateOpportunity = (data: UpdateOpportunityDto) => {
  return axiosClient.put(`/crm/opportunities/${data.oppId}`, data);
}
export const moveToNegotiation = (oppId: number) => {
  return axiosClient.patch(`/crm/opportunities/${oppId}/negotiation`,);
}
export const markWon = (oppId: number) => {
  return axiosClient.patch(`/crm/opportunities/${oppId}/won`);
}
export const markLost = (oppId: number, reason: string) => {
  return axiosClient.patch(`/crm/opportunities/${oppId}/lost`, { reason });
}

export const reassignOpportunity = (oppId: number, newUserId: number) => {
  return axiosClient.patch(`/crm/opportunities/${oppId}/reassign`, { newUserId });
}
// export const getMyOpportunities = () => {
//   return axiosClient.get("/crm/opportunities/my");
// }
export const getPipelineSummary = () => {
  return axiosClient.get("/crm/opportunities/pipeline-summary");
}
export const deleteOpportunity = (oppId: number) => {
  return axiosClient.delete(`/crm/opportunities/${oppId}`)
}
export const getClosingThisMonth = () => {
  return axiosClient.delete(`/crm/opportunities/closing-this-month`)
}
export const getUnclosedOpportunities = () => {
  return axiosClient.delete(`/crm/opportunities/unclosed`)
}