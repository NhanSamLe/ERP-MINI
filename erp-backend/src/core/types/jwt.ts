export interface JwtPayload {
  id: number;
  username: string;
  role: string;
  permissions?: string[];
  fullName?: string;
  email?: string;
  branch_id?: number;
  company_id?: number;  // Multi-tenant isolation: phân biệt dữ liệu giữa các công ty
}