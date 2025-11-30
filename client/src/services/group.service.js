import instance from './axios.config';

const groupService = {
  // Create group
  createGroup: async (name, memberIds = []) => {
    try {
      // Tạo group trước
      const response = await instance.post('/groups', { name });
      const group = response.data;
      
      // Nếu có memberIds, thêm từng member vào group
      if (memberIds && memberIds.length > 0) {
        const addMemberPromises = memberIds.map(userId => 
          groupService.addMember(group.data.idGroup, userId)
        );
        
        try {
          await Promise.all(addMemberPromises);
          console.log('All members added successfully');
        } catch (error) {
          console.warn('Some members could not be added:', error);
          // Không throw error ở đây để group vẫn được tạo thành công
        }
      }
      
      return group;
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

  // Get user groups with pagination
  getUserGroupsPaginated: async (page = 1, limit = 10, searchTerm = '', sortOrder = 'asc') => {
    try {
      const response = await instance.get('/groups/my-groups', {
        params: { page, limit, search: searchTerm, sort: sortOrder }
      });
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
  },


  // Invite user to group
inviteUserToGroup: async (groupId, userId, message = '') => {
  try {
    const validGroupId = Number(groupId);
    const validUserId = Number(userId);

    console.log('[FRONTEND] inviteUserToGroup:', { groupId, userId, validGroupId, validUserId, message });

    if (isNaN(validGroupId) || isNaN(validUserId)) {
      console.error('[FRONTEND] groupId hoặc userId không hợp lệ!', { groupId, userId });
      throw { message: 'groupId hoặc userId không hợp lệ!' };
    }

    const response = await instance.post(`/groups/invite`, {
      groupId: validGroupId,
      inviteeId: validUserId,
      message
    });

    console.log('[FRONTEND] inviteUserToGroup response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[FRONTEND] inviteUserToGroup error:', error);
    throw error.response?.data || { message: 'Failed to invite user' };
  }
},

  // Get received invites
  getReceivedInvites: async (page = 1, limit = 8) => {
    try {
      const response = await instance.get('/groups/invites/received', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch received invites' };
    }
  },

  // Get sent invites
  getSentInvites: async (page = 1, limit = 8) => {
    try {
      const response = await instance.get('/groups/invites/sent', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch sent invites' };
    }
  },

  // Accept invite
  acceptInvite: async (inviteId) => {
    try {
      const response = await instance.post(`/groups/invites/${inviteId}/accept`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to accept invite' };
    }
  },

  // Delete invite
  deleteInvite: async (inviteId) => {
    try {
      const response = await instance.delete(`/groups/invites/${inviteId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete invite' };
    }
  }
};

export default groupService;
