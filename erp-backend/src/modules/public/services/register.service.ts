import crypto from 'crypto';
import * as model from '../../../models/index';
import { hashPassword } from '../../../core/utils/security';
import { sendEmail, newEmployeeAccountTemplate } from '../../../core/utils/email';
import { env } from '../../../config/env';
import { sequelize } from '../../../config/db';
import { seedVnChartOfAccounts } from './coaSeed.service';

export interface RegisterPayload {
  company_name: string;
  tax_code: string;
  company_phone?: string;
  company_email?: string;
  address?: string;
  industry?: string;
  employee_count?: string;
  full_name: string;
  email: string;
  phone?: string;
}

export async function registerCompany(payload: RegisterPayload) {
  return sequelize.transaction(async (t) => {
    // 1. Validate unique tax_code
    const existingByTax = await model.Company.findOne({ where: { tax_code: payload.tax_code }, transaction: t });
    if (existingByTax) throw new Error('Mã số thuế đã được đăng ký trong hệ thống.');

    // 2. Validate unique email
    const existingUser = await model.User.findOne({ where: { email: payload.email }, transaction: t });
    if (existingUser) throw new Error('Email này đã được sử dụng.');

    // 3. Create Company
    const company = await model.Company.create({
      code: `C-${payload.tax_code.replace(/\W/g, '').substring(0, 20)}`,
      name: payload.company_name,
      tax_code: payload.tax_code,
      phone: payload.company_phone,
      email: payload.company_email,
      address: payload.address,
      industry: payload.industry,
      employee_count: payload.employee_count,
      is_setup_done: false,
      default_currency: 'VND',
      fiscal_year_start_month: 1,
    } as any, { transaction: t });

    const companyId = (company as any).id as number;

    // 4. Create default Branch (Trụ sở chính)
    const branch = await model.Branch.create({
      company_id: companyId,
      code: `HQ-${companyId}`,
      name: 'Trụ sở chính',
      address: payload.address ?? '',
      status: 'active',
    } as any, { transaction: t });

    const branchId = (branch as any).id as number;

    // 5. Find ADMIN role
    const adminRole = await model.Role.findOne({ where: { code: 'ADMIN' }, transaction: t });
    if (!adminRole) throw new Error('Hệ thống chưa cấu hình role ADMIN. Vui lòng liên hệ hỗ trợ.');

    // 6. Create admin user (inactive, pending password activation)
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await hashPassword(tempPassword);
    const resetToken = crypto.randomBytes(32).toString('hex');
    const username = `admin_${companyId}`;

    await model.User.create({
      username,
      password_hash: passwordHash,
      email: payload.email,
      full_name: payload.full_name,
      phone: payload.phone,
      branch_id: branchId,
      role_id: (adminRole as any).id,
      is_active: false,
      reset_token: resetToken,
      reset_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
    } as any, { transaction: t });

    // 7. Seed VN Standard Chart of Accounts
    await seedVnChartOfAccounts(companyId, t);

    // 8. Send activation email
    try {
      const activationLink = `${env.frontend.url}/reset-password?token=${resetToken}`;
      const template = newEmployeeAccountTemplate(username, payload.full_name, activationLink);
      await sendEmail(payload.email, `Kích hoạt tài khoản ERP - ${payload.company_name}`, template.text, template.html);
    } catch {
      // Email failure không rollback transaction
    }

    return {
      company_id: companyId,
      company_name: payload.company_name,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.',
    };
  });
}
