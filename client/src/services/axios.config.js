import axios from "axios";
import useAuthStore from "../zustand/authStore";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  withCredentials: true, // gửi cookie refresh token
  timeout: 15000,
});

// Tránh vòng lặp refresh
let refreshPromise = null;

instance.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    // Không đính kèm Authorization cho login/refresh
    if (!config.isLoginRequest && !config.isRefreshRequest && accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (config.isRefreshRequest) {
      // đảm bảo không có Authorization khi refresh
      if (config.headers && config.headers.Authorization) {
        delete config.headers.Authorization;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;

    // Nếu 401/403 và chưa retry, thử refresh
    const shouldTryRefresh =
      (status === 401 || status === 403) &&
      !original._retry &&
      !original.isLoginRequest &&
      !original.isRefreshRequest;

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    try {
      original._retry = true;

      // Chia sẻ 1 promise refresh cho tất cả request cùng lúc
      if (!refreshPromise) {
        refreshPromise = instance
          .post("/auth/refresh-token", {}, { isRefreshRequest: true })
          .then((res) => {
            const data = res.data;
            if (data?.accessToken) {
              useAuthStore.getState().setAuth(data); // cập nhật accessToken + user
            }
            return data?.accessToken;
          })
          .catch((e) => {
            // Refresh fail: xoá auth và chuyển hướng login nếu cần
            console.warn("Refresh token không hợp lệ:", e);
            useAuthStore.getState().clearAuth?.();
            throw e;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;

      // Gắn token mới và retry request gốc
      original.headers = original.headers || {};
      if (newAccessToken) {
        original.headers.Authorization = `Bearer ${newAccessToken}`;
      } else {
        delete original.headers.Authorization;
      }

      return instance.request(original);
    } catch (e) {
      return Promise.reject(e);
    }
  }
);

export default instance;