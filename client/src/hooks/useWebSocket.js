
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
    _getConversationKey,
    addConversation
  } = useChatStore();
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);

  const connect = () => {
    const { user, accessToken } = useAuthStore.getState();
    if (!accessToken || !user) {
      console.log('Missing auth data for WebSocket connection');
      return;
    }

    // KIỂM TRA USERID - có thể là user.id hoặc user.userId thay vì user.idUser
    const userId = user.idUser || user.id || user.userId;

    if (!userId) {
      console.error('Cannot extract userId from user object:', user);
      return;
    }

    try {
      // const backendIP = '192.168.34.177';
      const backendIP = 'localhost';
      const backendPort = '8000';
      const ws = new WebSocket(`ws://${backendIP}:${backendPort}`);
      
      console.log(` Connecting to WebSocket: ws://${backendIP}:${backendPort}`);
      
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

        ws.send(JSON.stringify(authMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'auth_success': {
              // Ensure onlineUsers is always an array
              const onlineUsers = Array.isArray(data.onlineUsers) 
                ? data.onlineUsers 
                : (data.onlineUsers && typeof data.onlineUsers === 'object' 
                    ? Object.values(data.onlineUsers) 
                    : []);
              setOnlineUsers(onlineUsers);
              break;
            }
              
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

            case 'GROUP_MEMBER_KICKED':
              handleGroupMemberKicked(data.data);
              break;

            case 'GROUP_UPDATED':
              handleGroupUpdated(data.data);
              break;
              
            
            // Handle all CALL_* signaling messages
            case 'CALL_INITIATE':
            case 'CALL_INITIATE_RESPONSE':
            case 'CALL_OFFER':
            case 'CALL_ANSWER':
            case 'CALL_ICE_CANDIDATE':
            case 'CALL_ACCEPT':
            case 'CALL_DECLINE':
            case 'CALL_END':
            case 'CALL_ERROR': {
              // Dispatch signaling message to window for useCallSignaling to handle
              window.dispatchEvent(new CustomEvent('callSignalingMessage', { detail: data }));
              break;
            }
            
            default:
              console.log('Unknown WebSocket message type:', data.type);
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(' WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        
        // Attempt to reconnect after 3 seconds
        if (reconnectAttempts.current < 5) {
          console.log(`Attempting to reconnect... (${reconnectAttempts.current + 1}/5)`);
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error(' WebSocket error:', error);
      };

      socketRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  const handlePrivateMessage = (messageData) => {
    
    // Extract actual message data (backend wraps it in 'data' field)
    const data = messageData.data || messageData;
    const conversationKey = `private_${data.sender.idUser}`;
    
    // Check if message already exists (avoid duplicate)
    const state = useChatStore.getState();
    const existingMessages = state.messages[conversationKey] || [];
    const isDuplicate = existingMessages.some(msg => msg.idMessage === data.idMessage);
    
    if (isDuplicate) {
      console.log(`⚠️  [WebSocket] Message ${data.idMessage} already exists, skipping`);
      return;
    }
    
    
    // Add message to store with full structure
    addMessage(conversationKey, {
      idMessage: data.idMessage,
      content: data.content,
      type: data.type,
      fileURL: data.fileURL,
      createdAt: data.createdAt,
      isEdited: data.isEdited || false,
      isDeleted: data.isDeleted || false,
      isRead: data.isRead || false,
      sender: data.sender,
      sentBy: data.sentBy || data.sender
    });
    
    
    // Update conversation's last message
    // Check if conversation already exists
    const existingConversation = state.conversations.find(conv => 
      conv.type === 'private' && conv.partnerId === data.sender.idUser
    );
    
    if (existingConversation) {
      // Update existing conversation - increment unreadCount
      const currentUserId = user?.idUser || user?.id || user?.userId;
      const isOwnMessage = data.sender.idUser === currentUserId;
      
      addConversation({
        type: 'private',
        partnerId: data.sender.idUser,
        partner: data.sender,
        lastMessage: data.content,
        lastMessageTime: data.createdAt,
        lastMessageType: data.type,
        unreadCount: isOwnMessage ? 0 : (existingConversation.unreadCount || 0) + 1
      });
    } else {
      // Create new conversation
      addConversation({
        type: 'private',
        partnerId: data.sender.idUser,
        partner: data.sender,
        lastMessage: data.content,
        lastMessageTime: data.createdAt,
        lastMessageType: data.type,
        unreadCount: 1
      });
    }
  };

  const handleGroupMessage = (messageData) => {
    console.log('📬 [WebSocket] Received GROUP_MESSAGE:', messageData);
    
    // Extract actual message data (backend wraps it in 'data' field)
    const data = messageData.data || messageData;
    const conversationKey = `group_${data.groupId}`;
    
    // Check if message already exists (avoid duplicate)
    const state = useChatStore.getState();
    const existingMessages = state.messages[conversationKey] || [];
    const isDuplicate = existingMessages.some(msg => msg.idMessage === data.idMessage);
    
    if (isDuplicate) {
      console.log(`⚠️  [WebSocket] Message ${data.idMessage} already exists, skipping`);
      return;
    }
    
    console.log(`✅ [WebSocket] Adding message to conversation: ${conversationKey}`);
    
    // Add message to store with full structure
    addMessage(conversationKey, {
      idMessage: data.idMessage,
      content: data.content,
      type: data.type,
      fileURL: data.fileURL,
      createdAt: data.createdAt,
      isEdited: data.isEdited || false,
      isDeleted: data.isDeleted || false,
      isRead: data.isRead || false,
      sender: data.sender,
      sentBy: data.sentBy || data.sender,
      groupId: data.groupId
    });
    
    
    // Update conversation's last message
    // Check if conversation already exists
    const existingConversation = state.conversations.find(conv => 
      conv.type === 'group' && conv.groupId === data.groupId
    );
    
    if (existingConversation) {
      // Update existing conversation - increment unreadCount
      const currentUserId = user?.idUser || user?.id || user?.userId;
      const isOwnMessage = data.sender.idUser === currentUserId;
      
      addConversation({
        type: 'group',
        groupId: data.groupId,
        group: {
          idGroup: data.groupId,
          name: data.groupName || existingConversation.group?.name
        },
        lastMessage: data.content,
        lastMessageTime: data.createdAt,
        lastMessageType: data.type,
        unreadCount: isOwnMessage ? 0 : (existingConversation.unreadCount || 0) + 1
      });
    } else {
      // Create new conversation
      addConversation({
        type: 'group',
        groupId: data.groupId,
        group: {
          idGroup: data.groupId,
          name: data.groupName
        },
        lastMessage: data.content,
        lastMessageTime: data.createdAt,
        lastMessageType: data.type,
        unreadCount: 1
      });
    }
  };
  const handleGroupMemberKicked = (data) => {
    console.log("handleGroupMemberKicked", data)
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
    console.log('📖 [WebSocket] MESSAGE_READ event:', data);
    
    // data: { conversationKey, readBy, readAt, messageIds }
    
    if (data.conversationKey) {
      const { conversationKey, readBy } = data;
      const state = useChatStore.getState();
      const conversationMessages = state.messages[conversationKey] || [];
      const currentUserId = user?.idUser || user?.id || user?.userId;
      
      
      // Only update if someone ELSE read the messages (not current user)
      // This means current user is the SENDER and should see checkmarks
      if (readBy === currentUserId) {
        console.log('⚠️ [WebSocket] Current user read their own messages, skipping update');
        return;
      }
      
      conversationMessages.forEach(msg => {
        const senderId = msg.sender?.idUser || msg.sentBy?.idUser;
        
        // Only mark messages sent BY current user as read
        if (senderId === currentUserId) {
          updateMessage(conversationKey, msg.idMessage, {
            isRead: true,
            readAt: data.readAt
          });
        }
      });
      
    } 
    // If reading a single message
    else if (data.messageId) {
      const { messageId } = data;
      const state = useChatStore.getState();
      
      // Find which conversation contains this message
      Object.keys(state.messages).forEach(conversationKey => {
        const messages = state.messages[conversationKey] || [];
        const message = messages.find(msg => msg.idMessage === messageId);
        
        if (message) {
          updateMessage(conversationKey, messageId, {
            isRead: true,
            readAt: data.readAt
          });
        }
      });
    }
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
    // Remove group from store and UI
    const { groupId } = data;
    if (groupId) {
      useChatStore.getState().removeGroup(groupId);
      // Optional: show notification or redirect
      if (window.location.pathname.startsWith('/chat')) {
        window.location.href = '/'; // Redirect to home or another page
      }
    }
  };

  const handleGroupDeleted = (data) => {
    console.log('Group deleted:', data);
  };
    const handleGroupUpdated = (data) => {
      // Cập nhật thông tin nhóm trong conversations (cả group.name và name ở root)
      const state = useChatStore.getState();
      const updatedConversations = state.conversations.map(conv => {
        if (conv.type === 'group' && conv.groupId === data.groupId) {
          return {
            ...conv,
            name: data.name, // Đảm bảo đồng bộ tên ở root
            group: {
              ...conv.group,
              name: data.name,
              statusGroup: data.statusGroup
            }
          };
        }
        return conv;
      });
      useChatStore.setState({ conversations: updatedConversations });
      console.log('Group updated:', data);
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
    // Only run once on component mount and when accessToken changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

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