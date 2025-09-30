import * as api from "../../api/auth.api";
import { LoginPayload } from "../../types/User";
export async function login(data: LoginPayload) {
  const res = await api.login(data);
  return res.data; // { token, message }
}

export async function getProfile() {
  const res = await api.profile();
  return res.data; // user object
}

export async function refresh() {
    const res = await api.refresh();
    return res.data;
}