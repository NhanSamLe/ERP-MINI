import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8888/api';

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

export const publicApi = {
  register: (data: RegisterPayload) =>
    axios.post(`${API}/public/register`, data),
};
