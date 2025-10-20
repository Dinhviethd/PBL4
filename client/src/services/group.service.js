import instance from './axios.config';

const groupService = {
  // Create group
  createGroup: async (name) => {
    try {
      const response = await instance.post('/groups', { name });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create group' };
    }
  },

  // Add member to group
  addMember: async (groupId, userId) => {
    try {
      const response = await instance.post(`/groups/${groupId}/members`, { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add member' };
    }
  },

  // Approve pending member
  approveMember: async (groupId, userId) => {
    try {
      const response = await instance.patch(`/groups/${groupId}/members/approve`, { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to approve member' };
    }
  },

  // Leave group
  leaveGroup: async (groupId) => {
    try {
      const response = await instance.delete(`/groups/${groupId}/leave`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to leave group' };
    }
  },

  // Kick member
  kickMember: async (groupId, userId) => {
    try {
      const response = await instance.delete(`/groups/${groupId}/members`, { 
        data: { userId } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to kick member' };
    }
  },

  // Delete group
  deleteGroup: async (groupId) => {
    try {
      const response = await instance.delete(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete group' };
    }
  },

  // Get group members
  getGroupMembers: async (groupId) => {
    try {
      const response = await instance.get(`/groups/${groupId}/members`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch members' };
    }
  },

  // Get user groups
  getUserGroups: async () => {
    try {
      const response = await instance.get('/groups/my-groups');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch groups' };
    }
  },

  // Get pending members
  getPendingMembers: async (groupId) => {
    try {
      const response = await instance.get(`/groups/${groupId}/pending`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pending members' };
    }
  }
};

export default groupService;