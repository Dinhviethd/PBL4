import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from '@/components/sidebar/index';
import useAuthStore from "../zustand/authStore";
import authService from "@/services/auth.service";
import userService from "@/services/user.service";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function MainLayout() {
  const { user, accessToken, setAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!user && !!accessToken);
  
  // Khởi tạo WebSocket connection
  useWebSocket();

  useEffect(() => {
    // Nếu đã có accessToken và user thì xác thực luôn
    if (user && accessToken) {
      setIsAuthenticated(true);
      setChecking(false);
      return;
    }
    
    // Nếu chưa có accessToken nhưng có refresh token (cookie), thử refresh
    const tryRefresh = async () => {
      try {
        const data = await authService.refreshToken();
        if (data && data.accessToken) {
          // Nếu refresh thành công nhưng chưa có user data, load user profile
          if (!data.user) {
            try {
              const userResponse = await userService.getProfile();
              setAuth({
                user: userResponse.data,
                accessToken: data.accessToken
              });
            } catch (userError) {
              console.error("Error loading user profile:", userError);
            }
          }
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };
    tryRefresh();
  }, [user, accessToken, setAuth]);

  if (checking) return null; // hoặc loading indicator
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      {/* make the main content a positioned container so child absolute overlays center inside it */}
      <div style={{ flex: 1, padding: 20, background: "#f0f4ff", position: 'relative' }}>
        <Outlet />
      </div>
    </div>
  );
}
