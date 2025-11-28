import axiosClient from "../../../api/axiosClient";
import { 
  CreateLeadDto, 
  UpdateLeadEvaluationDto,
  UpdateLeadBasicDto,
} from "../dto/lead.dto";

export const getAllLeads = () => axiosClient.get("/crm/leads");

// export const getMyLeads = () => axiosClient.get("/crm/leads/my");

export const getLeadById = (leadId: number) =>
  axiosClient.get(`/crm/leads/${leadId}`);

export const getLeadsByStage = (stage: string) =>
  axiosClient.get(`/crm/leads/stage/${stage}`);

export const createLead = (data: CreateLeadDto) =>
  axiosClient.post("/crm/leads", data);


export const updateLeadBasic = (leadId: number, data: UpdateLeadBasicDto) =>
  axiosClient.patch(`/crm/leads/${leadId}`, data);


export const updateLeadEvaluation = (
  leadId: number,
  data: UpdateLeadEvaluationDto
) => axiosClient.patch(`/crm/leads/${leadId}/evaluation`, data);


// =============================
// CONVERT TO CUSTOMER
// =============================
export const convertLead = (leadId: number) =>
  axiosClient.post(`/crm/leads/${leadId}/convert`);


// =============================
// MARK LOST
// =============================
export const markLeadLost = (leadId: number, reason: string) =>
  axiosClient.patch(`/crm/leads/${leadId}/lost`,{leadId,reason} );


// =============================
// REASSIGN LEAD
// =============================
export const reassignLead = (leadId: number, newUserId: number) =>
  axiosClient.patch(`/crm/leads/${leadId}/reassign`, { newUserId });


// =============================
// REOPEN LOST LEAD
// =============================
export const reopenLead = (leadId: number) =>
  axiosClient.patch(`/crm/leads/${leadId}/reopen`);


// =============================
// DELETE LEAD
// =============================
export const deleteLead = (leadId: number) =>
  axiosClient.delete(`/crm/leads/${leadId}`);

export const getTodayLead = () =>{
  return axiosClient.get(`/crm/leads/today`)
}
