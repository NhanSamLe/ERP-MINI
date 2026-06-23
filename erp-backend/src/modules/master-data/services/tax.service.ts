import * as model from "../../../models/index";
import { Op } from "sequelize";
import { TaxType, AppliesTo } from "../../../core/types/enum";
import { Transaction } from "sequelize";

export class CreateTaxRateDto {
  code!: string;
  name!: string;
  type!: TaxType;
  rate!: number;
  applies_to!: AppliesTo;
  is_vat?: boolean;
  effective_date?: Date;
  expiry_date?: Date | null;
  status?: "active" | "inactive";
  company_id?: number | null;
}

export class UpdateTaxRateDto {
  name?: string;
  type?: TaxType;
  rate?: number;
  applies_to?: AppliesTo;
  is_vat?: boolean;
  effective_date?: Date;
  expiry_date?: Date | null;
  status?: "active" | "inactive";
}

function companyWhere(companyId?: number) {
  if (!companyId) return { company_id: null };
  return { [Op.or]: [{ company_id: companyId }, { company_id: null }] };
}

export const searchTaxRates = async (search?: string, status?: string, companyId?: number) => {
  const where: any = { ...companyWhere(companyId) };
  const conditions: any[] = [companyWhere(companyId)];

  if (search) {
    conditions.push({ [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { code: { [Op.like]: `%${search}%` } }] });
  }
  if (status) {
    conditions.push({ status });
  }

  return model.TaxRate.findAll({
    where: conditions.length > 1 ? { [Op.and]: conditions } : (conditions[0] as any),
    order: [["id", "ASC"]],
  });
};

export const getAllTaxRates = async (companyId?: number) => {
  return model.TaxRate.findAll({
    where: companyWhere(companyId) as any,
    order: [["company_id", "ASC"], ["id", "ASC"]],
  });
};

export const getActiveTaxRates = async (companyId?: number) => {
  return model.TaxRate.findAll({
    where: { ...(companyWhere(companyId) as any), status: "active" },
  });
};

export const getTaxById = async (id: number) => {
  const tax = await model.TaxRate.findByPk(id);
  if (!tax) throw new Error("Loại thuế không tồn tại.");
  return tax;
};

export const createTaxRate = async (data: CreateTaxRateDto, t?: Transaction) => {
  if (!data.code || !data.name || data.rate === undefined) {
    throw new Error("Thiếu thông tin bắt buộc.");
  }

  const findOptions: any = { where: { code: data.code, company_id: data.company_id ?? null } };
  if (t) findOptions.transaction = t;
  const existing = await model.TaxRate.findOne(findOptions);
  if (existing) throw new Error("Mã thuế đã tồn tại.");

  if (data.rate < 0 || data.rate > 100) {
    throw new Error("Thuế suất phải nằm trong khoảng 0–100%.");
  }

  const createOptions: any = {};
  if (t) createOptions.transaction = t;
  return model.TaxRate.create(
    { ...data, company_id: data.company_id ?? null, status: data.status || "active" },
    createOptions
  );
};

export const updateTaxRate = async (id: number, data: UpdateTaxRateDto, companyId?: number) => {
  const tax = await model.TaxRate.findByPk(id);
  if (!tax) throw new Error("Loại thuế không tồn tại.");
  if (tax.company_id === null) throw new Error("Không thể sửa thuế suất hệ thống.");
  if (companyId && tax.company_id !== companyId) throw new Error("Loại thuế không tồn tại.");

  if (data.rate && (data.rate < 0 || data.rate > 100)) {
    throw new Error("Thuế suất phải nằm trong khoảng 0–100%.");
  }

  return tax.update(data);
};

export const deleteTaxRate = async (id: number, companyId?: number) => {
  const taxRate = await model.TaxRate.findByPk(id);
  if (!taxRate) throw new Error("Loại thuế không tồn tại.");
  if (taxRate.company_id === null) throw new Error("Không thể xóa thuế suất hệ thống.");
  if (companyId && taxRate.company_id !== companyId) throw new Error("Loại thuế không tồn tại.");
  await taxRate.destroy();
  return true;
};

export const findTaxRatesByType = async (type: string, companyId?: number) => {
  return model.TaxRate.findAll({
    where: { ...(companyWhere(companyId) as any), type },
  });
};

export const findTaxRatesByAppliesTo = async (applies_to: string, companyId?: number) => {
  return model.TaxRate.findAll({
    where: { ...(companyWhere(companyId) as any), applies_to },
  });
};
