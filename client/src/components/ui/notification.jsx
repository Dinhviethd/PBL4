import React, { useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

const Notification = ({ 
  type = "info", 
  title, 
  message, 
  isVisible, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}) => {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  if (!isVisible) return null;

  const getNotificationStyles = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          titleColor: "text-green-800",
          messageColor: "text-green-700",
          icon: CheckCircle
        };
      case "error":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          titleColor: "text-red-800",
          messageColor: "text-red-700",
          icon: XCircle
        };
      case "warning":
        return {
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          iconColor: "text-yellow-600",
          titleColor: "text-yellow-800",
          messageColor: "text-yellow-700",
          icon: AlertCircle
        };
      default: // info
        return {
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          iconColor: "text-blue-600",
          titleColor: "text-blue-800",
          messageColor: "text-blue-700",
          icon: Info
        };
    }
  };

  const styles = getNotificationStyles();
  const IconComponent = styles.icon;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`
        max-w-md w-full rounded-lg border shadow-lg p-4
        ${styles.bgColor} ${styles.borderColor}
      `}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <IconComponent className={`h-5 w-5 ${styles.iconColor}`} />
          </div>
          <div className="ml-3 flex-1">
            {title && (
              <h3 className={`text-sm font-medium ${styles.titleColor}`}>
                {title}
              </h3>
            )}
            {message && (
              <p className={`${title ? 'mt-1' : ''} text-sm ${styles.messageColor}`}>
                {message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className={`
                inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${styles.iconColor} hover:bg-white hover:bg-opacity-20
              `}
            >
              <span className="sr-only">Đóng</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;