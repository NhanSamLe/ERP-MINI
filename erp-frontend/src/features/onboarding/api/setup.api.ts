import axiosClient from '../../../api/axiosClient';

export interface CompanyInfoPayload {
  company_name?: string;
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface FinanceConfigPayload {
  fiscal_year_start_month: number;
  default_currency?: string;
  currency?: string;
  bank_name?: string;
  bank_account?: string;
}

export interface WarehouseConfigPayload {
  warehouse_name: string;
  warehouse_code: string;
  track_lot_serial?: boolean;
  costing_method?: string;
}

export interface HRConfigPayload {
  department_name: string;
  payroll_day?: number;
}

export interface InviteMember {
  email: string;
  full_name: string;
  role_code?: string;
  role?: string;
}

export const setupApi = {
  getStatus: () => axiosClient.get('/setup/status'),

  step1: (data: CompanyInfoPayload) => axiosClient.put('/setup/step/1', data),

  uploadLogo: (file: File | FormData) => {
    const form = file instanceof FormData ? file : new FormData();
    if (!(file instanceof FormData)) {
      form.append('logo', file);
    }
    return axiosClient.post('/setup/step/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  step2: (data: FinanceConfigPayload) => axiosClient.put('/setup/step/2', data),

  step3: (data: WarehouseConfigPayload) => axiosClient.put('/setup/step/3', data),

  step4: (data: HRConfigPayload) => axiosClient.put('/setup/step/4', data),

  updateStep1: (data: CompanyInfoPayload) => axiosClient.put('/setup/step/1', data),
  updateStep2: (data: FinanceConfigPayload) => axiosClient.put('/setup/step/2', data),
  updateStep3: (data: WarehouseConfigPayload) => axiosClient.put('/setup/step/3', data),
  updateStep4: (data: HRConfigPayload) => axiosClient.put('/setup/step/4', data),
  inviteMembers: (input: InviteMember[] | { members: InviteMember[] }) => {
    const members = Array.isArray(input) ? input : input.members;
    return axiosClient.post('/setup/invite-members', {
      members: members.map((member) => ({
        ...member,
        role_code: member.role_code || member.role || '',
      })),
    });
  },

  complete: () => axiosClient.post('/setup/complete'),
};
