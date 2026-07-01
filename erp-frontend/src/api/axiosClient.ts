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

let activeRequests = 0;
const listeners = new Set<(count: number) => void>();

export function subscribeToActiveRequests(listener: (count: number) => void) {
  listeners.add(listener);
  listener(activeRequests);
  return () => {
    listeners.delete(listener);
  };
}

function updateActiveRequests(delta: number) {
  activeRequests += delta;
  if (activeRequests < 0) activeRequests = 0;
  listeners.forEach((l) => l(activeRequests));
}

axiosClient.interceptors.request.use(
  (config) => {
    updateActiveRequests(1);
    const token = store.getState().auth.accessToken; 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    updateActiveRequests(-1);
    return Promise.reject(error);
  }
);

// interceptor response → refresh token khi 401
axiosClient.interceptors.response.use(
  (res) => {
    updateActiveRequests(-1);
    return res;
  },
  async (err) => {
    updateActiveRequests(-1);
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