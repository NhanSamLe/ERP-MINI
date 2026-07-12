import * as model from "../../../models/index";
import { Lead } from "../../../models/index";
import { Op } from "sequelize";
import { sequelize } from "../../../config/db";
import { ActivityType, ActivityRelatedType, PartnerStatus, LeadStage } from "../../../core/types/enum";
import { addTimeline } from "./timeLine.service"
import * as XLSX from "xlsx";
import { notificationService } from "../../../core/services/notification.service";
import { calculateLeadScore } from "./scoringRule.service";
import { getCompanyBranchIds } from "../../finance/services/companyScope.service";

export function canManage(role: string, userId: number, ownerId: number) {
  const isManager = ["SALESMANAGER", "ADMIN"].includes(role);
  const isOwner = userId === ownerId;
  return isManager || isOwner;
}


export async function getAllLeads(user: any) {
  const where: any = { is_deleted: false };
  const companyBranchIds = await getCompanyBranchIds(user);

  if (user.role === "ADMIN" || user.role === "CEO") {
    where.branch_id = { [Op.in]: companyBranchIds };
  } else if (user.role === "SALESMANAGER" || user.role === "BRANCH_MANAGER") {
    if (user.branch_id && companyBranchIds.includes(Number(user.branch_id))) {
      where.branch_id = user.branch_id;
    } else {
      where.branch_id = { [Op.in]: companyBranchIds };
    }
  } else {
    if (user.branch_id && companyBranchIds.includes(Number(user.branch_id))) {
      where.branch_id = user.branch_id;
    } else {
      where.branch_id = { [Op.in]: companyBranchIds };
    }
    where.assigned_to = user.id;
  }
  return Lead.findAll({
    where,
    include: [
      { model: model.User, as: "assignedUser", attributes: ["id", "full_name", "email", "phone"] },
      { model: model.LeadSource, as: "leadSource" },
      { model: model.Partner, as: "customer" }
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

  if (role === "SALES") {
    if (!userId) throw new Error("Thiếu userId cho SALE");
    where.assigned_to = userId;
  }

  return Lead.findAll({
    where,
    include: [
      { model: model.User, as: "assignedUser", attributes: ["id", "full_name", "email"] },
      { model: model.LeadSource, as: "leadSource" },
      { model: model.Partner, as: "customer" },
      { model: model.Branch, as: "branch", attributes: ["id", "name", "code"] },
    ],
    order: [["created_at", "DESC"]],
  });
}

export async function getMyLeads(userId: number) {
  return Lead.findAll({
    where: { assigned_to: userId, is_deleted: false },
    include: [
      { model: model.User, as: "assignedUser", attributes: ["id", "full_name", "email"] },
      { model: model.LeadSource, as: "leadSource" },
      { model: model.Partner, as: "customer" },
      { model: model.Branch, as: "branch", attributes: ["id", "name", "code"] },
    ],
    order: [["updated_at", "DESC"]],
  });
}

export async function getLeadById(leadId: number, user?: any) {
  const lead = await Lead.findOne({
    where: { id: leadId, is_deleted: false },
    include: [
      {
        model: model.User,
        as: "assignedUser",
        attributes: ["id", "full_name", "email"],
      },
      {
        model: model.LeadSource,
        as: "leadSource",
      },
      {
        model: model.Partner,
        as: "customer",
      },
      {
        model: model.Branch,
        as: "branch",
        attributes: ["id", "name", "code"],
      },
      {
        model: model.Opportunity,
        as: "opportunities",
        include: [
          {
            model: model.User,
            as: "owner",
            attributes: ["id", "full_name", "email"],
          },
          {
            model: model.Partner,
            as: "customer",
          },
          {
            model: model.Currency,
            as: "currency",
            attributes: ["id", "code", "symbol", "name"],
          },
        ],
      },
    ],
    order: [
      [{ model: model.Opportunity, as: "opportunities" }, "created_at", "DESC"],
    ],
  });

  if (!lead) throw new Error("Lead không tồn tại");
  // Kiểm tra quyền nếu có truyền user
  if (user) {
    const companyBranchIds = await getCompanyBranchIds(user);
    if (!companyBranchIds.includes(Number(lead.branch_id))) {
      throw new Error("Access denied: cross-company");
    }
    if (user.role !== "ADMIN" && user.role !== "CEO" && lead.branch_id !== user.branch_id)
      throw new Error("Access denied: cross-branch");
    if (user.role === "SALES" && lead.assigned_to !== user.id)
      throw new Error("Access denied: bạn không quản lý lead này");
  }
  return lead;
}



export async function createLead(data: {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  source_id?: number | null;
  company_name?: string | null;
  job_title?: string | null;
  industry?: string | null;
  company_size?: string | null;
  annual_revenue?: number | null;
  branch_id?: number | null;
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

  // Tự động tính điểm sau khi tạo
  await calculateLeadScore(lead.id).catch(e => console.error("Score Error", e));

  return getLeadById(lead.id);

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

  // Tự động tính lại điểm sau khi cập nhật cơ bản
  await calculateLeadScore(lead.id).catch(e => console.error("Score Error", e));

  return getLeadById(leadId);
}


export async function updateLeadEvaluation(
  userId: number, role: string,
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
    last_activity_date: new Date(),
  });
  await addTimeline({
    related_type: "lead",
    related_id: lead.id,
    event_type: "lead_evaluated",
    title: "Đánh giá Lead",
    description: `Lead được đánh giá: budget=${data.has_budget}, ready=${data.ready_to_buy}`,
    created_by: userId
  });
  await calculateLeadScore(lead.id).catch(e => console.error("Score Error", e));
  return getLeadById(lead.id);
}


export async function convertToCustomer(leadId: number, userId: number, role: string, companyId?: number) {
  const lead = await Lead.findByPk(leadId);
  if (!lead || lead.is_deleted) throw new Error("Lead không tồn tại");
  if (lead.stage === LeadStage.LOST)
    throw new Error("Lead đã lost, không thể convert");
  if (!canManage(role, userId, lead.assigned_to ?? 1))
    throw new Error("Bạn không có quyền chỉnh sửa lead này");

  let customer: any = null;
  if ((lead as any).customer_id) {
    customer = await model.Partner.findByPk((lead as any).customer_id);
  }

  if (!customer) {
    const duplicateConditions = [];
    if (lead.email) duplicateConditions.push({ email: lead.email });
    if (lead.phone) duplicateConditions.push({ phone: lead.phone });

    if (duplicateConditions.length > 0) {
      const existingCustomer = await model.Partner.findOne({
        where: {
          type: "customer",
          [Op.or]: duplicateConditions,
        },
      });

      if (existingCustomer) {
        throw new Error(
          `Email hoặc số điện thoại đã tồn tại ở Customer "${existingCustomer.name}" (#${existingCustomer.id}). Vui lòng kiểm tra trước khi chuyển đổi Lead.`
        );
      }

      const existingLead = await Lead.findOne({
        where: {
          id: { [Op.ne]: lead.id },
          is_deleted: false,
          [Op.or]: duplicateConditions,
        },
      });

      if (existingLead) {
        throw new Error(
          `Email hoặc số điện thoại đã trùng với Lead "${existingLead.name}" (#${existingLead.id}). Vui lòng xử lý trùng lặp trước khi chuyển đổi.`
        );
      }
    }

    customer = await model.Partner.create({
      type: "customer",
      is_customer: true,
      name: lead.company_name || lead.name || "Unknown",
      contact_person: lead.company_name ? lead.name : null,
      phone: lead.phone ?? null,
      email: lead.email ?? null,
      industry: lead.industry ?? null,
      company_size: lead.company_size ?? null,
      sales_person_id: lead.assigned_to ?? userId,
      // Gắn company_id để customer mới thuộc đúng công ty — nếu thiếu, danh sách
      // partner (lọc theo company_id) sẽ không thấy customer này, khiến trang
      // tạo Opportunity không preselect được customer vừa chuyển đổi.
      company_id: companyId ?? null,
      status: PartnerStatus.ACTIVE,
    });
  }

  await lead.update({
    stage: LeadStage.QUALIFIED,
    qualified_at: new Date(),
    qualified_by: userId,
    customer_id: customer.id,
  });
  await addTimeline({
    related_type: "lead",
    related_id: leadId,
    event_type: "lead_converted",
    title: "Lead được chuyển đổi",
    description: `Lead ${lead.name} đã convert thành Customer`,
    created_by: userId
  });
  await calculateLeadScore(lead.id).catch(e => console.error("Score Error", e));
  return { lead: await getLeadById(lead.id), customer };
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

  await calculateLeadScore(lead.id).catch(e => console.error("Score Error", e));
  return getLeadById(leadId);
}

export async function reassignLead(
  leadId: number,
  newUserId: number,
  managerId: number,
  managerRole: string
) {
  if (!["SALESMANAGER", "ADMIN"].includes(managerRole))
    throw new Error("Chỉ Sales Manager hoặc Admin mới có thể chuyển đổi lead");
  const lead = await Lead.findByPk(leadId);
  if (!lead || lead.is_deleted) throw new Error("Lead không tồn tại");

  const oldUser = lead.assigned_to;

  await lead.update({ assigned_to: newUserId });

  await addTimeline({
    related_type: "lead",
    related_id: leadId,
    event_type: "lead_reassigned",
    title: "Lead được giao lại",
    description: `Từ User ${oldUser} → User ${newUserId} (bởi Manager ${managerId})`,
    created_by: managerId
  });

  await calculateLeadScore(lead.id).catch(e => console.error("Score Error", e));
  return getLeadById(leadId);
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
  await calculateLeadScore(lead.id).catch(e => console.error("Score Error", e));
  return getLeadById(leadId);
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
      { model: model.LeadSource, as: "leadSource" },
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

export async function bulkCreateLeads(
  items: Array<{
    name: string;
    email?: string;
    phone?: string;
    source_id?: number | null;
    company_name?: string | null;
    job_title?: string | null;
    industry?: string | null;
    company_size?: string | null;
    annual_revenue?: number | null;
  }>,
  userId: number,
  branchId: number | null
) {
  const successes: any[] = [];
  const errors: { index: number; name: string; message: string }[] = [];

  let idx = 0;
  for (const item of items) {
    try {
      const payload: Parameters<typeof createLead>[0] = {
        name: item.name,
        assigned_to: userId,
        branch_id: branchId,
      };
      if (item.email) payload.email = item.email;
      if (item.phone) payload.phone = item.phone;
      if (item.source_id != null) payload.source_id = item.source_id;
      if (item.company_name != null) payload.company_name = item.company_name;
      if (item.job_title != null) payload.job_title = item.job_title;
      if (item.industry != null) payload.industry = item.industry;
      if (item.company_size != null) payload.company_size = item.company_size;
      if (item.annual_revenue != null) payload.annual_revenue = item.annual_revenue;

      const lead = await createLead(payload);
      successes.push(lead);
    } catch (e: any) {
      errors.push({ index: idx, name: item.name, message: e.message });
    }
    idx++;
  }

  return { successCount: successes.length, errorCount: errors.length, errors, leads: successes };
}

export async function markLeadContacted(leadId: number) {
  const lead = await Lead.findByPk(leadId);
  if (!lead || lead.is_deleted) return;

  if (!lead.contacted_at) {
    await lead.update({ contacted_at: new Date(), last_activity_date: new Date() });
  } else {
    await lead.update({ last_activity_date: new Date() });
  }
  await calculateLeadScore(lead.id).catch(e => console.error("Score Error", e));
}

export async function importLeadsFromExcel(fileBuffer: Buffer, user: any, app: any) {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("File Excel không có sheet nào");
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) throw new Error("Lỗi đọc sheet");
  const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

  if (!jsonData.length) {
    throw new Error("File Excel trống hoặc không đúng định dạng");
  }

  const getCell = (row: Record<string, any>, keys: string[]) => {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return undefined;
  };

  // Cache tên → id Lead Source đã tra/tạo trong lượt import này, tránh query lặp lại.
  const sourceCache = new Map<string, number>();
  const resolveSourceId = async (rawName: string): Promise<number> => {
    const key = rawName.trim().toLowerCase();
    const cached = sourceCache.get(key);
    if (cached) return cached;

    let found = await model.LeadSource.findOne({
      where: sequelize.where(sequelize.fn("LOWER", sequelize.col("name")), key),
    });
    if (!found) {
      found = await model.LeadSource.create({ name: rawName.trim(), description: null, is_active: true });
    }
    sourceCache.set(key, found.id);
    return found.id;
  };

  const leadsToCreate: any[] = [];
  const errors = [];

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    const name = getCell(row, ["Name", "Tên Lead", "Ten Lead", "Tên", "Ten"]);
    const email = getCell(row, ["Email"]);
    const phone = getCell(row, ["Phone", "SĐT", "SDT", "Số điện thoại", "So dien thoai"]);
    const sourceName = getCell(row, ["Source", "Nguồn Lead", "Nguon Lead", "Nguồn", "Nguon"]) || "Excel Import";
    const company_name = getCell(row, ["Company", "Company Name", "Tên Công Ty", "Công ty", "Cong ty", "Tên công ty", "Ten cong ty"]);
    const job_title = getCell(row, ["Job Title", "Chức Vụ", "Chức vụ", "Chuc vu", "Title"]);
    const industry = getCell(row, ["Industry", "Ngành Nghề", "Ngành", "Nganh", "Ngành nghề", "Nganh nghe"]);
    const company_size = getCell(row, ["Company Size", "Quy Mô", "Quy mô", "Quy mo", "Size"]);
    const annualRevenue = getCell(row, ["Annual Revenue", "Doanh Thu/Năm (VNĐ)", "Doanh thu", "Doanh thu năm", "Doanh thu nam"]);

    if (!name) {
      errors.push(`Dòng ${i + 2}: Thiếu tên Lead`);
      continue;
    }

    const source_id = await resolveSourceId(String(sourceName));

    leadsToCreate.push({
      name,
      email,
      phone,
      source: String(sourceName),
      source_id,
      company_name,
      job_title,
      industry,
      company_size,
      annual_revenue: annualRevenue !== undefined ? Number(annualRevenue) || null : null,
      branch_id: user.branch_id ?? null,
      assigned_to: user.id,
      stage: LeadStage.NEW,
      is_deleted: false,
    });
  }

  if (leadsToCreate.length > 0) {
    const createdLeads = await Lead.bulkCreate(leadsToCreate);
    for (const lead of createdLeads) {
      await addTimeline({
        related_type: "lead",
        related_id: lead.id,
        event_type: "lead_imported",
        title: "Lead imported",
        description: `Lead ${lead.name} was imported from Excel`,
        created_by: user.id,
      });
      await calculateLeadScore(lead.id).catch(e => console.error("Score Error", e));
    }

    // Send Notification
    try {
      await notificationService.createNotification({
        type: "SYSTEM", // Need to ensure type exists in Enum
        referenceType: "LEAD",
        referenceId: user.id, // Or 0
        referenceNo: "IMPORT",
        branchId: user.branch_id || 1,
        io: app.get("io"),
        submitterId: user.id,
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }

  return {
    successCount: leadsToCreate.length,
    errorCount: errors.length,
    errors,
  };
}

