import * as api from "../api/lead.api";
import {
  CreateLeadDto,
  UpdateLeadBasicDto,
  UpdateLeadEvaluationDto,
} from "../dto/lead.dto";

export async function getAllLeads() {
  const res = await api.getAllLeads();
  return res.data.data;
}

// export async function getMyLeads() {
//   const res = await api.getMyLeads();
//   return res.data.data;
// }

export async function getLeadById(leadId: number) {
  const res = await api.getLeadById(leadId);
  return res.data.data;
}

export async function getLeadsByStage(stage: string) {
  const res = await api.getLeadsByStage(stage);
  return res.data.data;
}

export async function createLead(data: CreateLeadDto) {
  const res = await api.createLead(data);
  return res.data.data;
}
export async function updateLeadBasic(leadId: number, data: UpdateLeadBasicDto) {
  const res = await api.updateLeadBasic(leadId, data);
  return res.data.data;
}


export async function updateLeadEvaluation(
  leadId: number,
  data: UpdateLeadEvaluationDto
) {
  const res = await api.updateLeadEvaluation(leadId, data);
  return res.data.data;
}

export async function convertLead(leadId: number) {
  const res = await api.convertLead(leadId);
  return res.data.data;
}


export async function markLeadLost(leadId: number, reason: string ) {
  const res = await api.markLeadLost(leadId, reason);
  return res.data.data;
}

export async function reassignLead(leadId: number, newUserId: number) {
  const res = await api.reassignLead(leadId, newUserId);
  return res.data.data;
}


// =============================
// REOPEN
// =============================
export async function reopenLead(leadId: number) {
  const res = await api.reopenLead(leadId);
  return res.data.data;
}


// =============================
// DELETE LEAD
// =============================
export async function deleteLead(leadId: number) {
  const res = await api.deleteLead(leadId);
  return res.data.data;
}

export async function getLeadToday() {
  const res = await api.getTodayLead();
  return res.data.data
}