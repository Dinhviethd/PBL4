import React, { useState, useEffect } from "react";
import { useAuthInit } from "@/hooks/useAuthInit";
import { NavLink, useNavigate } from "react-router-dom";
import { MessageCircle, Users, Bell, UserPlus, Settings, LogOut } from "lucide-react";
import PopupInfo from "../components/profile/PopupInfor"; // popup component của bạn
import authService from "@/services/auth.service";

const links = [
  { to: "/", label: "Tin nhắn", icon: <MessageCircle size={22} /> },
  { to: "/contact", label: "Bạn bè", icon: <Users size={22} /> },
  { to: "/notifications", label: "Thông báo", icon: <Bell size={22} /> },
  { to: "/add-friend", label: "Thêm bạn", icon: <UserPlus size={22} /> },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Khởi tạo auth và lấy user data
  const { user } = useAuthInit();

  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Vẫn navigate về login page ngay cả khi có lỗi
      navigate("/auth/login");
    }
  };

  // Xử lý sự kiện đóng trang
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Gọi logout để clear local state và gửi API request
      authService.logout();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
  
  const userData = {
    avatar: user?.avatarUrl ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatarUrl}` : "/images/avatar-default-icon.png",
  };
  console.log(userData.avatar);

  return (
    <nav className="w-20 h-screen bg-white border-r border-gray-200 flex flex-col justify-between py-4 shadow-sm relative">
      {/* Top avatar */}
      <div>
        <div className="flex justify-center mb-6 relative">
          <img
            src={userData.avatar}
            alt="avatar"
            className="w-12 h-12 rounded-full border-2 border-blue-500 object-cover shadow-md cursor-pointer"
            onClick={() => setIsOpen(true)}
            onError={(e) => { e.target.onerror = null; e.target.src = "/images/avatar-default-icon.png"; }}
          />

          {/* Popup Info */}
          {isOpen && (
            <PopupInfo
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              {...userData}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col items-center gap-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group
                 ${isActive
                   ? "bg-blue-50 text-blue-600 border-2 border-blue-500 shadow-md"
                   : "text-gray-600 hover:bg-gray-100"}`
              }
            >
              {link.icon}
              <span className="absolute left-14 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">
                {link.label}
              </span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Bottom logout and setting */}
      <div className="flex flex-col items-center gap-3">
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group text-gray-600 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={22} />
          <span className="absolute left-14 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
            Đăng xuất
          </span>
        </button>

        {/* Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group
             ${isActive
               ? "bg-blue-50 text-blue-600 border-2 border-blue-500 shadow-md"
               : "text-gray-600 hover:bg-gray-100"}`
          }
        >
          <Settings size={22} />
          <span className="absolute left-14 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">
            Cài đặt
          </span>
        </NavLink>
      </div>
    </nav>
  );
}
