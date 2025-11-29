import instance from './axios.config';

const messageService = {
  // Send private message
  sendPrivateMessage: async (receiverId, content, type = 'text', fileURL = null) => {
    try {
      const response = await instance.post('/messages/private', {
        receiverId,
        content,
        type,
        fileURL
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send message' };
    }
  },

  // Send group message
  sendGroupMessage: async (groupId, content, type = 'text', fileURL = null) => {
    try {
      const response = await instance.post(`/messages/group/${groupId}`, {
        content,
        type,
        fileURL
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send message' };
    }
  },

  // Get private messages
  getPrivateMessages: async (partnerId, page = 1, limit = 20) => {
    try {
      const response = await instance.get(`/messages/private/${partnerId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch messages' };
    }
  },

  // Get group messages
  getGroupMessages: async (groupId, page = 1, limit = 20) => {
    try {
      const response = await instance.get(`/messages/group/${groupId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch messages' };
    }
  },

  // Edit message
  editMessage: async (messageId, content) => {
    try {
      const response = await instance.put(`/messages/${messageId}`, { content });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to edit message' };
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await instance.delete(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete message' };
    }
  },

  // Mark as read
  markAsRead: async (messageId) => {
    try {
      const response = await instance.post(`/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark as read' };
    }
  },

  // Mark all messages in a conversation as read
  markConversationAsRead: async (type, id) => {
    console.log(`🟢 [MessageService] markConversationAsRead called - type: ${type}, id: ${id}`);
    try {
      // type: 'private' or 'group'
      // id: partnerId or groupId
      const endpoint = type === 'private' 
        ? `/messages/private/${id}/mark-read` 
        : `/messages/group/${id}/mark-read`;
      console.log(`📡 [MessageService] POST ${endpoint}`);
      const response = await instance.post(endpoint);
      console.log(`✅ [MessageService] markConversationAsRead success:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ [MessageService] markConversationAsRead failed:`, error.response?.data || error);
      throw error.response?.data || { message: 'Failed to mark conversation as read' };
    }
  },

  // Get recent conversations
  getRecentConversations: async () => {
    try {
      const response = await instance.get('/messages/conversations/recent');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch conversations' };
    }
  }
};

export default messageService;