import instance from "./axios.config"; 
import useAuthStore from "../zustand/authStore";

const authService = {
  login: async (email, password, remember = false) => {
    try {
      const response = await instance.post(
        "/auth/login",
        { email, password, remember },
        { isLoginRequest: true }
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
      const response = await instance.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Đã có lỗi xảy ra" };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await instance.post("/auth/forgot-password", { email });
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
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Đã có lỗi xảy ra" };
    }
  },

  resetPasswordRequest: async (email, password, confirmPassword) => {
    try {
      const response = await instance.post("/auth/reset-password-request", {
        email,
        newPassword: password,
        confirmPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Đã có lỗi xảy ra" };
    }
  },

  confirmPasswordReset: async (verificationId, email) => {
    try {
      const response = await instance.post("/auth/confirm-password-reset", {
        verificationId,
        email,
      });
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
        { isRefreshRequest: true }
      );
      if (response.data.accessToken) {
        useAuthStore.getState().setAuth(response.data);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Không thể làm mới token" };
    }
  },

  logout: async () => {
    try {
      // Gọi API logout để cập nhật status user thành OFFLINE
      await instance.post("/auth/logout");
    } catch (error) {
      // Nếu API lỗi, vẫn tiếp tục clear auth ở frontend
      console.error("Logout API error:", error);
    } finally {
      // Luôn clear auth ở frontend
      useAuthStore.getState().clearAuth();
    }
  },

  getCurrentUser: () => {
    return useAuthStore.getState().user;
  },
};

export default authService;
