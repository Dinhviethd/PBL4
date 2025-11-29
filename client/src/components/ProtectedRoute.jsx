import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/zustand/authStore';

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
    const expiryTime = payload.exp * 1000;
    return Date.now() >= expiryTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const { accessToken, clearAuth } = useAuthStore();

  useEffect(() => {
    // Kiểm tra token hết hạn
    if (!accessToken || isTokenExpired(accessToken)) {
      console.warn('Token expired or missing, redirecting to login');
      clearAuth();
      navigate('/auth/login');
    }
  }, [accessToken, clearAuth, navigate]);

  // Nếu token không hợp lệ, không render component
  if (!accessToken || isTokenExpired(accessToken)) {
    return null;
  }

  return children;
}
