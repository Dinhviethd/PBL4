import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth';

// Tạo instance axios với cấu hình mặc định
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Quan trọng cho CORS
});

const authService = {
  login: async (email, password, remember = false) => {
    try {
      const response = await api.post('/login', {
        email,
        password,
        remember
      });
      if (response.data.accessToken) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Đã có lỗi xảy ra' };
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Đã có lỗi xảy ra' };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Đã có lỗi xảy ra' };
    }
  },

  resetPassword: async (email, password) => {
    try {
      const response = await api.post('/reset-password', {
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Đã có lỗi xảy ra' };
    }
  },

  logout: () => {
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },
};

export default authService;