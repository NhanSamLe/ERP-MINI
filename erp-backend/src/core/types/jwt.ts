export interface JwtPayload {
  id: number;
  username: string;
  role: string;
  fullName?: string;
  email?: string;
  branchId?: string;
}