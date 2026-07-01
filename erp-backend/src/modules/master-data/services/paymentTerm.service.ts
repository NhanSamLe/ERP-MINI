import { Op } from "sequelize";
import { PaymentTerm } from "../../../models";

export class CreatePaymentTermDto {
  name!: string;
  code?: string | null;
  days!: number;
  description?: string | null;
  company_id?: number | null;
}

export class UpdatePaymentTermDto {
  name?: string;
  code?: string | null;
  days?: number;
  description?: string | null;
  is_active?: boolean;
}

function companyWhere(companyId?: number) {
  if (!companyId) return { company_id: null };
  return { [Op.or]: [{ company_id: companyId }, { company_id: null }] };
}

export const getAllPaymentTerms = async (companyId?: number) => {
  return PaymentTerm.findAll({
    where: companyWhere(companyId) as any,
    order: [["company_id", "ASC"], ["days", "ASC"]],
  });
};

export const getActivePaymentTerms = async (companyId?: number) => {
  return PaymentTerm.findAll({
    where: { ...(companyWhere(companyId) as any), is_active: true },
    order: [["days", "ASC"]],
  });
};

export const getPaymentTermById = async (id: number) => {
  const term = await PaymentTerm.findByPk(id);
  if (!term) throw new Error("Điều khoản thanh toán không tồn tại.");
  return term;
};

export const createPaymentTerm = async (data: CreatePaymentTermDto) => {
  if (!data.name || data.days === undefined) throw new Error("Tên và số ngày là bắt buộc.");

  if (data.code) {
    const exist = await PaymentTerm.findOne({
      where: { code: data.code, company_id: data.company_id ?? null },
    });
    if (exist) throw new Error("Mã điều khoản thanh toán đã tồn tại.");
  }

  return PaymentTerm.create({
    name: data.name,
    code: data.code ?? null,
    days: data.days,
    description: data.description ?? null,
    company_id: data.company_id ?? null,
    is_active: true,
  });
};

export const updatePaymentTerm = async (id: number, data: UpdatePaymentTermDto, companyId?: number) => {
  const term = await PaymentTerm.findByPk(id);
  if (!term) throw new Error("Điều khoản thanh toán không tồn tại.");
  if (term.company_id === null) throw new Error("Không thể sửa điều khoản hệ thống.");
  if (companyId && term.company_id !== companyId) throw new Error("Điều khoản thanh toán không tồn tại.");

  return term.update(data);
};

export const deletePaymentTerm = async (id: number, companyId?: number) => {
  const term = await PaymentTerm.findByPk(id);
  if (!term) throw new Error("Điều khoản thanh toán không tồn tại.");
  if (term.company_id === null) throw new Error("Không thể xóa điều khoản hệ thống.");
  if (companyId && term.company_id !== companyId) throw new Error("Điều khoản thanh toán không tồn tại.");
  await term.destroy();
  return true;
};
