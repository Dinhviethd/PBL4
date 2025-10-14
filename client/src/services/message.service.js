import instance from './axios.config';

export const messageService = {
  // Private messages
  sendPrivateMessage: async (data) => {
    const response = await instance.post('/messages/private', data);
    return response.data;
  },

  getPrivateMessages: async (friendId, page = 1, limit = 20, search = '') => {
    const response = await instance.get(`/messages/private/${friendId}`, {
      params: { page, limit, search }
    });
    return response.data;
  },

  getOlderPrivateMessages: async (friendId, lastMessageId, limit = 20) => {
    const response = await instance.get(`/messages/private/${friendId}/older`, {
      params: { lastMessageId, limit }
    });
    return response.data;
  },

  // Group messages
  sendGroupMessage: async (data) => {
    const response = await instance.post('/messages/group', data);
    return response.data;
  },

  getGroupMessages: async (groupId, page = 1, limit = 20, search = '') => {
    const response = await instance.get(`/messages/group/${groupId}`, {
      params: { page, limit, search }
    });
    return response.data;
  },

  getOlderGroupMessages: async (groupId, lastMessageId, limit = 20) => {
    const response = await instance.get(`/messages/group/${groupId}/older`, {
      params: { lastMessageId, limit }
    });
    return response.data;
  },

  // Other
  deleteMessage: async (messageId) => {
    const response = await instance.delete(`/messages/${messageId}`);
    return response.data;
  },

  getRecentConversations: async () => {
    const response = await instance.get('/messages/conversations');
    return response.data;
  }
};