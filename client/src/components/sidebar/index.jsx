import React, { useState, useEffect } from "react";
import { useAuthInit } from "@/hooks/useAuthInit";
import { NavLink, useNavigate } from "react-router-dom";
import { MessageCircle, Users, Bell, UserPlus, Settings, PlusSquare, LogOut, AlertCircle } from "lucide-react";
import PopupInfo from "@/components/profile/PopupInfor";
import CreateGroupModal from './CreateGroupModal';
import authService from "@/services/auth.service";
import notificationService from "@/services/notification.service";
import { useNotificationContext } from "@/contexts/NotificationCountContext";
import { getReceivedRequests } from "@/services/friendShip.service";
import useChatStore from '@/zustand/chatStore';

const links = [
  { to: "/", label: "Tin nhắn", icon: <MessageCircle size={22} /> },
  { to: "/contact", label: "Bạn bè", icon: <Users size={22} /> },
  { to: "/notifications", label: "Thông báo", icon: <Bell size={22} /> },
  { to: "/add-friend", label: "Thêm bạn", icon: <UserPlus size={22} /> },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [hasPendingInvites, setHasPendingInvites] = useState(false);
  const { user, accessToken } = useAuthInit();
  const { unreadCount, updateUnreadCount } = useNotificationContext();
  const { conversations } = useChatStore();
  const navigate = useNavigate();

  // Calculate total unread messages from all conversations
  const totalUnreadMessages = conversations.reduce((total, conv) => {
    return total + (conv.unreadCount || 0);
  }, 0);

  // Fetch notifications count on mount and poll every 5 seconds
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        if (accessToken) {
          const response = await notificationService.getNotifications();
          const unread = response.data.filter(n => n.status === "pending").length;
          updateUnreadCount(unread);
        }
      } catch (error) {
        console.error("Failed to fetch notification count:", error);
      }
    };

    fetchNotificationCount();

    // Poll every 5 seconds
    const interval = setInterval(fetchNotificationCount, 5000);
    return () => clearInterval(interval);
  }, [accessToken, updateUnreadCount]);

  // Fetch pending friend invites on mount and poll every 5 seconds
  useEffect(() => {
    const fetchPendingInvites = async () => {
      try {
        if (accessToken) {
          const response = await getReceivedRequests(1, 100);
          setHasPendingInvites((response.total || 0) > 0);
        }
      } catch (error) {
        console.error("Failed to fetch pending invites:", error);
      }
    };

    fetchPendingInvites();

    // Poll every 5 seconds
    const interval = setInterval(fetchPendingInvites, 5000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const handleLogoutConfirm = async () => {
    try {
      await authService.logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Vẫn redirect đến login ngay cả khi có lỗi
      navigate("/login");
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
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
              {/* Badge for unread messages - only red dot */}
              {link.to === "/" && totalUnreadMessages > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full shadow-md"></div>
              )}
              {/* Badge for notifications - only red dot */}
              {link.to === "/notifications" && unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full shadow-md"></div>
              )}
              {/* Badge for friend invites - only red dot */}
              {link.to === "/contact" && hasPendingInvites && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full shadow-md"></div>
              )}
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

  {/* Logout Confirmation Modal */}
  {showLogoutConfirm && (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full mx-4 relative overflow-hidden">
        {/* Gradient background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-100 to-red-50 rounded-full -mr-20 -mt-20 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-50 to-transparent rounded-full -ml-16 -mb-16 opacity-30"></div>
        
        <div className="relative z-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <LogOut className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-3">Xác nhận đăng xuất</h2>
          
          {/* Description */}
          <p className="text-center text-gray-600 mb-8 text-base leading-relaxed">
            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?
          </p>

          {/* Warning note */}
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng ứng dụng.</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all duration-300 hover:shadow-md"
            >
              Hủy
            </button>
            <button
              onClick={handleLogoutConfirm}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
    </nav>
  );
}
