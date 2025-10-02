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
    return res;
}
export async function requestPasswordReset(username: string) {
  const res = await api.requestPasswordReset(username);
  return res.data; 
}
export async function validateResetToken(token: string) {
  const res = await api.validateResetToken(token);
  return res.data; 
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await api.resetPassword(token, newPassword);
  return res.data; 
}
export async function logout() {
  const res = await api.logout();
  return res.data;
}