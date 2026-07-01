import * as model from '../../../models/index';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../../../core/utils/uploadCloudinary';
import { ensureGlSetup } from '../../finance/services/glSetup.service';

export async function getSetupStatus(companyId: number) {
  const company = await model.Company.findByPk(companyId, {
    attributes: ['id', 'name', 'is_setup_done', 'logo_url', 'industry', 'employee_count'],
  });
  if (!company) throw new Error('Company not found');
  return {
    is_setup_done: company.is_setup_done,
    company_name: company.name,
    logo_url: company.logo_url ?? null,
  };
}

export async function completeStep1(companyId: number, data: {
  company_name?: string;
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  phone?: string;
  email?: string;
  website?: string;
}) {
  const company = await model.Company.findByPk(companyId);
  if (!company) throw new Error('Company not found');
  await company.update({
    ...(data.company_name ? { name: data.company_name } : {}),
    ...(data.address !== undefined ? { address: data.address } : {}),
    ...(data.province !== undefined ? { province: data.province } : {}),
    ...(data.district !== undefined ? { district: data.district } : {}),
    ...(data.ward !== undefined ? { ward: data.ward } : {}),
    ...(data.phone !== undefined ? { phone: data.phone } : {}),
    ...(data.email !== undefined ? { email: data.email } : {}),
    ...(data.website !== undefined ? { website: data.website } : {}),
  } as any);
  return company;
}

export async function updateCompanyLogo(companyId: number, buffer: Buffer) {
  const company = await model.Company.findByPk(companyId);
  if (!company) throw new Error('Company not found');
  if (company.logo_public_id) {
    try { await deleteFromCloudinary(company.logo_public_id); } catch { /* ignore */ }
  }
  const result = await uploadBufferToCloudinary(buffer, 'company_logos');
  await company.update({ logo_url: result.url, logo_public_id: result.public_id } as any);
  return { logo_url: result.url };
}

export async function completeStep2(companyId: number, data: {
  fiscal_year_start_month?: number;
  default_currency?: string;
  currency?: string;
  bank_name?: string;
  bank_account?: string;
}) {
  const company = await model.Company.findByPk(companyId);
  if (!company) throw new Error('Company not found');
  const payload = {
    ...data,
    default_currency: data.default_currency ?? data.currency,
  };
  delete (payload as any).currency;
  await company.update(payload as any);
  return company;
}

export async function completeStep3(branchId: number, data: {
  warehouse_name: string;
  warehouse_code: string;
}) {
  const existing = await model.Warehouse.findOne({ where: { branch_id: branchId } });
  if (existing) return existing;
  return model.Warehouse.create({
    branch_id: branchId,
    code: data.warehouse_code,
    name: data.warehouse_name,
    status: 'active',
  } as any);
}

export async function completeStep4(branchId: number, data: {
  department_name: string;
}) {
  const existing = await model.Department.findOne({ where: { branch_id: branchId } });
  if (existing) return existing;
  return model.Department.create({
    branch_id: branchId,
    name: data.department_name,
  } as any);
}

export async function completeSetup(companyId: number) {
  const company = await model.Company.findByPk(companyId);
  if (!company) throw new Error('Company not found');

  // Tự động thiết lập GL Journal + Chart of Accounts nền tảng để công ty có thể
  // hạch toán (tạo hóa đơn, hoàn hàng...) ngay sau onboarding. Idempotent.
  try {
    await ensureGlSetup();
  } catch (err) {
    // Không chặn hoàn tất setup nếu seed GL lỗi — chỉ log để xử lý sau.
    console.error('ensureGlSetup failed during completeSetup:', err);
  }

  await company.update({ is_setup_done: true } as any);
  return { message: 'Thiết lập hoàn tất. Chào mừng bạn đến với ERP!' };
}
