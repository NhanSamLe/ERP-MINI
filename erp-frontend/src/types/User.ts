export interface Role {
  id: number;
  code: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  username: string;
  full_name?: string; 
  email?: string;
  phone?: string;
  branch_id?: number;
  role: Role;
}

export interface LoginPayload {
  username: string;
  password: string;
}