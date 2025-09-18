import instance from "./axios.config"; 

const authService = {
  login: async (email, password, remember = false) => {
    try {
      const response = await instance.post(
        "/auth/login",
        { email, password, remember },
        { isLoginRequest: true } // flag cho interceptor
      );

      if (response.data.accessToken) {
        localStorage.setItem("user", JSON.stringify(response.data));
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

  refreshToken: async () => {
    try {
      const response = await instance.post(
        "/auth/refresh-token",
        {},
        { isRefreshRequest: true } 
      );
      if (response.data.accessToken) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Không thể làm mới token" };
    }
  },

  logout: () => {
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem("user"));
  },
};

export default authService;
