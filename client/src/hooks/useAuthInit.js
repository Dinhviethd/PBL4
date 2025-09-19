import { useEffect } from 'react';
import useAuthStore from '@/zustand/authStore';
import userService from '@/services/user.service';

export const useAuthInit = () => {
  const { user, accessToken, setAuth } = useAuthStore();

  useEffect(() => {
    // Nếu có accessToken nhưng không có user data, hoặc cần refresh user data
    const initAuth = async () => {
      if (accessToken && !user) {
        try {
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
          // Có thể clear auth nếu token không hợp lệ
        }
      }
    };

    initAuth();
  }, [accessToken, user, setAuth]);

  return { user, accessToken };
};