import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  // Conversations
  conversations: [],
  currentConversation: null,
  
  // Messages
  messages: [],
  isLoadingMessages: false,
  messagesPage: 1,
  hasMoreMessages: false,
  
  // Groups
  groups: [],
  currentGroup: null,
  
  // WebSocket
  socket: null,
  isConnected: false,
  
  // Online users
  onlineUsers: [],
  
  // UI states
  selectedChatType: 'private', // 'private' | 'group'
  typingUsers: new Map(),
  
  // Actions
  setConversations: (conversations) => set({ conversations }),
  
  setCurrentConversation: (conversation) => set({ 
    currentConversation: conversation,
    selectedChatType: 'private',
    messages: [],
    messagesPage: 1
  }),
  
  setCurrentGroup: (group) => set({ 
    currentGroup: group,
    selectedChatType: 'group',
    messages: [],
    messagesPage: 1
  }),
  
  setMessages: (messages, hasMore = false) => set({ 
    messages,
    hasMoreMessages: hasMore,
    isLoadingMessages: false
  }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  prependMessages: (messages) => set((state) => ({
    messages: [...messages, ...state.messages]
  })),
  
  setSocket: (socket) => set({ socket }),
  setIsConnected: (isConnected) => set({ isConnected }),
  
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  setTyping: (userId, isTyping) => set((state) => {
    const newTypingUsers = new Map(state.typingUsers);
    if (isTyping) {
      newTypingUsers.set(userId, true);
    } else {
      newTypingUsers.delete(userId);
    }
    return { typingUsers: newTypingUsers };
  }),
  
  setGroups: (groups) => set({ groups }),
  
  setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  
  incrementPage: () => set((state) => ({ messagesPage: state.messagesPage + 1 })),
  
  resetChat: () => set({
    currentConversation: null,
    currentGroup: null,
    messages: [],
    messagesPage: 1,
    hasMoreMessages: false
  })
}));

export default useChatStore;