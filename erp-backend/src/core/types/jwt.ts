export interface JwtPayload {
  id: number;
  username: string;
  role: string;
  permissions?: string[];
  fullName?: string;
  email?: string;
  branch_id?: number;
}