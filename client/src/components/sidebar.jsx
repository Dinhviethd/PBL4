import React, { useState, useEffect, useContext } from "react";
import { useAuthInit } from "@/hooks/useAuthInit";
import { NavLink } from "react-router-dom";
import { MessageCircle, Users, Bell, UserPlus, Settings, PlusSquare } from "lucide-react";
import groupService from '@/services/group.service';
import { getFriends } from '@/services/friendShip.service';
import PopupInfo from "../components/profile/PopupInfor";
import userService from '@/services/user.service.js';
import NotificationContext from '@/contexts/NotificationContext';

const links = [
  { to: "/", label: "Tin nhắn", icon: <MessageCircle size={22} /> },
  { to: "/contact", label: "Bạn bè", icon: <Users size={22} /> },
  { to: "/notifications", label: "Thông báo", icon: <Bell size={22} /> },
  { to: "/add-friend", label: "Thêm bạn", icon: <UserPlus size={22} /> },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const { user } = useAuthInit();
  const { showSuccess, showError } = useContext(NotificationContext);

  useEffect(() => {
    let mounted = true;
    if (showCreate) {
      getFriends(1, 100).then(res => {
        if (!mounted) return;
        const items = res.items || [];
        const normalized = items.map(u => ({
          idUser: u.idUser ?? u.id,
          name: u.fullName ?? u.name ?? u.email,
          avatarUrl: u.avatarUrl ?? "/images/avatar-default-icon.png",
          email: u.email,
          phone: u.phone,
        }));
        setFriends(normalized);
      }).catch(() => {});
    }
    return () => { mounted = false };
  }, [showCreate]);

  // search user by email or phone
  useEffect(() => {
    if (!searchTerm.trim()) return setSearchResults([]);
    const timer = setTimeout(async () => {
      try {
        const isEmail = searchTerm.includes('@');
        const lookupParams = isEmail ? { email: searchTerm.trim() } : { phone: searchTerm.trim() };
        const res = await userService.lookup(lookupParams);
        if (res) {
          if (res.idUser === user?.id) {
            setSearchResults([]);
            return;
          }
          const userObj = {
            idUser: res.idUser ?? res.id,
            name: res.fullName ?? res.name ?? res.email,
            avatarUrl: res.avatarUrl ?? "/images/avatar-default-icon.png",
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
  }, [searchTerm, user?.id]);

  const avatarUrl = user?.avatarUrl
    ? user.avatarUrl.startsWith("http")
      ? user.avatarUrl
      : `${import.meta.env.VITE_API_URL.replace("/api", "")}${user.avatarUrl}`
    : "/images/avatar-default-icon.png";

  const removeSelectedUser = (idUser) => {
    setSelectedUsers(prev => prev.filter(u => u.idUser !== idUser));
  };

  const handleToggleUser = (userObj) => {
    if (userObj?.idUser === user?.idUser) return;
    if (selectedUsers.some(u => u.idUser === userObj.idUser)) {
      setSelectedUsers(prev => prev.filter(u => u.idUser !== userObj.idUser));
    } else {
      setSelectedUsers(prev => [...prev, userObj]);
    }
  };

  return (
    <nav className="w-20 h-screen bg-white border-r border-gray-200 flex flex-col justify-between py-4 shadow-sm relative">
      {/* Avatar */}
      <div>
        <div className="flex justify-center mb-6 relative">
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-12 h-12 rounded-full border-2 border-blue-500 object-cover shadow-md cursor-pointer"
            onClick={() => setIsOpen(true)}
            onError={(e) => { e.target.onerror = null; e.target.src = "/images/avatar-default-icon.png"; }}
          />
          {isOpen && <PopupInfo isOpen={isOpen} onClose={() => setIsOpen(false)} />}
        </div>

        {/* Nav links */}
        <div className="flex flex-col items-center gap-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group
                 ${isActive ? "bg-blue-50 text-blue-600 border-2 border-blue-500 shadow-md" : "text-gray-600 hover:bg-gray-100"}`
              }
            >
              {link.icon}
              <span className="absolute left-14 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">
                {link.label}
              </span>
            </NavLink>
          ))}

          {/* Create group button */}
          <button
            onClick={() => setShowCreate(true)}
            className="w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group text-gray-600 hover:bg-gray-100"
            title="Tạo nhóm"
          >
            <PlusSquare size={22} />
            <span className="absolute left-14 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">Tạo nhóm</span>
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="flex justify-center">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group
             ${isActive ? "bg-blue-50 text-blue-600 border-2 border-blue-500 shadow-md" : "text-gray-600 hover:bg-gray-100"}`
          }
        >
          <Settings size={22} />
          <span className="absolute left-14 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">
            Cài đặt
          </span>
        </NavLink>
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[420px] max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-3">Tạo nhóm mới</h3>

            {/* Group Name */}
            <label className="text-sm text-gray-600">Tên nhóm</label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border px-3 py-2 rounded mt-1 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {/* Friend list */}
            <label className="text-sm text-gray-600">Chọn bạn bè</label>
            <div className="max-h-32 overflow-auto border rounded p-2 mb-3">
              {friends.length === 0 ? (
                <p className="text-sm text-gray-500">Không có bạn bè hoặc đang tải...</p>
              ) : (
                friends.map(f => (
                  <label
                    key={`friend-${f.idUser}`}
                    className="flex items-center gap-2 text-sm mb-1 cursor-pointer hover:bg-gray-100 rounded p-1"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.some(u => u.idUser === f.idUser)}
                      onChange={() => handleToggleUser(f)}
                      className="w-4 h-4 text-blue-500 rounded"
                    />
                    <img
                      src={f.avatarUrl || "/images/avatar-default-icon.png"}
                      alt={f.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span>{f.name}</span>
                  </label>
                ))
              )}
            </div>

            {/* Search user */}
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
              {searchResults.map(u => (
                <label
                  key={`search-${u.idUser}`}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 rounded p-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.some(s => s.idUser === u.idUser)}
                    onChange={() => handleToggleUser(u)}
                    className="w-4 h-4 text-blue-500 rounded"
                  />
                  <img
                    src={u.avatarUrl || "/images/avatar-default-icon.png"}
                    alt={u.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span>{u.name}</span>
                </label>
              ))}
            </div>

            {/* Selected users */}
            {selectedUsers.length > 0 && (
              <div className="mb-3">
                <label className="text-sm text-gray-600">Thành viên đã chọn:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedUsers.map(u => (
                    <div key={`selected-${u.idUser}`} className="flex items-center gap-1 bg-blue-100 text-blue-800 rounded px-2 py-1 text-xs">
                      <img src={u.avatarUrl || "/images/avatar-default-icon.png"} className="w-5 h-5 rounded-full object-cover" />
                      <span>{u.name}</span>
                      <button onClick={() => removeSelectedUser(u.idUser)} className="ml-1 text-red-500 font-bold">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {createError && <p className="text-sm text-red-600 mb-2">{createError}</p>}

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-3 py-2 rounded border">Hủy</button>
              <button
                disabled={creating}
                onClick={async () => {
                  setCreateError(null);
                  if (!groupName.trim()) return setCreateError('Tên nhóm không được để trống');
                  if (selectedUsers.length < 2) return setCreateError('Vui lòng chọn ít nhất 2 thành viên');
                  const memberIds = selectedUsers.map(u => u.idUser);
                  setCreating(true);
                  try {
                    // Ensure we don't send the creator's id in memberIds
                    const filteredMemberIds = memberIds.filter(id => id !== user?.idUser);
                    const created = await groupService.createGroup(groupName.trim(), filteredMemberIds);
                    showSuccess('Tạo nhóm', `Nhóm "${groupName.trim()}" đã được tạo thành công.`);
                    // notify other parts of the app to refresh the groups list
                    try {
                      window.dispatchEvent(new CustomEvent('groups:created', { detail: created }));
                    } catch {
                      // ignore in non-browser environments
                    }
                    setShowCreate(false);
                    setGroupName('');
                    setSearchTerm('');
                    setSearchResults([]);
                    setSelectedUsers([]);
                  } catch (err) {
                    console.error("Error creating group:", err);
                    const message = err?.response?.data?.message || err?.message || 'Tạo nhóm thất bại';
                    setCreateError(message);
                    showError('Tạo nhóm thất bại', message);
                  } finally {
                    setCreating(false);
                  }
                }}
                className="px-3 py-2 rounded bg-blue-500 text-white disabled:opacity-60"
              >
                {creating ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
