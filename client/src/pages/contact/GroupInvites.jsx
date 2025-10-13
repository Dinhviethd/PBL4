import React, { useEffect, useState, useCallback } from 'react';
import { Users2, UserCheck, UserMinus } from 'lucide-react';
import groupService from '@/services/group.service';

const GroupInvites = () => {
  const [activeInviteTab, setActiveInviteTab] = useState('received');
  const [receivedInvites, setReceivedInvites] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 8;
  const [total, setTotal] = useState(0);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      if (activeInviteTab === 'received') {
        const res = await groupService.getReceivedInvites(page, limit);
        setReceivedInvites(res.items || []);
        setTotal(res.total || 0);
      } else {
        const res = await groupService.getSentInvites(page, limit);
        setSentInvites(res.items || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeInviteTab, page]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const formatDateTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  };

  const renderAvatar = (invite, type = 'received') => {
    const user = type === 'received' ? invite.inviter : invite.invitee;
    const avatar = user?.avatarUrl;
    const initials = (user?.name || user?.fullName || invite.message || '').slice(0, 2).toUpperCase();

    if (avatar) {
      const src = avatar.startsWith('http') ? avatar : `${import.meta.env.VITE_API_URL.replace('/api', '')}${avatar}`;
      return (
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          <img src={src} alt={user?.name || 'Avatar'} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = ''; }} />
        </div>
      );
    }

    return (
      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-lg font-medium text-blue-700 flex-shrink-0">
        {initials || '?'}
      </div>
    );
  };

  const accept = async (id) => {
    setActionLoading(id);
    try {
      await groupService.acceptInvite(id);
      await fetchInvites();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const withdraw = async (id) => {
    setActionLoading(id);
    try {
      await groupService.deleteInvite(id);
      await fetchInvites();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const invites = activeInviteTab === 'received' ? receivedInvites : sentInvites;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Lời mời tham gia nhóm</h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => { setActiveInviteTab('sent'); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeInviteTab === 'sent' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Lời mời đã gửi
        </button>
        <button onClick={() => { setActiveInviteTab('received'); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeInviteTab === 'received' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Lời mời đã nhận
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Đang tải...</p>
      ) : invites.length === 0 ? (
        <div className="flex items-center justify-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <UserMinus className="w-6 h-6 text-gray-400 mr-2" />
          <p className="text-gray-500 text-sm">Không có lời mời nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => (
            <div key={invite.idInvitation} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                {renderAvatar(invite, activeInviteTab === 'received' ? 'received' : 'sent')}
                <div>
                  <p className="text-lg font-medium text-gray-800">{invite.idGroup?.name}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(invite.createdAt)}</p>
                  {invite.message && <p className="text-sm text-gray-600 mt-1">{invite.message}</p>}
                  {/* show who invited / who was invited */}
                  {activeInviteTab === 'received' ? (
                    <p className="text-sm text-gray-600 mt-1">Lời mời từ <span className="font-medium">{invite.inviter?.fullName || invite.inviter?.name || invite.inviter?.email || invite.inviter?.phone}</span></p>
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">Đã mời <span className="font-medium">{invite.invitee?.fullName || invite.invitee?.name || invite.invitee?.email || invite.invitee?.phone}</span></p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {activeInviteTab === 'received' ? (
                  <>
                    <button onClick={() => withdraw(invite.idInvitation)} disabled={actionLoading === invite.idInvitation} className="text-sm text-gray-600 bg-gray-100 px-4 py-1.5 rounded hover:bg-gray-200 transition-colors">Từ chối</button>
                    <button onClick={() => accept(invite.idInvitation)} disabled={actionLoading === invite.idInvitation} className="text-sm text-white bg-blue-500 px-4 py-1.5 rounded hover:bg-blue-600 transition-colors">Chấp nhận</button>
                  </>
                ) : (
                  <button onClick={() => withdraw(invite.idInvitation)} disabled={actionLoading === invite.idInvitation} className="text-sm text-gray-600 bg-gray-100 px-4 py-1.5 rounded hover:bg-gray-200 transition-colors">Thu hồi</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button className="px-3 py-1 border rounded hover:bg-gray-100 transition-colors" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span className="text-sm text-gray-600">Trang {page} / {totalPages}</span>
          <button className="px-3 py-1 border rounded hover:bg-gray-100 transition-colors" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next</button>
        </div>
      )}

    </div>
  );
};

export default GroupInvites;
