// src/hooks/useWebSocket.js
import { useEffect, useRef } from 'react';
import useAuthStore from '@/zustand/authStore';
import useChatStore from '@/zustand/chatStore';

const useWebSocket = () => {
  const { token, user } = useAuthStore();
  const { 
    setSocket, 
    setIsConnected, 
    addMessage, 
    setOnlineUsers,
    setTyping 
  } = useChatStore();
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = () => {
    if (!token || !user) return;

    const ws = new WebSocket('ws://localhost:8000');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setSocket(ws);
      
      // Authenticate
      ws.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'auth_success':
            setOnlineUsers(data.onlineUsers);
            break;
            
          case 'private_message':
            addMessage(data.message);
            break;
            
          case 'group_message':
            addMessage(data.message);
            break;
            
          case 'typing':
            setTyping(data.from, data.data.isTyping);
            break;
            
          case 'user_online':
            setOnlineUsers(prev => [...prev, data.userId]);
            break;
            
          case 'user_offline':
            setOnlineUsers(prev => prev.filter(id => id !== data.userId));
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setSocket(null);
      
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socketRef.current = ws;
  };

  useEffect(() => {
    if (token && user) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [token, user]);

  const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  const sendTyping = (toUserId, isTyping) => {
    sendMessage({
      type: 'typing',
      to: toUserId,
      isTyping
    });
  };

  return { sendMessage, sendTyping };
};

export default useWebSocket;