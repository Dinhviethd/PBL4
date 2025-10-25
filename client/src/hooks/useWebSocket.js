// src/hooks/useWebSocket.js
import { useEffect, useRef } from 'react';
import useAuthStore from '@/zustand/authStore';
import useChatStore from '@/zustand/chatStore';

const useWebSocket = () => {
  const { accessToken, user } = useAuthStore();
  const { 
    setSocket, 
    setIsConnected, 
    addMessage,
    updateMessage,
    deleteMessage,
    setOnlineUsers,
    setTyping,
    getConversationKey,
    addConversation
  } = useChatStore();
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);

  const connect = () => {
    const { user, accessToken } = useAuthStore.getState();

    console.log('WebSocket connect - user:', user);
    console.log('WebSocket connect - accessToken:', accessToken);

    if (!accessToken || !user) {
      console.log('Missing auth data for WebSocket connection');
      return;
    }

    // KIỂM TRA USERID - có thể là user.id hoặc user.userId thay vì user.idUser
    const userId = user.idUser || user.id || user.userId;
    console.log('Extracted userId:', userId);

    if (!userId) {
      console.error('Cannot extract userId from user object:', user);
      return;
    }

    try {
      const ws = new WebSocket('ws://localhost:8000');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setSocket(ws);
        reconnectAttempts.current = 0;

        // Authenticate với userId đã extract
        const authMessage = {
          type: 'auth',
          token: accessToken,
          userId: userId,
        };

        console.log('Sending auth message:', authMessage);
        ws.send(JSON.stringify(authMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'auth_success':
              console.log('WebSocket authenticated successfully');
              setOnlineUsers(data.onlineUsers || []);
              break;
              
            case 'PRIVATE_MESSAGE':
              handlePrivateMessage(data.data);
              break;
              
            case 'GROUP_MESSAGE':
              handleGroupMessage(data.data);
              break;
              
            case 'MESSAGE_EDITED':
              handleMessageEdited(data.data);
              break;
              
            case 'MESSAGE_DELETED':
              handleMessageDeleted(data.data);
              break;
              
            case 'MESSAGE_READ':
              handleMessageRead(data.data);
              break;
              
            case 'TYPING':
              setTyping(data.from, data.data.isTyping);
              break;
              
            case 'USER_ONLINE':
              setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
              break;
              
            case 'USER_OFFLINE':
              setOnlineUsers(prev => prev.filter(id => id !== data.userId));
              break;

            case 'GROUP_ADDED':
              handleGroupAdded(data.data);
              break;

            case 'GROUP_APPROVED':
              handleGroupApproved(data.data);
              break;

            case 'USER_LEFT_GROUP':
              handleUserLeftGroup(data.data);
              break;

            case 'KICKED_FROM_GROUP':
              handleKickedFromGroup(data.data);
              break;

            case 'GROUP_DELETED':
              handleGroupDeleted(data.data);
              break;
            
            default:
              console.log('Unknown WebSocket message type:', data.type);
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socketRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  const handlePrivateMessage = (data) => {
    const conversationKey = `private_${data.sender.idUser}`;
    addMessage(conversationKey, data);
    
    // Add to conversations if not exists
    addConversation({
      type: 'private',
      partnerId: data.sender.idUser,
      partner: data.sender,
      lastMessage: data.content,
      lastMessageTime: data.createdAt,
      unreadCount: 1
    });
  };

  const handleGroupMessage = (data) => {
    const conversationKey = `group_${data.groupId}`;
    addMessage(conversationKey, data);
    
    // Add to conversations if not exists
    addConversation({
      type: 'group',
      groupId: data.groupId,
      group: {
        idGroup: data.groupId,
        name: data.groupName
      },
      lastMessage: data.content,
      lastMessageTime: data.createdAt,
      unreadCount: 1
    });
  };

  const handleMessageEdited = (data) => {
    const userId = user?.idUser || user?.id || user?.userId;
    const conversationKey = data.groupId 
      ? `group_${data.groupId}` 
      : `private_${userId === data.senderId ? data.receiverId : data.senderId}`;
    
    updateMessage(conversationKey, data.messageId, {
      content: data.newContent,
      isEdited: true,
      editedAt: data.editedAt
    });
  };

  const handleMessageDeleted = (data) => {
    const userId = user?.idUser || user?.id || user?.userId;
    const conversationKey = data.groupId 
      ? `group_${data.groupId}` 
      : `private_${userId === data.senderId ? data.receiverId : data.senderId}`;
    
    deleteMessage(conversationKey, data.messageId);
  };

  const handleMessageRead = (data) => {
    console.log('Message read:', data);
  };

  const handleGroupAdded = (data) => {
    addConversation({
      type: 'group',
      groupId: data.groupId,
      group: {
        idGroup: data.groupId,
        name: data.groupName
      },
      lastMessage: null,
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    });
  };

  const handleGroupApproved = (data) => {
    console.log('Approved to group:', data);
  };

  const handleUserLeftGroup = (data) => {
    console.log('User left group:', data);
  };

  const handleKickedFromGroup = (data) => {
    console.log('Kicked from group:', data);
  };

  const handleGroupDeleted = (data) => {
    console.log('Group deleted:', data);
  };

  useEffect(() => {
    if (accessToken && user) {
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
  }, [accessToken, user]);

  const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  const sendTyping = (toUserId, isTyping) => {
    return sendMessage({
      type: 'typing',
      to: toUserId,
      isTyping
    });
  };

  return { sendMessage, sendTyping };
};

export default useWebSocket;
