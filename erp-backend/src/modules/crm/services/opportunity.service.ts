import * as model from "../../../models";
import { Opportunity } from "../../../models";
import { Op } from "sequelize";
import { ActivityType, ActivityRelatedType , OpportunityStage} from "../../../core/types/enum";
import { Lead } from "../../../models";
import {canManage} from "./lead.service";
import { addTimeline } from "./timeLine.service";

export async function getAllOpportunities() {
  return Opportunity.findAll({
    where: { is_deleted: false },
    include: [
      { model: model.User, as: "owner", attributes: ["id", "full_name", "email", "phone"] },
      { model: model.Lead, as: "lead" },
      { model: model.Partner, as: "customer" },
    ],
    order: [["created_at", "DESC"]],
  });
}
export async function getOpportunityById(oppId: number) {
  const opp = await Opportunity.findOne({
    where: { id: oppId, is_deleted: false },
    include: [
      {
        model: model.User,
        as: "owner",
        attributes: ["id", "full_name", "email", "phone"],
      },
      { model: model.Lead, as: "lead" },
      { model: model.Partner, as: "customer" },
    ],
  });

  if (!opp) throw new Error("Opportunity không tồn tại");
  return opp;
}

export async function createOpportunity(data: {
  lead_id?: number;
  customer_id?: number;
  owner_id: number;
  name: string;
  expected_value?: number;
  probability?: number;
  stage?: OpportunityStage;
  closing_date?: Date | null;
}) {
  const opp = await Opportunity.create({
    ...data,
    stage: data.stage || "prospecting",
    closing_date: data.closing_date || null,
  });

   await addTimeline({
    related_type: "opportunity",
    related_id: opp.id,
    event_type: "opportunity_created",
    title: "Opportunity được tạo",
    description: `Deal ${opp.name} đã được tạo`,
    created_by: data.owner_id,
  });
  return opp;
}

// ===============================
// 2. Update thông tin Deal
// ===============================
export async function updateOpportunity(
  
  userId: number, role: string,
  payload: {
    oppId: number,
    name?: string;
    expected_value?: number;
    probability?: number;
    closing_date?: Date | null;
    notes?: string;
  }
) {
  const opp = await Opportunity.findOne({
    where: { id: payload.oppId, is_deleted: false },
  });
  if (!opp) throw new Error("Opportunity không tồn tại");

  // Chỉ owner mới được update
 if (!canManage(role, userId, opp.owner_id?? 1))
    throw new Error("Bạn không có quyền chỉnh sửa deal này");

  await opp.update({
    name: payload.name ?? opp.name,
    expected_value: payload.expected_value ?? opp.expected_value ?? null,
    probability: payload.probability ?? opp.probability ?? null,
    closing_date: payload.closing_date ?? opp.closing_date ?? null,
  });
   await addTimeline({
    related_type: "opportunity",
    related_id: payload.oppId,
    event_type: "opportunity_updated",
    title: "Cập nhật Opportunity",
    description: `Deal ${opp.name} đã được cập nhật`,
    created_by: userId,
  });
  return opp;
}

// ===============================
// 3. Chuyển Stage → Negotiation
// ===============================
export async function moveToNegotiation(oppId: number, userId: number,role :string) {
 const opp = await Opportunity.findOne({
    where: { id: oppId, is_deleted: false },
  });
  if (!opp) throw new Error("Opportunity không tồn tại");

// Chỉ owner mới được update
 if (!canManage(role, userId, opp.owner_id?? 1))
    throw new Error("Bạn không có quyền chỉnh sửa deal này");

  await opp.update({ stage: "negotiation" });

  await addTimeline({
    related_type: "opportunity",
    related_id: oppId,
    event_type: "stage_changed",
    title: "Chuyển sang Negotiation",
    description: `Deal ${opp.name} chuyển sang giai đoạn thương lượng`,
    created_by: userId,
  });

 

  return opp;
}

// ===============================
// 4. Đánh thắng Deal → WON
// Tạo Customer nếu là lần đầu
// ===============================
export async function markWon(oppId: number, userId: number,role:string) {
  const opp = await Opportunity.findOne({
    where: { id: oppId, is_deleted: false },
  });
  if (!opp) throw new Error("Opportunity không tồn tại");

  // Chỉ owner mới được update
 if (!canManage(role, userId, opp.owner_id?? 1))
    throw new Error("Bạn không có quyền chỉnh sửa deal này");
  if (opp.stage === OpportunityStage.WON) throw new Error("Deal đã WON rồi");
  // Cập nhật stage Won
  await opp.update({
    stage: "won",
    closing_date: new Date(),
  });

  let customer = null;

  // Nếu chưa có customer → tạo mới
  if (!opp.customer_id) {
    const lead = await Lead.findByPk(opp.lead_id);
    if (!lead) throw new Error("Lead gốc không tồn tại");

    customer = await model.Partner.create({
      name: lead.name,
      email: lead.email ?? null,
      phone: lead.phone ?? null,
      type: "customer", 
    });
    await opp.update({ customer_id: customer.id });
  } else {
    // Nếu đã có customer → lấy ra trả về luôn
    customer = await model.Partner.findByPk(opp.customer_id);
  }

  // Ghi activity
  await addTimeline({
    related_type: "opportunity",
    related_id: oppId,
    event_type: "opportunity_won",
    title: "Deal Won 🎉",
    description: `Deal ${opp.name} đã chốt thành công`,
    created_by: userId,
  });

  return { opp, customer };
}


// 5. Đánh mất Deal → LOST
export async function markLost(
  userId: number, role: string,
  payload: {
    oppId: number,
    reason: string
  }
) {
  const opp = await Opportunity.findOne({
    where: { id: payload.oppId, is_deleted: false },
  });
  if (!opp) throw new Error("Opportunity không tồn tại");

 // Chỉ owner mới được update
 if (!canManage(role, userId, opp.owner_id?? 1))
    throw new Error("Bạn không có quyền chỉnh sửa deal này");

  await opp.update({
    stage: "lost",
    loss_reason: payload.reason,
    closing_date: new Date(),
  });

  await addTimeline({
    related_type: "opportunity",
    related_id: payload.oppId,
    event_type: "opportunity_lost",
    title: "Deal Lost",
    description: `Lý do: ${payload.reason}`,
    created_by: userId,
  });

  return opp;
}

// 6. Reassign Opportunity cho sales khác

export async function reassignOpportunity(
  oppId: number,
  newUserId: number,
  managerId: number
) {
  const opp = await Opportunity.findByPk(oppId);
  if (!opp) throw new Error("Opportunity không tồn tại");

  const old = opp.owner_id;

  await opp.update({ owner_id: newUserId });

  await addTimeline({
    related_type: "opportunity",
    related_id: oppId,
    event_type: "opportunity_reassigned",
    title: "Opportunity reassigned",
    description: `Từ User ${old} → User ${newUserId}`,
    created_by: managerId,
  });

  return opp;
}

// ===============================
// 7. Lấy danh sách Deal của Sales
// ===============================
export async function getMyOpportunities(
  userId: number,
  stage?: OpportunityStage
) {
  const where: any = {
    owner_id: userId,
    is_deleted: false,
  };
  if (stage) where.stage = stage;

  return Opportunity.findAll({
    where,
    include: [
      {
        model: model.User,
        as: "owner",
        attributes: ["id", "full_name", "email", "phone"],
      },
      { model: model.Lead, as: "lead" },
      { model: model.Partner, as: "customer" },
    ],
    order: [["updated_at", "DESC"]],
  });
}

// ===============================
// 8. Dashboard Pipeline
// ===============================
export async function getPipelineSummary() {
  return Opportunity.findAll({
    attributes: [
      "stage",
      [model.sequelize.fn("COUNT", model.sequelize.col("id")), "count"],
      [model.sequelize.fn("SUM", model.sequelize.col("expected_value")), "total_value"],
    ],
    group: ["stage"],
    raw: true,
  });
}

export async function deleteOpportunity(
  oppId: number,
  userId: number,
  role: string
) {
  const opp = await Opportunity.findOne({
    where: { id: oppId, is_deleted: false },
  });
  if (!opp) throw new Error("Opportunity không tồn tại");

  if (!canManage(role, userId, opp.owner_id ?? 1))
    throw new Error("Bạn không có quyền chỉnh sửa deal này");

  await opp.update({ is_deleted: true });

  await addTimeline({
    related_type: "opportunity",
    related_id: oppId,
    event_type: "opportunity_deleted",
    title: "Opportunity bị xóa",
    description: `Deal ${opp.name} đã bị xóa`,
    created_by: userId,
  });

  return true;
}


export async function getClosingOpportunitiesThisMonth(userId?: number) {
  const now = new Date();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const where: any = {
    is_deleted: false,
    stage: { [Op.in]: ["prospecting", "negotiation"] },
    closing_date: {
      [Op.gte]: startOfMonth,
      [Op.lte]: endOfMonth,
    },
  };

  if (userId) where.owner_id = userId;

  return Opportunity.findAll({
    where,
    include: [
      {
        model: model.User,
        as: "owner",
        attributes: ["id", "full_name", "email", "phone"],
      },
      { model: model.Lead, as: "lead" },
      { model: model.Partner, as: "customer" },
    ],
    order: [["closing_date", "ASC"]],
  });
}

export async function getUnclosedOpportunities(userId?: number) {
  const where: any = {
    is_deleted: false,
    stage: { [Op.in]: ["prospecting", "negotiation"] },
  };

  if (userId) where.owner_id = userId;

  return Opportunity.findAll({
    where,
    include: [
      {
        model: model.User,
        as: "owner",
        attributes: ["id", "full_name", "email", "phone"],
      },
      { model: model.Lead, as: "lead" },
      { model: model.Partner, as: "customer" },
    ],
    order: [["updated_at", "DESC"]],
  });
}
export async function getOpportunitiesByLead(leadId: number) {
  return Opportunity.findAll({
    where: { lead_id: leadId, is_deleted: false },
    include: [
      { model: Lead, as: "lead" },
      {
        model: model.User,
        as: "owner",
        attributes: ["id", "full_name", "email", "phone"],
      },
      { model: model.Partner, as: "customer" }
    ],
    order: [["created_at", "DESC"]],
  });
}