import * as model from "../../../models/index";
import { Op, Sequelize } from "sequelize";
import { TaxType, AppliesTo } from "../../../core/types/enum";
export class CreateTaxRateDto {
  code!: string;
  name!: string;
  type!: TaxType;
  rate!: number;
  applies_to!: AppliesTo;
  is_vat?: boolean;
  effective_date?: Date;
  expiry_date?: Date | null;
  status?: "active" | "inactive"; // có thể define enum luôn nếu muốn
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

export const searchTaxRates = async (search?: string, status?: string) => {
  const where: any = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { code: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status) {
    where.status = status;
  }

  return model.TaxRate.findAll({
    where,
    order: [["id", "ASC"]],
  });
};

export const getAllTaxRates = async () => {
  return model.TaxRate.findAll({
    order: [["id", "ASC"]],
  });
};

export const getActiveTaxRates = async () => {
    return model.TaxRate.findAll({
        where: {    status: "active" }  
    });
};
export const getTaxById = async (id: number) => {
  const tax = await model.TaxRate.findByPk(id);
  if (!tax) throw new Error("Loại thuế không tồn tại.");
  return tax;
};

export const createTaxRate = async (data: CreateTaxRateDto) => {
  if (!data.code || !data.name || data.rate === undefined) {
    throw new Error("Thiếu thông tin bắt buộc.");
  }

  const existing = await model.TaxRate.findOne({ where: { code: data.code } });
  if (existing) throw new Error("Mã thuế đã tồn tại.");

  if (data.rate < 0 || data.rate > 100) {
    throw new Error("Thuế suất phải nằm trong khoảng 0–100%.");
  }

  if (data.effective_date && data.effective_date < new Date()) {
    throw new Error("Ngày hiệu lực không hợp lệ.");
  }

  return model.TaxRate.create({
    ...data,
    status: data.status || "active",
  });
};

export const updateTaxRate = async (id: number, data: UpdateTaxRateDto) => {
  const tax = await model.TaxRate.findByPk(id);
  if (!tax) throw new Error("Loại thuế không tồn tại.");

  if (data.rate && (data.rate < 0 || data.rate > 100)) {
    throw new Error("Thuế suất phải nằm trong khoảng 0–100%.");
  }

  if (data.effective_date && data.effective_date < new Date()) {
    throw new Error("Ngày hiệu lực không hợp lệ.");
  }

  return tax.update(data);
};
export const deleteTaxRate = async (id: number) => {
    const taxRate = await model.TaxRate.findByPk(id);   
    if (!taxRate) {
        throw new Error("Tax rate not found.");
    } 
    await taxRate.destroy();
    return true;
}
export const findTaxRatesByType = async (type: string) => {
    return model.TaxRate.findAll({
        where: { type }
    });
}   
export const findTaxRatesByAppliesTo = async (applies_to: string) => {
    return model.TaxRate.findAll({
        where: { applies_to }
    });
}
