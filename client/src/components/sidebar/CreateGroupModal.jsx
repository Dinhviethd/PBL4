import React, { useState, useEffect, useContext } from 'react';
import FriendSelector from './FriendSelector';
import UserLookup from './UserLookup';
import SelectedUsers from './SelectedUsers';
import groupService from '@/services/group.service';
import { getFriends } from '@/services/friendShip.service';
import userService from '@/services/user.service.js';
import NotificationContext from '@/contexts/NotificationContext';

export default function CreateGroupModal({ isOpen, onClose, currentUser }) {
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const { showSuccess, showError } = useContext(NotificationContext);

  useEffect(() => {
    let mounted = true;
    if (isOpen) {
      // server validates `limit` and rejects values >100; request 100 to avoid silent failure
      getFriends(1, 100).then(res => {
        if (!mounted) return;
        const items = res.items || [];
        const normalized = items.map(u => ({
          idUser: u.idUser ?? u.id,
          name: u.fullName ?? u.name ?? u.email,
          avatarUrl: u.avatarUrl ?? '/images/avatar-default-icon.png',
          email: u.email,
          phone: u.phone,
        }));
        setFriends(normalized);
      }).catch((err) => {
        console.error('Failed to load friends for CreateGroupModal', err);
        showError?.('Lấy danh sách bạn bè thất bại', err?.response?.data?.message || err?.message || 'Lỗi mạng');
      });
    }
    return () => { mounted = false };
  }, [isOpen, showError]);

  useEffect(() => {
    if (!searchTerm.trim()) return setSearchResults([]);
    const timer = setTimeout(async () => {
      try {
        const isEmail = searchTerm.includes('@');
        const lookupParams = isEmail ? { email: searchTerm.trim() } : { phone: searchTerm.trim() };
        const res = await userService.lookup(lookupParams);
        if (res) {
          if (res.idUser === currentUser?.idUser) {
            setSearchResults([]);
            return;
          }
          const userObj = {
            idUser: res.idUser ?? res.id,
            name: res.fullName ?? res.name ?? res.email,
            avatarUrl: res.avatarUrl ?? '/images/avatar-default-icon.png',
            email: res.email,
            phone: res.phone,
          };
          setSearchResults([userObj]);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, currentUser?.idUser]);

  const removeSelectedUser = (idUser) => setSelectedUsers(prev => prev.filter(u => u.idUser !== idUser));

  const handleToggleUser = (userObj) => {
    if (userObj?.idUser === currentUser?.idUser) return;
    if (selectedUsers.some(u => u.idUser === userObj.idUser)) {
      setSelectedUsers(prev => prev.filter(u => u.idUser !== userObj.idUser));
    } else {
      setSelectedUsers(prev => [...prev, userObj]);
    }
  };

  const onCreate = async () => {
    setCreateError(null);
    if (!groupName.trim()) return setCreateError('Tên nhóm không được để trống');
    
    // SỬA LẠI: Không yêu cầu phải có ít nhất 2 thành viên, có thể tạo group rỗng và thêm sau
    const memberIds = selectedUsers.map(u => u.idUser).filter(id => id !== currentUser?.idUser);
    
    setCreating(true);
    try {
      console.log('Creating group with members:', memberIds);
      const created = await groupService.createGroup(groupName.trim(), memberIds);
      
      // Hiển thị thông báo với thông tin chi tiết
      const memberCount = memberIds.length;
      const successMessage = memberCount > 0 
        ? `Nhóm "${groupName.trim()}" đã được tạo thành công với ${memberCount} thành viên.`
        : `Nhóm "${groupName.trim()}" đã được tạo thành công.`;
      
      showSuccess('Tạo nhóm', successMessage);
      
      try {
        window.dispatchEvent(new CustomEvent('groups:created', { detail: created }));
      } catch {
        console.warn('Failed to dispatch groups:created event');
      }
      
      // Reset form
      setGroupName(''); 
      setSearchTerm(''); 
      setSearchResults([]); 
      setSelectedUsers([]);
      onClose();
      
    } catch (err) {
      console.error('Error creating group:', err);
      const message = err?.response?.data?.message || err?.message || 'Tạo nhóm thất bại';
      setCreateError(message);
      showError('Tạo nhóm thất bại', message);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[420px] max-h-[90vh] overflow-auto">
        <h3 className="text-lg font-semibold mb-3">Tạo nhóm mới</h3>

        <label className="text-sm text-gray-600">Tên nhóm</label>
        <input 
          value={groupName} 
          onChange={(e) => setGroupName(e.target.value)} 
          className="w-full border px-3 py-2 rounded mt-1 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400" 
          placeholder="Nhập tên nhóm..."
        />

        <label className="text-sm text-gray-600">Chọn bạn bè</label>
        <div className="max-h-32 overflow-auto border rounded p-2 mb-3">
          <FriendSelector friends={friends} selected={selectedUsers} onToggle={handleToggleUser} />
        </div>

        <label className="text-sm text-gray-600">Thêm thành viên bằng email hoặc số điện thoại</label>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Nhập email hoặc số điện thoại" 
          className="w-full border px-3 py-2 rounded mt-1 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400" 
        />

        <div className="max-h-40 overflow-auto border rounded p-2 mb-3 space-y-1">
          {searchTerm && searchResults.length === 0 && (
            <p className="text-sm text-red-500">Không tìm thấy người dùng</p>
          )}
          <UserLookup results={searchResults} selected={selectedUsers} onToggle={handleToggleUser} />
        </div>

        {selectedUsers.length > 0 && (
          <div className="mb-3">
            <label className="text-sm text-gray-600">Thành viên đã chọn ({selectedUsers.length}):</label>
            <SelectedUsers users={selectedUsers} onRemove={removeSelectedUser} />
          </div>
        )}

        {createError && <p className="text-sm text-red-600 mb-2">{createError}</p>}

        <div className="flex justify-end gap-2">
          <button 
            onClick={onClose} 
            className="px-3 py-2 rounded border hover:bg-gray-50"
            disabled={creating}
          >
            Hủy
          </button>
          <button 
            disabled={creating || !groupName.trim()} 
            onClick={onCreate} 
            className="px-3 py-2 rounded bg-blue-500 text-white disabled:opacity-60 hover:bg-blue-600"
          >
            {creating ? 'Đang tạo...' : 'Tạo'}
          </button>
        </div>
      </div>
    </div>
  );
}
