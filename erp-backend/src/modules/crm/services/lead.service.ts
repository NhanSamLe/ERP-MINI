import * as model from "../../../models/index";
import { Lead } from "../../../models/index";
import { Op } from "sequelize";
import { ActivityType, ActivityRelatedType , PartnerStatus,  LeadStage} from "../../../core/types/enum";
import {addTimeline} from "./timeLine.service"
export function canManage(role: string, userId: number, ownerId: number ) {
  const isManager = ["SALESMANAGER", "ADMIN"].includes(role);
  const isOwner = userId === ownerId;
  return isManager || isOwner;
}


export async function getAllLeads() {
  return Lead.findAll({
    where: { is_deleted: false },
    include: [
      { model: model.User, as: "assignedUser", attributes: ["id", "full_name", "email", "phone"] }
    ],
    order: [["created_at", "DESC"]],
  });
}


export async function getTodayLeads(role: string, userId?: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const where: any = {
    is_deleted: false,
    created_at: { [Op.gte]: today, [Op.lt]: tomorrow }
  };

  if (role === "SALE") {
    if (!userId) throw new Error("Thiếu userId cho SALE");
    where.assigned_to = userId;
  }

  return Lead.findAll({
    where,
    include: [
      { model: model.User, as: "assignedUser", attributes: ["id", "full_name", "email"] }
    ],
    order: [["created_at", "DESC"]],
  });
}

export async function getMyLeads(userId: number) {
  return Lead.findAll({
    where: { assigned_to: userId , is_deleted: false},
    include: [
      { model: model.User, as: "assignedUser", attributes: ["id", "full_name", "email"] },
    ],
    order: [["updated_at", "DESC"]],
  });
}

export async function getLeadById(leadId: number) {
  const lead = await Lead.findOne({
    where: { id: leadId, is_deleted: false },
    include: [{ model: model.User, as: "assignedUser", attributes: ["id", "full_name", "email"] }],
  });

  if (!lead) throw new Error("Lead không tồn tại");
  return lead;
}


export async function createLead(data: {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  assigned_to: number;
}) {
  const lead = await Lead.create({
  ...data,
  stage: LeadStage.NEW,
  is_deleted: false
});
await addTimeline({
  related_type: "lead",
  related_id: lead.id,
  event_type: "lead_created",
  title: "Lead được tạo",
  description: `Lead ${lead.name} đã được tạo`,
  created_by: data.assigned_to
});

return lead;
  
}

export async function updateLeadBasic(leadId: number, data: any, userId: number, role: string) {
  const lead = await Lead.findByPk(leadId);
  if (!lead || lead.is_deleted) throw new Error("Lead không tồn tại");
  if (lead.stage === LeadStage.LOST)
    throw new Error("Lead đã lost, không thể convert");
   if (!canManage(role, userId, lead.assigned_to ?? 1))
    throw new Error("Bạn không có quyền chỉnh sửa lead này");
  await lead.update(data);
  await addTimeline({
  related_type: "lead",
  related_id: leadId,
  event_type: "lead_updated",
  title: "Cập nhật thông tin Lead",
  description: `Lead ${lead.name} đã được cập nhật`,
  created_by: userId
});
  return lead;
}


export async function updateLeadEvaluation(
  userId: number, role :string ,
  data: {
    leadId: number;
    has_budget?: boolean;
    ready_to_buy?: boolean;
    expected_timeline?: string;
    notes?: string;
  }
) {
  const lead = await Lead.findByPk(data.leadId);
  if (!lead || lead.is_deleted) throw new Error("Lead không tồn tại");
  if (lead.stage === LeadStage.LOST)
    throw new Error("Lead đã lost, không thể convert");
  if (!canManage(role, userId, lead.assigned_to ?? 1))
    throw new Error("Bạn không có quyền chỉnh sửa lead này");

  await lead.update({
    has_budget: data.has_budget ?? false,
    ready_to_buy: data.ready_to_buy ?? false,
    expected_timeline: data.expected_timeline ?? "",
    contacted_at: lead.contacted_at || new Date(),
  });
  await addTimeline({
  related_type: "lead",
  related_id: lead.id,
  event_type: "lead_evaluated",
  title: "Đánh giá Lead",
  description: `Lead được đánh giá: budget=${data.has_budget}, ready=${data.ready_to_buy}`,
  created_by: userId
});
  return lead;
}


export async function convertToCustomer(leadId: number, userId: number, role:string) {
  const lead = await Lead.findByPk(leadId);
  if (!lead || lead.is_deleted) throw new Error("Lead không tồn tại");
  if (lead.stage === LeadStage.LOST)
    throw new Error("Lead đã lost, không thể convert");
  if (!canManage(role, userId, lead.assigned_to ?? 1))
    throw new Error("Bạn không có quyền chỉnh sửa lead này");
  await lead.update({
    stage: LeadStage.QUALIFIED,
    qualified_at: new Date(),
    qualified_by: userId
  });

  // Tạo Customer (Partner)
  const customer = await model.Partner.create({
    type: "customer",
    name: lead.name ?? null,
    phone: lead.phone ?? null ,
    email: lead.email ?? null,
    status: PartnerStatus.ACTIVE,
  });
  await addTimeline({
  related_type: "lead",
  related_id: leadId,
  event_type: "lead_converted",
  title: "Lead được chuyển đổi",
  description: `Lead ${lead.name} đã convert thành Customer`,
  created_by: userId
});
  return { lead, customer };
}

export async function markAsLost(
  leadId: number,
  userId: number,
  role: string, 
  reason: string
) {
  const lead = await Lead.findByPk(leadId);
  if (!lead || lead.is_deleted) throw new Error("Lead không tồn tại");

if (!canManage(role, userId, lead.assigned_to ?? 1))
    throw new Error("Bạn không có quyền chỉnh sửa lead này");

  await lead.update({
    stage: "lost",
    lost_reason: reason,
    lost_at: new Date(),
  });
  await addTimeline({
  related_type: "lead",
  related_id: leadId,
  event_type: "lead_lost",
  title: "Lead bị mất",
  description: `Lý do: ${reason}`,
  created_by: userId
 });

  return lead;
}

export async function reassignLead(
  leadId: number,
  newUserId: number,
  managerId: number
) {
  const lead = await Lead.findByPk(leadId);
  if (!lead || lead.is_deleted) throw new Error("Lead không tồn tại");

  const oldUser = lead.assigned_to;

  await lead.update({ assigned_to: newUserId });

    await addTimeline({
    related_type: "lead",
    related_id: leadId,
    event_type: "lead_reassigned",
    title: "Lead được giao lại",
    description: `Từ User ${oldUser} → User ${newUserId}`,
    created_by: managerId
  });


  return Lead.findByPk(leadId, {
    include: [{ model: model.User, as: "assignedUser" }],
  });
}

export async function reopenLead(leadId: number, userId: number) {
  const lead = await Lead.findByPk(leadId);
  if (!lead || lead.is_deleted) throw new Error("Lead không tồn tại");

  if (lead.stage !== LeadStage.LOST)
    throw new Error("Lead phải là LOST mới mở lại");

  await lead.update({
    stage: LeadStage.NEW,
    lost_at: null,
    lost_reason: null,
  });
  await addTimeline({
  related_type: "lead",
  related_id: leadId,
  event_type: "lead_reopened",
  title: "Lead được mở lại",
  description: `Lead ${lead.name} đã được mở lại từ trạng thái LOST`,
  created_by: userId
 });
  return lead;
}
export async function getLeadByStage(stage: LeadStage) {
  return Lead.findAll({
   where: { stage, is_deleted: false },

    include: [
      {
        model: model.User,
        as: "assignedUser",
        attributes: ["id", "full_name", "email", "phone"]
      },
    ],

    order: [["updated_at", "DESC"]],
  });
}

export async function deleteLead(leadId: number, userId: number, role: string) {
  const lead = await Lead.findByPk(leadId);
  if (!lead || lead.is_deleted) throw new Error("Lead không tồn tại");

  if (!canManage(role, userId, lead.assigned_to ?? 1))
    throw new Error("Không có quyền");

  await lead.update({
    is_deleted: true,
    deleted_at: new Date(),
    deleted_by: userId,
  });
  await addTimeline({
  related_type: "lead",
  related_id: leadId,
  event_type: "lead_deleted",
  title: "Lead bị xóa",
  description: `Lead ${lead.name} đã được xóa mềm`,
  created_by: userId
});

  return true;
}

export async function markLeadContacted(leadId: number) {
  const lead = await Lead.findByPk(leadId);
  if (!lead || lead.is_deleted) return;

  if (!lead.contacted_at) {
    await lead.update({ contacted_at: new Date() });
  }
}

