import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/zustand/authStore';
import userService from '@/services/user.service';
import authService from '@/services/auth.service';

export const useAuthInit = () => {
  const navigate = useNavigate();
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Tự động refresh token trước khi hết hạn 5 phút
    let refreshTimer;
    
    const scheduleTokenRefresh = () => {
      if (!accessToken) return;
      
      try {
        const base64Url = accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const expiryTime = payload.exp * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;
        
        // Refresh 5 phút trước khi hết hạn
        const refreshTime = timeUntilExpiry - (5 * 60 * 1000);
        
        if (refreshTime > 0) {
          console.log(`Sẽ tự động refresh token sau ${Math.round(refreshTime / 1000 / 60)} phút`);
          refreshTimer = setTimeout(async () => {
            try {
              console.log('🔄 Tự động refresh token...');
              await authService.refreshToken();
              console.log('✅ Refresh token thành công');
              // Lên lịch refresh tiếp theo
              scheduleTokenRefresh();
            } catch (error) {
              console.error('❌ Lỗi refresh token:', error);
              clearAuth();
              navigate('/auth/login');
            }
          }, refreshTime);
        } else if (timeUntilExpiry > 0) {
          // Token sắp hết hạn, refresh ngay
          console.log('⚠️ Token sắp hết hạn, refresh ngay...');
          authService.refreshToken()
            .then(() => {
              console.log('✅ Refresh token thành công');
              scheduleTokenRefresh();
            })
            .catch((error) => {
              console.error('❌ Lỗi refresh token:', error);
              clearAuth();
              navigate('/auth/login');
            });
        } else {
          // Token đã hết hạn, thử refresh một lần
          console.log('⚠️ Token đã hết hạn, thử refresh...');
          authService.refreshToken()
            .then(() => {
              console.log('✅ Refresh token thành công');
              scheduleTokenRefresh();
            })
            .catch((error) => {
              console.error('❌ Token hết hạn và không thể refresh');
              clearAuth();
              navigate('/auth/login');
            });
        }
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    };

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

    if (accessToken) {
      scheduleTokenRefresh();
      initAuth();
    }

    // Cleanup timer khi component unmount hoặc accessToken thay đổi
    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [accessToken, user, setAuth, clearAuth, navigate]);

  return { user, accessToken };
};