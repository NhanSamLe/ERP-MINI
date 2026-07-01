import { Op } from "sequelize";
import { Partner, PartnerAttrs } from "../models/partner.model";

export interface PartnerFilter {
  type?: "customer" | "supplier" | "internal";
  status?: "active" | "inactive";
  search?: string;
  company_id?: number;
}

export async function getAllPartners(filter: PartnerFilter = {}) {
  const where: any = {};

  // Multi-tenant: chỉ trả về partner thuộc công ty của user hoặc dùng chung (null)
  if (filter.company_id) {
    where.company_id = {
      [Op.or]: [filter.company_id, null]
    };
  }

  if (filter.type) where.type = filter.type;
  if (filter.status) where.status = filter.status;

  if (filter.search) {
    const like = `%${filter.search}%`;
    where[Op.or] = [
      { name: { [Op.like]: like } },
      { phone: { [Op.like]: like } },
      { email: { [Op.like]: like } },
      { tax_code: { [Op.like]: like } },
    ];
  }

  return Partner.findAll({
    where,
    order: [["created_at", "DESC"]],
  });
}

export async function getPartnerById(id: number, companyId?: number) {
  const where: any = { id };
  if (companyId) {
    where.company_id = {
      [Op.or]: [companyId, null]
    };
  }

  const partner = await Partner.findOne({ where });
  if (!partner) throw new Error("Partner not found");
  return partner;
}

export type PartnerCreatePayload = Omit<PartnerAttrs, "id" | "status"> & {
  status?: "active" | "inactive";
  company_id: number;
};

export async function createPartner(payload: PartnerCreatePayload) {
  if (!payload.name || !payload.type) {
    throw new Error("Partner name and type are required");
  }
  if (!payload.company_id) {
    throw new Error("company_id is required");
  }
  return Partner.create(payload as any);
}

export type PartnerUpdatePayload = Partial<Omit<PartnerAttrs, "id" | "company_id">>;

export async function updatePartner(id: number, payload: PartnerUpdatePayload, companyId?: number) {
  const partner = await getPartnerById(id, companyId);
  await partner.update(payload);
  return partner;
}

export async function deletePartner(id: number, companyId?: number) {
  const partner = await getPartnerById(id, companyId);
  await partner.destroy();
}
