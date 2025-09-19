import axios from "axios";
import authService from "./auth.service.js";
import useAuthStore from "@/zustand/authStore";

const apiUrl = import.meta.env.VITE_API_URL;

const instance = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken && !config.isRefreshRequest && !config.isLoginRequest) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest?.isLoginRequest) {
      return Promise.reject(error);
    }

    if (originalRequest?.isRefreshRequest) {
      console.error("Refresh token không hợp lệ:", error);
      useAuthStore.getState().clearAuth();
      window.location.href = "/auth/login";
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await authService.refreshToken();
        console.log("Refresh token thành công ✅");
        return instance(originalRequest);
      } catch (refreshError) {
        console.error("Lỗi khi refresh token:", refreshError);
        useAuthStore.getState().clearAuth();
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
