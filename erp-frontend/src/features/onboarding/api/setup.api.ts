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
  default_currency: string;
  bank_name?: string;
  bank_account?: string;
}

export interface WarehouseConfigPayload {
  warehouse_name: string;
  warehouse_code: string;
}

export interface HRConfigPayload {
  department_name: string;
}

export interface InviteMember {
  email: string;
  full_name: string;
  role_code: string;
}

export const setupApi = {
  getStatus: () => axiosClient.get('/setup/status'),

  step1: (data: CompanyInfoPayload) => axiosClient.put('/setup/step/1', data),

  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return axiosClient.post('/setup/step/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  step2: (data: FinanceConfigPayload) => axiosClient.put('/setup/step/2', data),

  step3: (data: WarehouseConfigPayload) => axiosClient.put('/setup/step/3', data),

  step4: (data: HRConfigPayload) => axiosClient.put('/setup/step/4', data),

  complete: () => axiosClient.post('/setup/complete'),
};
