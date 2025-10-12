import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/zustand/authStore';
import websocketService from '@/services/websocket.service';
import NotificationContext from '@/contexts/NotificationContext';

export const useWebSocket = () => {
  const { user, accessToken } = useAuthStore();
  const navigate = useNavigate();
  const { showInfo } = useContext(NotificationContext);

  useEffect(() => {
    if (user && accessToken) {
      // Kết nối WebSocket khi user đã đăng nhập
      websocketService.connect();

      // Đăng ký handler cho thông báo
      const unsubscribeNotification = websocketService.onMessage('NOTIFICATION', (data) => {
        const notification = data.data;
        
        if (notification && notification.type === 'message') {
          // Hiển thị toast notification cho tin nhắn mới
          showInfo(
            notification.senderName || 'Tin nhắn mới',
            notification.content
          );
        }
      });

      // Đăng ký handler cho tin nhắn riêng tư
      const unsubscribePrivateMessage = websocketService.onMessage('private_message', (data) => {
        const message = data.message;
        const senderName = message?.sentBy?.name || message?.sentBy?.email || 'Người dùng';
        
        // Hiển thị thông báo tin nhắn mới
        showInfo(
          `Tin nhắn từ ${senderName}`,
          message?.content || 'Bạn có tin nhắn mới'
        );
      });

      // Đăng ký handler cho tin nhắn nhóm
      const unsubscribeGroupMessage = websocketService.onMessage('group_message', (data) => {
        const message = data.message;
        const senderName = message?.sentBy?.name || message?.sentBy?.email || 'Thành viên';
        const groupName = data.groupName || 'Nhóm';
        
        // Hiển thị thông báo tin nhắn nhóm mới
        showInfo(
          `${groupName}`,
          `${senderName}: ${message?.content || 'Tin nhắn mới'}`
        );
      });

      // Đăng ký handler cho trạng thái online/offline
      const unsubscribeUserOnline = websocketService.onMessage('user_online', (data) => {
        console.log(`User ${data.userId} is now online`);
        // Có thể cập nhật UI để hiển thị trạng thái online
      });

      const unsubscribeUserOffline = websocketService.onMessage('user_offline', (data) => {
        console.log(`User ${data.userId} is now offline`);
        // Có thể cập nhật UI để hiển thị trạng thái offline
      });

      // Cleanup function
      return () => {
        unsubscribeNotification();
        unsubscribePrivateMessage();
        unsubscribeGroupMessage();
        unsubscribeUserOnline();
        unsubscribeUserOffline();
      };
    } else {
      // Ngắt kết nối WebSocket khi user logout
      websocketService.disconnect();
    }
  }, [user, accessToken, showInfo]);

  // Ngắt kết nối khi component unmount
  useEffect(() => {
    return () => {
      websocketService.disconnect();
    };
  }, []);

  return {
    isConnected: websocketService.isConnected(),
    sendPrivateMessage: websocketService.sendPrivateMessage.bind(websocketService),
    sendGroupMessage: websocketService.sendGroupMessage.bind(websocketService),
    sendTyping: websocketService.sendTyping.bind(websocketService),
    markMessageRead: websocketService.markMessageRead.bind(websocketService)
  };
};