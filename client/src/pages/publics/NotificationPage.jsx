import { useAuthInit } from "@/hooks/useAuthInit";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Users, MessageCircle, Phone, Check, Trash2 } from "lucide-react";
import notificationService from "@/services/notification.service";
import { useNotificationContext } from "@/contexts/NotificationCountContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const getNotificationIcon = (type) => {
  switch (type) {
    case "friendRequest":
      return { icon: Users, bgColor: "bg-gradient-to-br from-blue-100 to-blue-50", textColor: "text-blue-600", borderColor: "border-l-4 border-blue-500" };
    case "message":
      return { icon: MessageCircle, bgColor: "bg-gradient-to-br from-green-100 to-green-50", textColor: "text-green-600", borderColor: "border-l-4 border-green-500" };
    case "call":
      return { icon: Phone, bgColor: "bg-gradient-to-br from-purple-100 to-purple-50", textColor: "text-purple-600", borderColor: "border-l-4 border-purple-500" };
    default:
      return { icon: MessageCircle, bgColor: "bg-gradient-to-br from-gray-100 to-gray-50", textColor: "text-gray-600", borderColor: "border-l-4 border-gray-500" };
  }
};

const NotificationPage = () => {
  const { _user, accessToken } = useAuthInit();
  const navigate = useNavigate();
  const { updateUnreadCount, decrementUnreadCount } = useNotificationContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      navigate("/auth/login");
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await notificationService.getNotifications();
        setNotifications(response.data);
        
        // Update global unread count
        const unread = response.data.filter(n => n.status === "pending").length;
        updateUnreadCount(unread);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchNotifications();
    }
  }, [accessToken, updateUnreadCount]);

  const handleMarkAllAsRead = async () => {
    try {
      const pendingNotifications = notifications.filter(n => n.status === "pending");
      
      for (const notif of pendingNotifications) {
        await notificationService.markNotificationAsSeen(notif.idNotification);
      }

      const updatedNotifications = notifications.map(notif =>
        notif.status === "pending" ? { ...notif, status: "seen" } : notif
      );
      
      setNotifications(updatedNotifications);
      
      // Update global unread count
      updateUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = async (notificationId, status) => {
    if (status === "pending") {
      try {
        await notificationService.markNotificationAsSeen(notificationId);
        
        const updatedNotifications = notifications.map(notif =>
          notif.idNotification === notificationId
            ? { ...notif, status: "seen" }
            : notif
        );
        
        setNotifications(updatedNotifications);
        
        // Decrement global unread count
        decrementUnreadCount(1);
      } catch (error) {
        console.error("Failed to mark notification as seen:", error);
      }
    }
  };

  const unreadCount = notifications.filter(n => n.status === "pending").length;
  const visibleNotifications = notifications.filter(notif => notif.status !== "deleted");

  if (!accessToken) return null;

  return (
    <div className="flex-1 min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
              <p className="text-gray-500 mt-1">
                {unreadCount > 0 ? (
                  <>
                    Có <span className="text-blue-600 font-semibold">{unreadCount}</span> thông báo chưa đọc
                  </>
                ) : (
                  "Quản lý tất cả thông báo của bạn tại đây"
                )}
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="text-right">
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors duration-200 inline-flex items-center gap-2"
                >
                  <Check size={18} />
                  Đánh dấu tất cả
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 mt-4">Đang tải...</p>
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-gray-200">
            <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">Không có thông báo</h3>
            <p className="text-gray-500">Bạn đã xem hết tất cả thông báo!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleNotifications.map(notification => {
              const { icon: Icon, bgColor, textColor, borderColor } = getNotificationIcon(notification.type);
              const isUnread = notification.status === "pending";
              
              return (
                <div 
                  key={notification.idNotification} 
                  onClick={() => handleNotificationClick(notification.idNotification, notification.status)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                    isUnread
                      ? "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 shadow-sm"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-11 h-11 rounded-full ${bgColor} flex items-center justify-center mt-0.5`}>
                      <Icon className={`${textColor}`} size={22} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${isUnread ? "text-gray-900" : "text-gray-700"}`}>
                            {notification.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-1.5">
                            {dayjs(notification.createdAt).fromNow()}
                          </p>
                        </div>
                        
                        {/* Unread dot */}
                        {isUnread && (
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
