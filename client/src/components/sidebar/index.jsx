import React, { useState } from "react";
import { useAuthInit } from "@/hooks/useAuthInit";
import { NavLink, useNavigate } from "react-router-dom";
import { MessageCircle, Users, Bell, UserPlus, Settings, PlusSquare, LogOut } from "lucide-react";
import PopupInfo from "@/components/profile/PopupInfor";
import CreateGroupModal from './CreateGroupModal';
import authService from "@/services/auth.service";

const links = [
  { to: "/", label: "Tin nhắn", icon: <MessageCircle size={22} /> },
  { to: "/contact", label: "Bạn bè", icon: <Users size={22} /> },
  { to: "/notifications", label: "Thông báo", icon: <Bell size={22} /> },
  { to: "/add-friend", label: "Thêm bạn", icon: <UserPlus size={22} /> },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuthInit();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Vẫn redirect đến login ngay cả khi có lỗi
      navigate("/login");
    }
  };

  const avatarUrl = user?.avatarUrl
    ? user.avatarUrl.startsWith("http")
      ? user.avatarUrl
      : `${import.meta.env.VITE_API_URL.replace("/api", "")}${user.avatarUrl}`
    : "/images/avatar-default-icon.png";

  return (
    <nav className="w-20 h-screen bg-white border-r border-gray-200 flex flex-col justify-between py-4 shadow-sm relative">
      {/* Avatar */}
      <div>
        <div className="flex justify-center mb-6 relative">
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-12 h-12 rounded-full border-2 border-blue-500 object-cover shadow-md cursor-pointer"
            onClick={() => setIsOpen(true)}
            onError={(e) => { e.target.onerror = null; e.target.src = "/images/avatar-default-icon.png"; }}
          />
          {isOpen && <PopupInfo isOpen={isOpen} onClose={() => setIsOpen(false)} />}
        </div>

        {/* Nav links */}
        <div className="flex flex-col items-center gap-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group
                 ${isActive ? "bg-blue-50 text-blue-600 border-2 border-blue-500 shadow-md" : "text-gray-600 hover:bg-gray-100"}`
              }
              title={link.label}
            >
              {link.icon}
              <span className="absolute left-14 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">
                {link.label}
              </span>
            </NavLink>
          ))}

          {/* Create group button */}
          <button
            onClick={() => setShowCreate(true)}
            className="w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group text-gray-600 hover:bg-gray-100"
            title="Tạo nhóm"
          >
            <PlusSquare size={22} />
            <span className="absolute left-14 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">Tạo nhóm</span>
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="flex flex-col items-center gap-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group
             ${isActive ? "bg-blue-50 text-blue-600 border-2 border-blue-500 shadow-md" : "text-gray-600 hover:bg-gray-100"}`
          }
        >
          <Settings size={22} />
          <span className="absolute left-14 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">
            Cài đặt
          </span>
        </NavLink>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group text-gray-600 hover:bg-red-50 hover:text-red-600"
          title="Đăng xuất"
        >
          <LogOut size={22} />
          <span className="absolute left-14 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">
            Đăng xuất
          </span>
        </button>
      </div>

  {/* Create Group Modal */}
  <CreateGroupModal isOpen={showCreate} onClose={() => setShowCreate(false)} currentUser={user} />
    </nav>
  );
}
