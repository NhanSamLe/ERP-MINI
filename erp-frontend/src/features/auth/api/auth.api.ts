import axios from "axios";
import axiosClient from "../../../api/axiosClient";
import { LoginPayload  } from "../../../types/User";
import { store } from "../../../store/store";
import { setToken, clearAuth } from "../store";

const API = import.meta.env.VITE_API_URL || "http://localhost:8888/api";
export function login(data: LoginPayload) {
  return axiosClient.post("/auth/login", data);
}
export function profile() {
  return axiosClient.get("/auth/me");
}

let refreshPromise: Promise<{ token: string }> | null = null;
export function refresh() {
  if (refreshPromise) {
    // Đang có refresh → trả về promise đang chạy
    return refreshPromise;
  }

  refreshPromise = axios
    .post(`${API}/auth/refresh`, {}, { withCredentials: true }) // dùng axios gốc, tránh loop
    .then((res) => {
      const token = res.data.accessToken;
      if (token) {
        store.dispatch(setToken(token)); // cập nhật Redux ngay
      }
      return { token };
    })
    .catch((err) => {
      store.dispatch(clearAuth());
      throw err;
    })
    .finally(() => {
      refreshPromise = null; // reset sau khi xong
    });

  return refreshPromise;
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
export function logout(){
  return axiosClient.post("/auth/logout");
}
export async function updateUserAvatar(formData: FormData) {
  const token = store.getState().auth.accessToken; 

  const res = await axios.put(
    `${API}/auth/update-avt`,
    formData,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );
  return res;
}
export function updateUserInfo(data: { full_name?: string; email?: string; phone?: string }){
  return axiosClient.put("/auth/update-me",data)
}
