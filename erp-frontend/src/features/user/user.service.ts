import * as api from "../user/api/user.api";
// import {User, Role} from "../../types/User";
import { updateUserDTO } from "./dto/userDTO";

export async function updateUser(data: updateUserDTO) {
  const res = await api.updateUser({
    username: data.username,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    role_id: data.role_id,
    branch_id: data.branch_id,
  });
  return res.data.user;
}
export async function deleteUser(id: number) {
    const res = await api.deleteUser(id);
    return res.data;
}
export async function getAllUsers() {
    const res = await api.getAllUsers();
    return res.data;
}
export async function getAllRoles() {
    const res = await api.getAllRoles();
    return res.data;
}
export async function createUser(data: {
  branch_id: number;
  username: string;
  password: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role_id: number;
}) {
    const res = await api.createUser(data);
    return res.data.user;
}
