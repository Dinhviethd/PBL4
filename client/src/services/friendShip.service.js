
import instance from "./axios.config";

const normalizePaginatedResponse = (resData) => {
  const d = resData || {};
  const items = d.data || [];
  const pagination = d.pagination || {};
  const total = pagination.totalItems ?? 0;
  const page = pagination.currentPage ?? 1;
  const limit = pagination.itemsPerPage ?? 10;
  return { items, total, page, limit };
};

export const getBlockedList = async () => {
  const res = await instance.get(`/friendship/blocked-list`);
  return res.data?.data || [];
};

export const getFriends = async (page = 1, limit = 10, sortField = undefined, sortOrder = undefined) => {
  const params = { page, limit };
  if (sortField) params.sortField = sortField;
  if (sortOrder) params.sortOrder = sortOrder;
  const res = await instance.get(`/friendship/list`, { params });
  return normalizePaginatedResponse(res.data);
};

export const sendFriendRequest = async (receiverId, message) => {
  if (!receiverId) throw new Error("Receiver ID is required to send a friend request.");
  const res = await instance.post(`/friendship/request`, { receiverId, message });
  return res.data;
};

export const getPendingRequests = async (page = 1, limit = 10) => {
  const res = await instance.get(`/friendship/pending`, { params: { page, limit } });
  return normalizePaginatedResponse(res.data);
};

export const getReceivedRequests = async (page = 1, limit = 10) => {
  const res = await instance.get(`/friendship/pending/received`, { params: { page, limit } });
  return normalizePaginatedResponse(res.data);
};

export const getSentRequests = async (page = 1, limit = 10) => {
  const res = await instance.get(`/friendship/pending/sent`, { params: { page, limit } });
  return normalizePaginatedResponse(res.data);
};

export const acceptFriendRequest = async (requestId) => {
  if (!requestId) throw new Error("Request ID is required to accept a friend request.");
  const res = await instance.put(`/friendship/accept/${requestId}`);
  return res.data;
};

export const deleteRequest = async (requestId) => {
  if (!requestId) throw new Error("Request ID is required to delete a friend request.");
  const res = await instance.delete(`/friendship/request/${requestId}`);
  return res.data;
};

export const deleteFriendship = async (friendId) => {
  if (!friendId) throw new Error("Friend ID is required to delete friendship.");
  const res = await instance.delete(`/friendship/${friendId}`);
  return res.data;
};

export const blockFriend = async (friendId) => {
  if (!friendId) throw new Error("Friend ID is required to block a user.");
  const res = await instance.put(`/friendship/block/${friendId}`);
  return res.data;
};

export const unblockFriend = async (friendId) => {
  if (!friendId) throw new Error("Friend ID is required to unblock a user.");
  const res = await instance.delete(`/friendship/unblock/${friendId}`);
  return res.data;
};

export const getRelationStatus = async (targetId) => {
  if (!targetId) throw new Error('targetId is required');
  const res = await instance.get(`/friendship/status/${targetId}`);
  return res.data?.data;
};
