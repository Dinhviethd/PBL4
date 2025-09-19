import React, { createContext, useState, useCallback } from 'react';
import Notification from '@/components/ui/notification';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback(({
    type = 'info',
    title,
    message,
    autoClose = true,
    duration = 5000
  }) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      title,
      message,
      autoClose,
      duration,
      isVisible: true
    };

    setNotifications(prev => [...prev, notification]);

    // Auto remove after duration if autoClose is true
    if (autoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, [removeNotification]);

  const showSuccess = useCallback((title, message) => {
    return showNotification({ type: 'success', title, message });
  }, [showNotification]);

  const showError = useCallback((title, message) => {
    return showNotification({ type: 'error', title, message, duration: 7000 });
  }, [showNotification]);

  const showWarning = useCallback((title, message) => {
    return showNotification({ type: 'warning', title, message });
  }, [showNotification]);

  const showInfo = useCallback((title, message) => {
    return showNotification({ type: 'info', title, message });
  }, [showNotification]);

  const value = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Render all notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            isVisible={notification.isVisible}
            autoClose={false} // We handle auto-close in the provider
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationContext;