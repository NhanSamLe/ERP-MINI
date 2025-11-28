import * as api from "../api/opportunity.api";
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
} from "../dto/opportunity.dto";

//  Lấy tất cả cơ hội
export async function getAllOpportunities() {
  const res = await api.getAllOpportunities();
  return res.data.data;
}
//  Lấy cơ hội theo ID
export async function getOpportunityById(oppId: number) {
  const res = await api.getOpportunityById(oppId);
  return res.data.data;
}
//  Tạo cơ hội
export async function createOpportunity(data: CreateOpportunityDto) {
  const res = await api.createOpportunity(data);
  return res.data.data;
}
//  Cập nhật cơ hội
export async function updateOpportunity(
  data: UpdateOpportunityDto
) {
  const res = await api.updateOpportunity( data);
  return res.data.data;
}
//  Chuyển sang giai đoạn đàm phán
export async function moveToNegotiation(oppId: number) {
  const res = await api.moveToNegotiation(oppId);
  return res.data.data;
}
//  Đánh dấu thắng
export async function markWon(oppId: number) {
  const res = await api.markWon(oppId);
  return res.data.data;
}
//  Đánh dấu thua
export async function markLost(oppId: number, reason: string) {
  const res = await api.markLost(oppId, reason);
  return res.data.data;
}

//  Chuyển giao cơ hội
export async function reassignOpportunity(oppId: number, newUserId: number) {
  const res = await api.reassignOpportunity(oppId, newUserId);
  return res.data.data;
}
//   Lấy cơ hội của tôi
// export async function getMyOpportunities() {
//   const res = await api.getMyOpportunities();
//   return res.data.data;
// }
//  Lấy tóm tắt pipeline
export async function getPipelineSummary() {
  const res = await api.getPipelineSummary();
  return res.data.data;
}
export async function deleteOpportunity(oppId :number ) {
  const res = await api.deleteOpportunity(oppId);
  return res.data.data
}
export async function getClosingOpportunitiesThisMonth() {
  const res = await api.getClosingThisMonth();
  return res.data.data
}
export async function getUnClosingOpportunities() {
  const res = await api.getUnclosedOpportunities();
  return res.data.data
}