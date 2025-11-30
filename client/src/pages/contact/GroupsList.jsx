import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, MoreHorizontal, LogOut, UserPlus, Eye, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import groupService from '@/services/group.service';
import { useContext } from 'react';
import NotificationContext from '@/contexts/NotificationContext';

const GroupsList = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(null);
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [invitableUsers, setInvitableUsers] = useState([]);
  const [loadingInvitable, setLoadingInvitable] = useState(false);
  const { showSuccess, showError } = useContext(NotificationContext);

  const [groups, setGroups] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 15;
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await groupService.getUserGroupsPaginated(page, limit, searchTerm, sortOrder === 'asc' ? 'asc' : 'desc');
        
        if (!mounted) return;
        
        // SỬA LẠI: Xử lý cấu trúc mới - có thể là group objects trực tiếp
        let mappedGroups;
        const items = res.items || res.data || [];
        
        if (items.length > 0 && items[0].group) {
          // Cấu trúc cũ: GroupUser objects
          mappedGroups = items.map(groupUser => ({
            id: groupUser.id,
            idGroup: groupUser.group.idGroup,
            name: groupUser.group.name,
            createdAt: groupUser.group.createdAt,
            createdBy: groupUser.group.createdBy,
            role: groupUser.role,
            statusGroup: groupUser.group.statusGroup
          }));
        } else {
          // Cấu trúc mới: Group objects trực tiếp
          mappedGroups = items.map(group => ({
            idGroup: group.idGroup,
            name: group.name,
            createdAt: group.createdAt,
            createdBy: group.createdBy,
            role: group.role || 'user',
            statusGroup: group.statusGroup
          }));
        }
        
        setGroups(mappedGroups);
        setTotal(res.total || 0);
      } catch (e) {
        console.error('❌ [GroupsList] Error loading groups:', e);
      }
    };
    load();

    // listen for group creation events and reload
    const onGroupsCreated = () => {
      // reset to first page and reload
      setPage(1);
      load();
    };
    window.addEventListener('groups:created', onGroupsCreated);
    return () => { mounted = false; window.removeEventListener('groups:created', onGroupsCreated); };
  }, [page, limit, searchTerm, sortOrder]);

  // Fetch invitable users khi mở modal mời
  useEffect(() => {
    if (!selectedGroupForInvite) return;

    const loadInvitableUsers = async () => {
      setLoadingInvitable(true);
      try {
        console.log('📍 Loading invitable users for group:', selectedGroupForInvite.idGroup);
        const res = await groupService.getInvitableUsers(selectedGroupForInvite.idGroup);
        console.log('📍 Invitable users response:', res);
        setInvitableUsers(res || []);
      } catch (err) {
        console.error('❌ Error loading invitable users:', err);
        showError('Lỗi', 'Không thể tải danh sách người dùng để mời');
      } finally {
        setLoadingInvitable(false);
      }
    };

    loadInvitableUsers();
  }, [selectedGroupForInvite, showError]);

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    return avatar.startsWith("http")
      ? avatar
      : `${import.meta.env.VITE_API_URL.replace("/api", "")}${avatar}`;
  };

  const handleInviteUser = async (userId) => {
    try {
      console.log('👤 Inviting user', userId, 'to group', selectedGroupForInvite.idGroup);
      const response = await groupService.inviteUserToGroup(selectedGroupForInvite.idGroup, userId);
      console.log('✅ Invite response:', response);
      showSuccess('Thành công', 'Đã gửi lời mời!');
      // Cập nhật lại danh sách - xóa user đã mời
      setInvitableUsers(prev => prev.filter(u => u.id !== userId && u.idUser !== userId));
    } catch (err) {
      console.error('❌ Invite error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Không thể gửi lời mời';
      showError('Lỗi', errMsg);
    }
  };

  const handleGroupClick = (group) => {
    // Navigate to chat page and show this group
    // Store group ID in sessionStorage so ChatPage can load it
    sessionStorage.setItem('selectedGroupId', group.idGroup);
    navigate('/');
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Danh sách nhóm ({groups.length})</h2>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} type="text" placeholder="Tìm kiếm..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer" onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}>
            <span className="text-sm text-gray-600">Tên ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          {groups.map(group => (
            <div key={group.idGroup} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => handleGroupClick(group)}>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-blue-600">{(group.name || '').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{group.name}</p>
                  <p className="text-xs text-gray-500">Vai trò: {group.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sessionStorage.setItem('selectedGroupId', group.idGroup);
                    navigate('/');
                  }}
                  className="p-2 hover:bg-blue-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Mở tin nhắn"
                >
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </button>
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === `group-${group.idGroup}` ? null : `group-${group.idGroup}`);
                    }}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
                  {openDropdown === `group-${group.idGroup}` && (
                    <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="py-2">
                        <button className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                          <Eye className="w-5 h-5" />
                          Xem thông tin
                        </button>
                        {group.role === 'admin' && (
                          <button 
                            onClick={() => {
                              setSelectedGroupForInvite(group);
                              setShowInviteModal(true);
                              setOpenDropdown(null);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-blue-600 hover:bg-blue-50"
                          >
                            <UserPlus className="w-5 h-5" />
                            Mời vào nhóm
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setConfirmLeave(group);
                            setOpenDropdown(null);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-5 h-5" />
                          Rời khỏi nhóm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Hiển thị {groups.length} trong {total} kết quả</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50" disabled={page <= 1}>Trước</button>
              <div className="px-3 py-1 border rounded">{page}</div>
              <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded" disabled={page * limit >= total}>Tiếp</button>
            </div>
          </div>
        )}

        {/* Confirm leave modal */}
        {confirmLeave && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg p-6 w-80">
              <h3 className="text-lg font-semibold mb-4">Rời khỏi nhóm</h3>
              <p className="mb-6">Bạn có chắc muốn rời khỏi <span className="font-medium">{confirmLeave.name}</span> không?</p>
              <div className="flex justify-end gap-4">
                <button className="px-4 py-2 rounded-lg border" onClick={() => setConfirmLeave(null)}>Hủy</button>
                <button className="px-4 py-2 rounded-lg bg-red-600 text-white" onClick={async () => {
                  try {
                    await groupService.leaveGroup(confirmLeave.idGroup);
                    showSuccess('Thành công', `Bạn đã rời nhóm "${confirmLeave.name}"`);
                    setGroups(prev => prev.filter(g => g.idGroup !== confirmLeave.idGroup));
                    setConfirmLeave(null);
                  } catch (err) {
                    console.error(err);
                    const msg = err?.response?.data?.message || err?.message || 'Không thể rời nhóm';
                    showError('Lỗi', msg);
                  }
                }}>Rời</button>
              </div>
            </div>
          </div>
        )}

        {/* Invite user modal */}
        {showInviteModal && selectedGroupForInvite && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-auto">
              <h3 className="text-lg font-semibold mb-4">Mời vào nhóm: {selectedGroupForInvite.name}</h3>
              
              {/* Search box */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm bạn bè..."
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {loadingInvitable ? (
                <p className="text-gray-600 text-center py-4">Đang tải...</p>
              ) : invitableUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Không có bạn bè nào để mời</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {invitableUsers
                    .filter(user => {
                      const term = inviteSearch.toLowerCase();
                      return (user.name || '').toLowerCase().includes(term) ||
                             (user.email || '').toLowerCase().includes(term);
                    })
                    .map(user => {
                      const avatarUrl = getAvatarUrl(user.avatarUrl);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {avatarUrl ? (
                              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-100">
                                <img
                                  src={avatarUrl}
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.parentNode.innerHTML = `<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs">${user.name[0].toUpperCase()}</div>`;
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs">
                                {user.name[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-medium text-gray-800">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleInviteUser(user.id)}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                          >
                            Mời
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="flex justify-end gap-4 mt-6">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedGroupForInvite(null);
                    setInviteSearch('');
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsList;
