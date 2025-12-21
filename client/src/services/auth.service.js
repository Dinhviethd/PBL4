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
        console.log("Login response data:", response.data);
        console.log("User object:", response.data.user);
        
        useAuthStore.getState().setAuth(response.data);
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


  confirmChangePassword: async (verificationId, email) => {
    try {
      const response = await instance.put("/users/confirm-password-change", {
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
        console.log("Refresh token response:", response.data);
        useAuthStore.getState().setAuth(response.data);
      }
      return response.data;
    } catch (error) {
      useAuthStore.getState().clearAuth?.();
      throw error.response?.data || { message: "Không thể làm mới token" };
    }
  },

  logout: async () => {
    try {
      await instance.post("/auth/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      useAuthStore.getState().clearAuth();
    }
  },

  getCurrentUser: () => {
    const user = useAuthStore.getState().user;
    console.log("getCurrentUser:", user);
    return user;
  },
};

export default authService;