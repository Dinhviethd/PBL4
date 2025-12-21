import React, { useEffect, useState, useCallback } from 'react';
import { Users2, UserCheck, UserMinus } from 'lucide-react';
import groupService from '@/services/group.service';
import { getAvatarUrl } from '@/lib/utils';
import { getGroupAvatarDisplay } from '@/utils/groupAvatar';
import { useNotification } from '@/hooks/useNotification';

const GroupInvites = () => {
  const [activeInviteTab, setActiveInviteTab] = useState('received');
  const [pendingAdminInvites, setPendingAdminInvites] = useState([]);
  const { showSuccess, showError } = useNotification();
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
        setReceivedInvites(res.data?.items || []);
        setTotal(res.data?.total || 0);
      } else if (activeInviteTab === 'sent') {
        const res = await groupService.getSentInvites(page, limit);
        setSentInvites(res.data?.items || []);
        setTotal(res.data?.total || 0);
      } else if (activeInviteTab === 'admin') {
        const res = await groupService.getInvitesNeedAdminApprove(page, limit);
        console.log('[GroupInvites] getInvitesNeedAdminApprove result:', res);
        setPendingAdminInvites(res.data?.items || []);
        setTotal(res.data?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeInviteTab, page]);

  // Fetch all invites on mount to show counts in tabs
  useEffect(() => {
    const fetchAllCounts = async () => {
      try {
        const receivedRes = await groupService.getReceivedInvites(1, 10);
        setReceivedInvites(receivedRes.data?.items || []);
        const sentRes = await groupService.getSentInvites(1, 10);
        setSentInvites(sentRes.data?.items || []);
        const adminRes = await groupService.getInvitesNeedAdminApprove(1, 10);
        setPendingAdminInvites(adminRes.data?.items || []);
      } catch (err) {
        console.error('Failed to fetch group invites counts:', err);
      }
    };
    fetchAllCounts();
  }, []);

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
    // Nếu là lời mời nhóm, hiển thị avatar nhóm bằng tiện ích getGroupAvatarDisplay
    const groupName = invite.idGroup?.name || '';
    if (groupName) {
      return (
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          <img src={getGroupAvatarDisplay(groupName)} alt={groupName} className="w-full h-full object-cover" />
        </div>
      );
    }
    // Nếu không có tên nhóm, fallback về avatar user như cũ
    const user = type === 'received' ? invite.inviter : invite.invitee;
    const avatar = user?.avatarUrl;
    const initials = (user?.name || user?.fullName || invite.message || '').slice(0, 2).toUpperCase();
    if (avatar) {
      const src = avatar.startsWith('http') ? avatar : `${import.meta.env.VITE_API_URL.replace('/api', '')}${avatar}`;
      return (
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          <img src={getAvatarUrl(src)} alt={user?.name || 'Avatar'} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = getAvatarUrl(''); }} />
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
      showSuccess('Thành công', 'Bạn đã tham gia nhóm!');
      await fetchInvites();
    } catch (err) {
      console.error(err);
      showError('Lỗi', err?.message || 'Không thể chấp nhận lời mời');
    } finally {
      setActionLoading(null);
    }
  };

  const withdraw = async (id) => {
    setActionLoading(id);
    try {
      await groupService.deleteInvite(id);
      showSuccess('Thành công', 'Lời mời đã được từ chối');
      await fetchInvites();
    } catch (err) {
      console.error(err);
      showError('Lỗi', err?.message || 'Không thể từ chối lời mời');
    } finally {
      setActionLoading(null);
    }
  };

  const invites = activeInviteTab === 'received' ? receivedInvites : activeInviteTab === 'sent' ? sentInvites : pendingAdminInvites;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Lời mời tham gia nhóm</h2>
        {activeInviteTab === 'received' && invites.length > 0 && (
          <p className="text-gray-600 text-sm">
            Có <span className="text-blue-600 font-semibold">{invites.length}</span> lời mời chưa xử lý
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => { setActiveInviteTab('sent'); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeInviteTab === 'sent' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Lời mời đã gửi {sentInvites.length > 0 && <span className="ml-2 inline-block">{sentInvites.length}</span>}
        </button>
        <button onClick={() => { setActiveInviteTab('received'); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeInviteTab === 'received' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Lời mời đã nhận {receivedInvites.length > 0 && <span className="ml-2 inline-block">{receivedInvites.length}</span>}
        </button>
        <button onClick={() => { setActiveInviteTab('admin'); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeInviteTab === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Lời mời chờ xử lý {pendingAdminInvites.length > 0 && <span className="ml-2 inline-block">{pendingAdminInvites.length}</span>}
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
                  invite.status === 'pending' ? (
                    <>
                      <button onClick={() => withdraw(invite.idInvitation)} disabled={actionLoading === invite.idInvitation} className="text-sm text-gray-600 bg-gray-100 px-4 py-1.5 rounded hover:bg-gray-200 transition-colors">Từ chối</button>
                      <button onClick={() => accept(invite.idInvitation)} disabled={actionLoading === invite.idInvitation} className="text-sm text-white bg-blue-500 px-4 py-1.5 rounded hover:bg-blue-600 transition-colors">Chấp nhận</button>
                    </>
                  ) : invite.status === 'accepted' ? (
                    <span className="text-sm text-yellow-600 bg-yellow-100 px-4 py-1.5 rounded">Đang chờ admin duyệt</span>
                  ) : null
                ) : activeInviteTab === 'admin' ? (
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
