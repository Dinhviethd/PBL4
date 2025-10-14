import instance from './axios.config';

export const groupService = {
  createGroup: async (data) => {
    const response = await instance.post('/groups', data);
    return response.data;
  },

  getUserGroups: async () => {
    const response = await instance.get('/groups');
    return response.data;
  },

  getGroupDetails: async (groupId) => {
    const response = await instance.get(`/groups/${groupId}`);
    return response.data;
  },

  addMember: async (groupId, userId) => {
    const response = await instance.post(`/groups/${groupId}/members`, { userId });
    return response.data;
  },

  removeMember: async (groupId, memberId) => {
    const response = await instance.delete(`/groups/${groupId}/members/${memberId}`);
    return response.data;
  },

  updateGroup: async (groupId, data) => {
    const response = await instance.put(`/groups/${groupId}`, data);
    return response.data;
  },

  deleteGroup: async (groupId) => {
    const response = await instance.delete(`/groups/${groupId}`);
    return response.data;
  },

  leaveGroup: async (groupId) => {
    const response = await instance.post(`/groups/${groupId}/leave`);
    return response.data;
  }
};