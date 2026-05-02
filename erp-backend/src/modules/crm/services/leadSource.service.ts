import { LeadSource } from "../models/leadSource.model";

export const getAllLeadSources = async () => {
  return await LeadSource.findAll({ order: [['name', 'ASC']] });
};

export const createLeadSource = async (data: { name: string, description?: string }) => {
  return await LeadSource.create({
    name: data.name,
    description: data.description || null,
    is_active: true
  });
};

export const updateLeadSource = async (id: number, data: Partial<any>) => {
  const source = await LeadSource.findByPk(id);
  if (!source) throw new Error("Lead Source not found");
  return await source.update(data);
};

export const deleteLeadSource = async (id: number) => {
  const source = await LeadSource.findByPk(id);
  if (!source) throw new Error("Lead Source not found");
  await source.destroy();
  return true;
};
