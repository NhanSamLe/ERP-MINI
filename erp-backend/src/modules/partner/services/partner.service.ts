// master-data/partner/services/partner.service.ts
import { Op } from "sequelize";
import { Partner, PartnerAttrs } from "../models/partner.model";

export interface PartnerFilter {
  type?: "customer" | "supplier" | "internal";
  status?: "active" | "inactive";
  search?: string;
}

export async function getAllPartners(filter: PartnerFilter = {}) {
  const where: any = {};

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

export async function getPartnerById(id: number) {
  const partner = await Partner.findByPk(id);
  if (!partner) throw new Error("Partner not found");
  return partner;
}

export type PartnerCreatePayload = Omit<PartnerAttrs, "id" | "status"> & {
  status?: "active" | "inactive";
};

export async function createPartner(payload: PartnerCreatePayload) {
  if (!payload.name || !payload.type) {
    throw new Error("Partner name and type are required");
  }
  return Partner.create(payload as any);
}

export type PartnerUpdatePayload = Partial<Omit<PartnerAttrs, "id">>;

export async function updatePartner(id: number, payload: PartnerUpdatePayload) {
  const partner = await getPartnerById(id);
  await partner.update(payload);
  return partner;
}

export async function deletePartner(id: number) {
  const partner = await getPartnerById(id);
  await partner.destroy(); // hoặc update status = inactive
}
