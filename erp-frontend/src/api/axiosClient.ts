import axios from "axios";
import { store } from "../store/store";
import { setToken, clearAuth } from "../features/auth/authSlice";

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
        // gọi API refresh (cookie HttpOnly tự gửi kèm)
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:8888/api"}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = res.data.accessToken;

        // cập nhật Redux store với access token mới
        store.dispatch(setToken(newAccessToken));

        // retry request với token mới
        originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalConfig);
      } catch (refreshErr) {
        console.error("Refresh token failed:", refreshErr);
        // clear Redux store và redirect login
        store.dispatch(clearAuth());
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default axiosClient;