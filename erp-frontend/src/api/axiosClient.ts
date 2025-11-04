import axios from "axios";
import { store } from "../store/store";
import {  clearAuth } from "../features/auth/store";
import { refresh } from "../features/auth/api/auth.api";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8888/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken; 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// interceptor response → refresh token khi 401
axiosClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalConfig = err.config;

    if (err.response?.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;
      try {
        const { token } = await refresh();
        if (token) {
          originalConfig.headers.Authorization = `Bearer ${token}`;
          return axiosClient(originalConfig); // retry request
        }
      } catch (refreshErr) {
        console.error("Refresh token failed:", refreshErr);
        // clear Redux store và redirect login
        store.dispatch(clearAuth());
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default axiosClient;