import api from './axios.config';

class GroupService {
  async createGroup(name, memberIds) {
    const response = await api.post('/groups', {
      name,
      memberIds
    });
    return response.data;
  }

  async getUserGroups() {
    const response = await api.get('/groups');
    return response.data;
  }

  async getGroupDetails(groupId) {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  }

  async addMember(groupId, data) {
    const response = await api.post(`/groups/${groupId}/members`, data);
    return response.data;
  }

  async removeMember(groupId, memberId) {
    const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
    return response.data;
  }

  async getPendingMembers(groupId) {
    const response = await api.get(`/groups/${groupId}/pending`);
    return response.data;
  }

  async approveMember(groupId, memberId) {
    const response = await api.post(`/groups/${groupId}/members/${memberId}/approve`);
    return response.data;
  }

  async rejectMember(groupId, memberId) {
    const response = await api.post(`/groups/${groupId}/members/${memberId}/reject`);
    return response.data;
  }

  async updateGroup(groupId, data) {
    const response = await api.put(`/groups/${groupId}`, data);
    return response.data;
  }

  async deleteGroup(groupId) {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  }

  async leaveGroup(groupId) {
    const response = await api.post(`/groups/${groupId}/leave`);
    return response.data;
  }

  // Group message methods
  async getGroupMessages(groupId, page = 1, limit = 20) {
    const response = await api.get(`/messages/group/${groupId}`, {
      params: { page, limit }
    });
    return response.data;
  }

  async sendGroupMessage(data) {
    const response = await api.post('/messages/group', data);
    return response.data;
  }

  async getOlderGroupMessages(groupId, beforeMessageId, limit = 20) {
    const response = await api.get(`/messages/group/${groupId}/older`, {
      params: { beforeMessageId, limit }
    });
    return response.data;
  }
}

export default new GroupService();