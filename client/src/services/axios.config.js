import axios from "axios";
import authService from "./auth.service.js";

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
    if (config.skipAuthRedirect) {
      config.skipAuthRedirect = true;
    }

    config.headers = {
      ...config.headers,
    };

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

    if (originalRequest?.isRefreshRequest === true) {
      console.error("Lỗi xác thực:", error);
      window.location.href = "/";
      return Promise.reject(error);
    }

    if (
      originalRequest?.headers &&
      originalRequest.headers["X-From-Header"] === "true"
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await authService.refreshToken();
        console.log("refreshToken thành công");

        const newRequest = {
          ...originalRequest,
          headers: { ...originalRequest.headers },
        };

        return instance(newRequest);
      } catch (refreshError) {
        console.error("Lỗi khi làm mới token:", refreshError);
        if (!originalRequest?.skipAuthRedirect) {
          if (window.location.pathname !== "/auth/login") {
            window.location.href = "/auth/login";
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
