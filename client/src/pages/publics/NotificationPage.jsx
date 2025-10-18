import { useAuthInit } from "@/hooks/useAuthInit";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Users, MessageCircle, Phone } from "lucide-react";
import notificationService from "@/services/notification.service";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const getNotificationIcon = (type) => {
  switch (type) {
    case "friendRequest":
      return { icon: Users, bgColor: "bg-blue-100", textColor: "text-blue-600", title: "Thông báo bạn bè" };
    case "message":
      return { icon: MessageCircle, bgColor: "bg-green-100", textColor: "text-green-600", title: "Thông báo hộp thư" };
    case "call":
      return { icon: Phone, bgColor: "bg-purple-100", textColor: "text-purple-600", title: "Thông báo cuộc gọi" };
    default:
      return { icon: MessageCircle, bgColor: "bg-gray-100", textColor: "text-gray-600", title: "Thông báo" };
  }
};

const NotificationPage = () => {
  const { _user, accessToken } = useAuthInit();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!accessToken) {
      navigate("/auth/login");
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationService.getNotifications();
        setNotifications(response.data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    if (accessToken) {
      fetchNotifications();
    }
  }, [accessToken]);

  if (!accessToken) return null;

  return (
    <div className="flex-1 h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Thông báo</h1>
          
          <div className="space-y-4">
            {notifications
              .filter(notif => notif.status !== "deleted")
              .map(notification => {
                const { icon: Icon, bgColor, textColor, title } = getNotificationIcon(notification.type);
                
                return (
                  <div key={notification.idNotification} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition cursor-pointer relative">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center`}>
                        <Icon className={`${textColor}`} size={20} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{title}</p>
                      <p className="text-sm text-gray-500">{notification.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {dayjs(notification.createdAt).fromNow()}
                      </p>
                    </div>
                    {notification.status === "pending" && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
