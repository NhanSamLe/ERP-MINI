import axiosClient from "../../../api/axiosClient";
import { createUserDTO } from "../dto/userDTO";

export function createUser(data: createUserDTO) {
  return axiosClient.post("/auth/users", data);
}
export function updateUser(data: {
  username?: string;
  branch_id?: number;
  full_name?: string;
  email?: string;
  phone?: string;
  role_id?: number;
  is_active?: boolean;
}) {
  return axiosClient.put(`/auth/users`, data);
}
export function deleteUser(id: number) {
  return axiosClient.delete(`/auth/users/${id}`);
}
export function getAllUsers() {
  return axiosClient.get("/auth/users");
}
export function getAllRoles() {
  return axiosClient.get("/auth/roles");
}