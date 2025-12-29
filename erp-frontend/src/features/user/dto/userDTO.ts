export interface createUserDTO {
  branch_id: number;
  username: string;
  password: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role_id: number;
}

export interface updateUserDTO {
  username: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role_id?: number;
  branch_id?: number;
  is_active?: boolean;
}
