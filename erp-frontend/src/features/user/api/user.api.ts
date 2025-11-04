import axiosClient from "../../../api/axiosClient";
export function createUser(data: {
  branch_id: number;
  username: string;
  password: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role_id: number;
}) {
  return axiosClient.post("/auth/users", data);
}
export function updateUser(data: {
  username?: string;
  branch_id?: number;
  full_name?: string;
  email?: string;
  phone?: string;
  role_id?: number;
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