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

