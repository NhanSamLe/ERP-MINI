import axiosClient from "./axiosClient";
import { LoginPayload  } from "../types/User";

export function login(data: LoginPayload) {
  return axiosClient.post("/auth/login", data);
}
export function profile() {
  return axiosClient.get("/auth/me");
}
export function refresh(){
    return axiosClient.post("/auth/refresh");
}
export function requestPasswordReset(username: string) {
  return axiosClient.post("/auth/request-password-reset", { username });
}

export function validateResetToken(token: string) {
  return axiosClient.get(`/auth/validate-reset-token?token=${token}`);
}

export function resetPassword(token: string, newPassword: string) {
  return axiosClient.post("/auth/reset-password", { token, newPassword });
}
