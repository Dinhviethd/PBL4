import api from './axios.config.js';

function normalizePaginatedResponse(res) {
  const data = res.data?.data;
  if (!data) return { items: [], total: 0, page: 1, limit: 10 };
  return {
    items: data.items || data,
    total: data.total || 0,
    page: data.page || 1,
    limit: data.limit || 10,
  };
}

const groupService = {
  getUserGroups() {
    return api.get('/groups').then(res => res.data?.data || []);
  },

  getUserGroupsPaginated(page = 1, limit = 10, q = '', sort = 'asc') {
    return api.get('/groups/list', { params: { page, limit, q, sort } }).then(res => {
      return res.data?.data || { items: [], total: 0, page, limit };
    });
  },

  getReceivedInvites(page = 1, limit = 10) {
    return api.get('/groups/invite/received', { params: { page, limit } }).then(normalizePaginatedResponse);
  },

  getSentInvites(page = 1, limit = 10) {
    return api.get('/groups/invite/sent', { params: { page, limit } }).then(normalizePaginatedResponse);
  },

  sendInvite(groupId, inviteeId, message) {
    return api.post(`/groups/${groupId}/invite`, { inviteeId, message }).then(res => res.data?.data);
  },
  acceptInvite(invitationId) {
    // server route: PUT /groups/invite/invitation/:invitationId/accept
    return api.put(`/groups/invite/invitation/${invitationId}/accept`).then(res => res.data?.data);
  },

  deleteInvite(invitationId) {
    // server route: DELETE /groups/invite/invitation/:invitationId
    return api.delete(`/groups/invite/invitation/${invitationId}`).then(res => res.data?.data);
  }
  ,
  createGroup(name, memberIds = []) {
    return api.post('/groups', { name, memberIds }).then(res => res.data?.data);
  },

  leaveGroup(groupId) {
    return api.post(`/groups/${groupId}/leave`).then(res => res.data?.data);
  },

};

export default groupService;
