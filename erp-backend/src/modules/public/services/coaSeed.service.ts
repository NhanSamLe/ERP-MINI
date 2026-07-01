import { Transaction } from 'sequelize';
import * as model from '../../../models/index';
import { createTaxRate } from '../../master-data/services/tax.service';
import { TaxType, AppliesTo } from '../../../core/types/enum';

interface AccountDef {
  code: string;
  name: string;
  type: string;
  normal_side: 'debit' | 'credit';
  parent_code?: string;
}

const VN_STANDARD_ACCOUNTS: AccountDef[] = [
  { code: '111', name: 'Tiền mặt', type: 'asset', normal_side: 'debit' },
  { code: '1111', name: 'Tiền Việt Nam', type: 'asset', normal_side: 'debit', parent_code: '111' },
  { code: '112', name: 'Tiền gửi ngân hàng', type: 'asset', normal_side: 'debit' },
  { code: '1121', name: 'Tiền gửi VND', type: 'asset', normal_side: 'debit', parent_code: '112' },
  { code: '131', name: 'Phải thu của khách hàng', type: 'asset', normal_side: 'debit' },
  { code: '133', name: 'Thuế GTGT được khấu trừ', type: 'asset', normal_side: 'debit' },
  { code: '1331', name: 'Thuế GTGT được khấu trừ của hàng hóa, dịch vụ', type: 'asset', normal_side: 'debit', parent_code: '133' },
  { code: '141', name: 'Tạm ứng', type: 'asset', normal_side: 'debit' },
  { code: '152', name: 'Nguyên liệu, vật liệu', type: 'asset', normal_side: 'debit' },
  { code: '153', name: 'Công cụ, dụng cụ', type: 'asset', normal_side: 'debit' },
  { code: '155', name: 'Thành phẩm', type: 'asset', normal_side: 'debit' },
  { code: '156', name: 'Hàng hóa', type: 'asset', normal_side: 'debit' },
  { code: '211', name: 'Tài sản cố định hữu hình', type: 'asset', normal_side: 'debit' },
  { code: '214', name: 'Hao mòn tài sản cố định', type: 'asset', normal_side: 'credit' },
  { code: '331', name: 'Phải trả cho người bán', type: 'liability', normal_side: 'credit' },
  { code: '333', name: 'Thuế và các khoản phải nộp nhà nước', type: 'liability', normal_side: 'credit' },
  { code: '3331', name: 'Thuế GTGT phải nộp', type: 'liability', normal_side: 'credit', parent_code: '333' },
  { code: '3335', name: 'Thuế thu nhập cá nhân', type: 'liability', normal_side: 'credit', parent_code: '333' },
  { code: '334', name: 'Phải trả người lao động', type: 'liability', normal_side: 'credit' },
  { code: '335', name: 'Chi phí phải trả', type: 'liability', normal_side: 'credit' },
  { code: '338', name: 'Phải trả, phải nộp khác', type: 'liability', normal_side: 'credit' },
  { code: '3383', name: 'Bảo hiểm xã hội', type: 'liability', normal_side: 'credit', parent_code: '338' },
  { code: '3384', name: 'Bảo hiểm y tế', type: 'liability', normal_side: 'credit', parent_code: '338' },
  { code: '341', name: 'Vay và nợ thuê tài chính', type: 'liability', normal_side: 'credit' },
  { code: '411', name: 'Vốn đầu tư của chủ sở hữu', type: 'equity', normal_side: 'credit' },
  { code: '421', name: 'Lợi nhuận sau thuế chưa phân phối', type: 'equity', normal_side: 'credit' },
  { code: '511', name: 'Doanh thu bán hàng và cung cấp dịch vụ', type: 'revenue', normal_side: 'credit' },
  { code: '515', name: 'Doanh thu hoạt động tài chính', type: 'revenue', normal_side: 'credit' },
  { code: '521', name: 'Các khoản giảm trừ doanh thu', type: 'revenue', normal_side: 'debit' },
  { code: '632', name: 'Giá vốn hàng bán', type: 'expense', normal_side: 'debit' },
  { code: '635', name: 'Chi phí tài chính', type: 'expense', normal_side: 'debit' },
  { code: '641', name: 'Chi phí bán hàng', type: 'expense', normal_side: 'debit' },
  { code: '642', name: 'Chi phí quản lý doanh nghiệp', type: 'expense', normal_side: 'debit' },
  { code: '711', name: 'Thu nhập khác', type: 'revenue', normal_side: 'credit' },
  { code: '811', name: 'Chi phí khác', type: 'expense', normal_side: 'debit' },
  { code: '911', name: 'Xác định kết quả kinh doanh', type: 'equity', normal_side: 'debit' },
];

export async function seedVnChartOfAccounts(companyId: number, t: Transaction): Promise<void> {
  const existingCount = await model.GlAccount.count({ where: { company_id: companyId }, transaction: t });
  if (existingCount > 0) return;

  const codeToId = new Map<string, number>();
  for (const acc of VN_STANDARD_ACCOUNTS) {
    const parentId = acc.parent_code ? codeToId.get(acc.parent_code) : undefined;
    const created = await model.GlAccount.create({
      company_id: companyId,
      code: acc.code,
      name: acc.name,
      type: acc.type as any,
      normal_side: acc.normal_side,
      is_active: true,
      ...(parentId ? { parent_id: parentId } : {}),
    } as any, { transaction: t });
    codeToId.set(acc.code, (created as any).id);
  }

  await seedTaxRates(companyId, t);
  await seedPaymentTerms(companyId, t);
}

async function seedTaxRates(companyId: number, t: Transaction): Promise<void> {
  const existing = await model.TaxRate.count({ where: { company_id: companyId }, transaction: t });
  if (existing > 0) return;

  const rates = [
    { code: 'VAT10', name: 'Thuế GTGT 10%', type: TaxType.VAT, rate: 10, applies_to: AppliesTo.BOTH, is_vat: true },
    { code: 'VAT5', name: 'Thuế GTGT 5%', type: TaxType.VAT, rate: 5, applies_to: AppliesTo.BOTH, is_vat: true },
    { code: 'VAT0', name: 'Thuế GTGT 0%', type: TaxType.VAT, rate: 0, applies_to: AppliesTo.BOTH, is_vat: true },
    { code: 'VATEX', name: 'Miễn thuế GTGT', type: TaxType.VAT, rate: 0, applies_to: AppliesTo.BOTH, is_vat: false },
  ];
  for (const r of rates) {
    await createTaxRate({ ...r, company_id: companyId, status: 'active' }, t);
  }
}

async function seedPaymentTerms(companyId: number, t: Transaction): Promise<void> {
  const existing = await model.PaymentTerm.count({ where: { company_id: companyId }, transaction: t });
  if (existing > 0) return;

  const terms = [
    { code: 'IMMEDIATE', name: 'Trả ngay', days: 0, description: 'Thanh toán ngay khi nhận hàng/dịch vụ' },
    { code: 'NET15', name: 'Net 15', days: 15, description: 'Thanh toán trong vòng 15 ngày' },
    { code: 'NET30', name: 'Net 30', days: 30, description: 'Thanh toán trong vòng 30 ngày' },
    { code: 'NET60', name: 'Net 60', days: 60, description: 'Thanh toán trong vòng 60 ngày' },
  ];
  for (const term of terms) {
    await model.PaymentTerm.create(
      { ...term, company_id: companyId, is_active: true },
      { transaction: t }
    );
  }
}
