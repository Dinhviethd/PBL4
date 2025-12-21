import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    
    // Yêu cầu phải chọn ít nhất 2 người bạn để tạo nhóm
    const memberIds = selectedUsers.map(u => u.idUser).filter(id => id !== currentUser?.idUser);
    
    if (memberIds.length < 2) {
      return setCreateError('Vui lòng chọn ít nhất 2 người bạn để tạo nhóm');
    }
    
    setCreating(true);
    try {
      console.log('Creating group with members:', memberIds);
      const created = await groupService.createGroup(groupName.trim(), memberIds);
      
      // Hiển thị thông báo với thông tin chi tiết
      const memberCount = memberIds.length;
      const successMessage = `Nhóm "${groupName.trim()}" đã được tạo thành công với ${memberCount} thành viên.`;
      
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-blue-600"
            >
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Tạo nhóm mới
              </h3>
              <p className="text-blue-50 text-sm mt-1">Chọn ít nhất 2 người bạn để bắt đầu</p>
            </motion.div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Group Name Input */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="space-y-2"
              >
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Tên nhóm
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)} 
                  className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" 
                  placeholder="Ví dụ: Nhóm học tập, Du lịch hè..."
                  maxLength={50}
                />
                <div className="text-xs text-gray-500 text-right">{groupName.length}/50</div>
              </motion.div>

              {/* Friend Selector */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="space-y-2"
              >
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Danh sách bạn bè
                </label>
                <div className="max-h-48 overflow-auto border-2 border-gray-200 rounded-xl p-3 bg-gray-50">
                  {friends.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm">Chưa có bạn bè nào</p>
                    </div>
                  ) : (
                    <FriendSelector friends={friends} selected={selectedUsers} onToggle={handleToggleUser} />
                  )}
                </div>
              </motion.div>

              {/* Search by Email/Phone */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="space-y-2"
              >
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Tìm kiếm thêm thành viên
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Nhập email hoặc số điện thoại..." 
                    className="w-full border-2 border-gray-200 px-4 py-3 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" 
                  />
                  <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <AnimatePresence>
                  {searchTerm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="max-h-40 overflow-auto border-2 border-gray-200 rounded-xl p-3 bg-white">
                        {searchResults.length === 0 ? (
                          <div className="text-center py-4 text-gray-400">
                            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm">Không tìm thấy người dùng</p>
                          </div>
                        ) : (
                          <UserLookup results={searchResults} selected={selectedUsers} onToggle={handleToggleUser} />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Selected Users */}
              <AnimatePresence>
                {selectedUsers.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Thành viên đã chọn
                      </span>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full"
                      >
                        {selectedUsers.length} người
                      </motion.span>
                    </label>
                    <div className="border-2 border-blue-200 rounded-xl p-3 bg-blue-50">
                      <SelectedUsers users={selectedUsers} onRemove={removeSelectedUser} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer with Error and Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="px-6 py-4 border-t border-gray-100 bg-gray-50"
            >
              <AnimatePresence>
                {createError && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-3 overflow-hidden"
                  >
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-700 font-medium">{createError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose} 
                  className="px-5 py-2.5 rounded-xl border-2 border-gray-300 font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  disabled={creating}
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ scale: creating || !groupName.trim() || selectedUsers.length < 2 ? 1 : 1.02 }}
                  whileTap={{ scale: creating || !groupName.trim() || selectedUsers.length < 2 ? 1 : 0.98 }}
                  disabled={creating || !groupName.trim() || selectedUsers.length < 2} 
                  onClick={onCreate} 
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                  title={selectedUsers.length < 2 ? 'Vui lòng chọn ít nhất 2 người bạn' : ''}
                >
                  {creating ? (
                    <>
                      <motion.svg
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </motion.svg>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tạo nhóm
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
