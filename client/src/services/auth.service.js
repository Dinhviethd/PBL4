import instance from "./axios.config"; 
import useAuthStore from "../zustand/authStore";

const authService = {
  login: async (email, password, remember = false) => {
    try {
      const response = await instance.post(
        "/auth/login",
        { email, password, remember },
        { isLoginRequest: true } // interceptor sẽ không gắn Authorization
      );
      if (response.data.accessToken) {
        useAuthStore.getState().setAuth(response.data);
        console.log("Login successful, user data:", response.data);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Đã có lỗi xảy ra" };
    }
  },

  register: async (userData) => {
    try {
      const response = await instance.post("/auth/register", userData, {
        isLoginRequest: true,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Đã có lỗi xảy ra" };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await instance.post("/auth/forgot-password", { email }, {
        isLoginRequest: true,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Đã có lỗi xảy ra" };
    }
  },

  resetPassword: async (email, password) => {
    try {
      const response = await instance.post("/auth/reset-password", {
        email,
        password,
      }, { isLoginRequest: true });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Đã có lỗi xảy ra" };
    }
  },

  refreshToken: async () => {
    try {
      const response = await instance.post(
        "/auth/refresh-token",
        {},
        { isRefreshRequest: true } // không gắn Authorization, có withCredentials
      );
      if (response.data.accessToken) {
        useAuthStore.getState().setAuth(response.data);
      }
      return response.data;
    } catch (error) {
      // Nếu 403/401 ở đây => refresh token hết hạn/không hợp lệ
      useAuthStore.getState().clearAuth?.();
      throw error.response?.data || { message: "Không thể làm mới token" };
    }
  },

  logout: () => {
    useAuthStore.getState().clearAuth();
  },

  getCurrentUser: () => {
    return useAuthStore.getState().user;
  },
};

export default authService;