export interface Role {
  id: number;
  code: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}
export interface Branch {
  id: number;
  address: string;
  code: string;
  name: string;
}
export interface User {
  id: number;
  username: string;
  full_name?: string; 
  email?: string;
  phone?: string;
  avatar_url?: string;
  branch: Branch;
  role: Role;
}

export interface LoginPayload {
  username: string;
  password: string;
  rememberMe: boolean;
}