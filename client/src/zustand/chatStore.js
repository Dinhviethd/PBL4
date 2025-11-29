import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useChatStore = create(
  persist(
    (set) => ({
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

      // Call state
      activeCall: null, // { callId, callType, fromUserId, toUserId, startTime }
      isCallModalOpen: false,
      isCaller: false,
      callConnectionState: 'new', // new, connecting, connected, disconnected, failed, closed

      // Actions
      setSocket: (socket) => set({ socket }),
      
      setIsConnected: (isConnected) => set({ isConnected }),
      
      setConversations: (conversations) => set({ conversations }),
      
      setActiveConversation: (conversation) => set({ activeConversation: conversation }),
      
      // Call actions
      setActiveCall: (call) => set({ activeCall: call }),
      
      setIsCallModalOpen: (isOpen) => set({ isCallModalOpen: isOpen }),
      
      setIsCaller: (isCaller) => set({ isCaller }),
      
      setCallConnectionState: (state) => set({ callConnectionState: state }),
      
      clearActiveCall: () => set({
        activeCall: null,
        isCallModalOpen: false,
        isCaller: false,
        callConnectionState: 'new'
      }),
      
      addConversation: (conversation) =>
        set((state) => {
          const existingIndex = state.conversations.findIndex(c => 
            c.type === conversation.type && 
            (c.partnerId === conversation.partnerId || c.groupId === conversation.groupId)
          );
          
          if (existingIndex >= 0) {
            // Update existing conversation
            const updatedConversations = [...state.conversations];
            updatedConversations[existingIndex] = { ...updatedConversations[existingIndex], ...conversation };
            return { conversations: updatedConversations };
          } else {
            // Add new conversation to the beginning
            return { conversations: [conversation, ...state.conversations] };
          }
        }),
      
      updateConversation: (type, id, updates) =>
        set((state) => {
          const updatedConversations = state.conversations.map(conv => {
            if (type === 'private' && conv.type === 'private' && conv.partnerId === id) {
              return { ...conv, ...updates };
            } else if (type === 'group' && conv.type === 'group' && conv.groupId === id) {
              return { ...conv, ...updates };
            }
            return conv;
          });
          return { conversations: updatedConversations };
        }),
      
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
        set((state) => {
          // Kiểm tra xem group đã tồn tại chưa
          const existingGroup = state.groups.find(g => g.idGroup === group.idGroup);
          if (existingGroup) {
            return state; // Không thêm nếu đã tồn tại
          }
          return { groups: [group, ...state.groups] };
        }),
      
      updateGroup: (groupId, updates) =>
        set((state) => ({
          groups: state.groups.map(g => g.idGroup === groupId ? { ...g, ...updates } : g)
        })),
      
      removeGroup: (groupId) =>
        set((state) => ({ 
          groups: state.groups.filter(g => g.idGroup !== groupId),
          // Also remove related conversations
          conversations: state.conversations.filter(c => 
            !(c.type === 'group' && c.groupId === groupId)
          )
        })),
      
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

      // SỬA LẠI LOGIC loadInitialData với memberCount thực tế
      loadInitialData: async () => {
        try {
          const messageService = await import('@/services/message.service');
          const groupService = await import('@/services/group.service');
          
          // Load conversations and groups in parallel
          const [conversationsResponse, groupsResponse] = await Promise.all([
            messageService.default.getRecentConversations(),
            groupService.default.getUserGroups()
          ]);
          
          const recentConversations = conversationsResponse.data || [];
          const userGroups = groupsResponse.data || [];
          
          
          // SỬA LẠI: Xử lý cấu trúc mới - userGroups đã là array của group objects
          // Kiểm tra cấu trúc dữ liệu và xử lý phù hợp
          let mappedGroups;
          if (userGroups.length > 0 && userGroups[0].group) {
            // Cấu trúc cũ: GroupUser objects với relation group
            mappedGroups = userGroups
              .filter(groupUser => groupUser && groupUser.group)
              .map(groupUser => ({
                id: groupUser.id,
                idGroup: groupUser.group.idGroup,
                name: groupUser.group.name || 'Unknown Group',
                createdAt: groupUser.group.createdAt,
                createdBy: groupUser.group.createdBy,
                role: groupUser.role,
                statusGroup: groupUser.group.statusGroup !== false
              }));
          } else {
            // Cấu trúc mới: Trực tiếp là group objects
            mappedGroups = userGroups
              .filter(group => group && group.idGroup)
              .map(group => ({
                idGroup: group.idGroup,
                name: group.name || 'Unknown Group',
                createdAt: group.createdAt,
                createdBy: group.createdBy,
                role: group.role || 'user', // Default role
                statusGroup: group.statusGroup !== false
              }));
          }
          
          set({ groups: mappedGroups });
          
          // Transform groups to conversations với memberCount thực tế
          const groupConversations = await Promise.all(
            mappedGroups.map(async (group) => {
              let memberCount = 1; // Default fallback
              
              try {
                // Lấy số lượng thành viên thực tế
                const membersResponse = await groupService.default.getGroupMembers(group.idGroup);
                memberCount = membersResponse.data ? membersResponse.data.length : 1;
              } catch (error) {
                console.warn(`Failed to get member count for group ${group.idGroup}:`, error);
              }
              
              return {
                type: 'group',
                groupId: group.idGroup,
                group: {
                  idGroup: group.idGroup,
                  name: group.name,
                  createdAt: group.createdAt,
                  createdBy: group.createdBy
                },
                lastMessage: null,
                lastMessageTime: group.createdAt || new Date(),
                lastMessageType: null,
                unreadCount: 0,
                memberCount: memberCount // Số lượng thành viên thực tế
              };
            })
          );
          
          // Merge recent conversations with group conversations
          const allConversations = [...recentConversations];
          
          // Add group conversations that are not in recent conversations
          groupConversations.forEach(groupConv => {
            const exists = allConversations.find(conv => 
              conv.type === 'group' && conv.groupId === groupConv.groupId
            );
            if (!exists) {
              allConversations.push(groupConv);
            } else {
              // Update existing conversation with memberCount
              const existingIndex = allConversations.findIndex(conv => 
                conv.type === 'group' && conv.groupId === groupConv.groupId
              );
              if (existingIndex >= 0) {
                allConversations[existingIndex].memberCount = groupConv.memberCount;
              }
            }
          });
          
          // Sort by lastMessageTime
          allConversations.sort((a, b) => {
            const timeA = new Date(a.lastMessageTime || 0).getTime();
            const timeB = new Date(b.lastMessageTime || 0).getTime();
            return timeB - timeA;
          });
                    
          set({ conversations: allConversations });
          
        } catch (error) {
          console.error('Failed to load initial data:', error);
          // Set empty arrays để tránh lỗi UI
          set({ 
            conversations: [], 
            groups: [] 
          });
        }
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
        }),

      // Select group by ID from conversations
      selectGroupById: (groupId) => 
        set((state) => {
          const groupConversation = state.conversations.find(
            conv => conv.type === 'group' && conv.groupId === groupId
          );
          if (groupConversation) {
            return { activeConversation: groupConversation };
          }
          return {};
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