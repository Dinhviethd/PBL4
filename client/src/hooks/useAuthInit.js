import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/zustand/authStore';
import userService from '@/services/user.service';
import authService from '@/services/auth.service';

// Helper function to decode JWT and check expiry
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    const expiryTime = payload.exp * 1000; // exp is in seconds, convert to milliseconds
    return Date.now() >= expiryTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

export const useAuthInit = () => {
  const navigate = useNavigate();
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Kiểm tra token hết hạn khi app khởi động
    if (accessToken && isTokenExpired(accessToken)) {
      console.warn('Token has expired');
      clearAuth();
      navigate('/auth/login');
      return;
    }

    const initAuth = async () => {
      if (accessToken && !user) {
        try {
          // Thử fetch profile, nếu 401 thì token hết hạn
          const userData = await userService.getProfile();
          
          // Check account status and auto-reactivate if locked
          const statusResponse = await userService.getAccountStatus();
          if (statusResponse.status === 'locked') {
            try {
              await userService.reactivateAccount();
              console.log('Account reactivated successfully');
            } catch (reactivateError) {
              console.error('Failed to reactivate account:', reactivateError);
            }
          }
          
          setAuth({ user: userData, accessToken });
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Nếu lỗi 401, clear auth và redirect to login
          if (error.response?.status === 401) {
            clearAuth();
            navigate('/auth/login');
          }
        }
      }
    };

    initAuth();
  }, [accessToken, user, setAuth, clearAuth, navigate]);

  return { user, accessToken };
};