import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useChatStore = create(
  persist(
    (set, get) => ({
      // WebSocket connection
      socket: null,
      isConnected: false,
      
      // Conversations
      conversations: [],
      activeConversation: null,
      
      // Messages
      messages: {},
      
      // Groups
      groups: [],
      
      // Online users
      onlineUsers: [],
      
      // Typing indicators
      typingUsers: {},
      
      // Unread counts
      unreadCounts: {},

      // Actions
      setSocket: (socket) => set({ socket }),
      
      setIsConnected: (isConnected) => set({ isConnected }),
      
      setConversations: (conversations) => set({ conversations }),
      
      setActiveConversation: (conversation) => set({ activeConversation: conversation }),
      
      addConversation: (conversation) =>
        set((state) => ({
          conversations: [conversation, ...state.conversations.filter(c => 
            c.type !== conversation.type || 
            (c.partnerId !== conversation.partnerId && c.groupId !== conversation.groupId)
          )]
        })),
      
      setMessages: (conversationKey, messages) =>
        set((state) => ({
          messages: { ...state.messages, [conversationKey]: messages }
        })),
      
      addMessage: (conversationKey, message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationKey]: [...(state.messages[conversationKey] || []), message]
          }
        })),
      
      updateMessage: (conversationKey, messageId, updates) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationKey]: state.messages[conversationKey]?.map(msg =>
              msg.idMessage === messageId ? { ...msg, ...updates } : msg
            )
          }
        })),
      
      deleteMessage: (conversationKey, messageId) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationKey]: state.messages[conversationKey]?.map(msg =>
              msg.idMessage === messageId ? { ...msg, isDeleted: true } : msg
            )
          }
        })),
      
      setGroups: (groups) => set({ groups }),
      
      addGroup: (group) =>
        set((state) => ({ groups: [group, ...state.groups] })),
      
      updateGroup: (groupId, updates) =>
        set((state) => ({
          groups: state.groups.map(g => g.idGroup === groupId ? { ...g, ...updates } : g)
        })),
      
      removeGroup: (groupId) =>
        set((state) => ({ groups: state.groups.filter(g => g.idGroup !== groupId) })),
      
      setOnlineUsers: (users) => set({ onlineUsers: users }),
      
      setTyping: (userId, isTyping) =>
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [userId]: isTyping
          }
        })),
      
      setUnreadCount: (conversationKey, count) =>
        set((state) => ({
          unreadCounts: { ...state.unreadCounts, [conversationKey]: count }
        })),
      
      clearUnreadCount: (conversationKey) =>
        set((state) => {
          const newCounts = { ...state.unreadCounts };
          delete newCounts[conversationKey];
          return { unreadCounts: newCounts };
        }),

      // Helper functions
      getConversationKey: (conversation) => {
        return conversation.type === 'private' 
          ? `private_${conversation.partnerId}`
          : `group_${conversation.groupId}`;
      },

      clearAll: () =>
        set({
          socket: null,
          isConnected: false,
          conversations: [],
          activeConversation: null,
          messages: {},
          groups: [],
          onlineUsers: [],
          typingUsers: {},
          unreadCounts: {}
        })
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        messages: state.messages,
        groups: state.groups,
        unreadCounts: state.unreadCounts
      })
    }
  )
);

export default useChatStore;