import React, { useState, useContext, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvatarUrl } from '@/lib/utils';
void motion;
import { Search, X, UserPlus2 } from 'lucide-react';
import userService from '@/services/user.service.js';
import * as friendshipService from '@/services/friendShip.service';
import NotificationContext from '@/contexts/NotificationContext';
import useAuthStore from '@/zustand/authStore';
import PopupInfor from '@/components/profile/PopupInfor';
import { useNavigate } from 'react-router-dom';

export default function AddFriendPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [requestStatus, setRequestStatus] = useState('none'); // 'none' | 'sent' | 'friend' | 'received'
  const [requestId, setRequestId] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const { showError, showSuccess } = useContext(NotificationContext);
  const [inviteMessage, setInviteMessage] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const onSearch = async () => {
    if (!query.trim()) return setResult(null);
    setLoading(true);
    try {
      const isEmail = query.includes('@');
      const params = isEmail ? { email: query.trim() } : { phone: query.trim() };
      const res = await userService.lookup(params);
      if (res) {
        // if lookup result is the current user, open the profile popup
        const foundId = res.idUser ?? res.id;
        const myId = currentUser?.idUser ?? currentUser?.id;
        if (foundId && myId && String(foundId) === String(myId)) {
          setShowProfilePopup(true);
          setResult(null);
        } else {
          setResult(res);
          setShowProfilePopup(false);
        }
      } else {
        // No user found — show notification and don't open popup
        showError('Không tìm thấy', 'Không tìm thấy người dùng phù hợp với từ khóa của bạn.');
        setResult(null);
        setShowProfilePopup(false);
      }
    } catch (err) {
      console.error('Lookup error', err);
      showError('Lỗi tìm kiếm', err?.response?.data?.message || err?.message || 'Tìm kiếm thất bại');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // When a result is set, check relation using the status endpoint
  useEffect(() => {
    let mounted = true;
    const loadRelation = async () => {
      if (!result) return;
      try {
        const targetId = result.idUser ?? result.id;
        if (!targetId) return;
        const rel = await friendshipService.getRelationStatus(targetId).catch(() => null);
        if (!mounted) return;
        if (!rel) {
          setRequestStatus('none');
          setRequestId(null);
          return;
        }
        setRequestStatus(rel.status || 'none');
        setRequestId(rel.requestId || null);
      } catch (err) {
        console.error('Error loading friendship relation', err);
      }
    };
    loadRelation();
    return () => { mounted = false; };
  }, [result]);

  // Helper to navigate to chat with the user
  const navigateToChat = useCallback(() => {
    const id = result?.idUser ?? result?.id;
    if (!id) return;
    navigate(`/?user=${id}`);
  }, [navigate, result]);

  const onSendRequest = async () => {
    const targetId = result?.idUser ?? result?.id;
    if (!targetId) return;
    setRequestLoading(true);
    try {
      const res = await friendshipService.sendFriendRequest(targetId, inviteMessage || '');
      // attempt to extract id from response (server may return in different shapes)
      const maybeId = res?.data?.idFriendShip || res?.data?.id || res?.idFriendShip || res?.id || res?.data?.id || null;
      if (maybeId) setRequestId(maybeId);
      setRequestStatus('sent');
      showSuccess('Đã gửi lời mời', `Lời mời đã được gửi tới ${result?.name || 'người dùng'}`);
      setInviteMessage('');
    } catch (err) {
      console.error('Send friend request error', err);
      showError('Gửi thất bại', err?.response?.data?.message || err?.message || 'Không thể gửi lời mời');
    } finally {
      setRequestLoading(false);
    }
  };

  const onCancelRequest = async () => {
    // try to resolve request id if missing
    let rid = requestId;
    if (!rid) {
      try {
        const sent = await friendshipService.getSentRequests(1, 1000).catch(() => null);
        const sentMatch = (sent?.items || []).find(s => String((s.receiver?.id ?? s.receiverId)) === String(result?.idUser ?? result?.id));
        if (sentMatch) rid = sentMatch.id || sentMatch.requestId || sentMatch.idFriendShip || null;
      } catch { /* ignore */ }
    }
    if (!rid) return;
    setRequestLoading(true);
    try {
      await friendshipService.deleteRequest(rid);
      setRequestStatus('none');
      setRequestId(null);
      showSuccess('Đã thu hồi', `Lời mời tới ${result?.name || 'người dùng'} đã được thu hồi`);
    } catch (err) {
      console.error('Cancel request error', err);
      showError('Thu hồi thất bại', err?.response?.data?.message || err?.message || 'Không thể thu hồi lời mời');
    } finally {
      setRequestLoading(false);
    }
  };

  const formatBirthday = (birthday) => {
    if (!birthday) return '—';
    // birthday can be 'YYYY-MM-DD' or a Date string
    try {
      if (typeof birthday === 'string' && birthday.includes('-')) {
        const parts = birthday.split('-');
        if (parts.length >= 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const d = new Date(birthday);
      if (isNaN(d.getTime())) return '—';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    } catch {
      return '—';
    }
  };

  // Small inline component to navigate to chat — prevents duplicated button markup
  const MessageButton = ({ className = '' }) => (
    <button onClick={navigateToChat} className={`px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 ${className}`}>Nhắn tin</button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl shadow-2xl p-8 w-full max-w-lg"
      >
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">Kết bạn mới</h1>
        <p className="text-center text-gray-500 mb-6">
          Nhập <span className="font-medium">email</span> hoặc <span className="font-medium">số điện thoại</span> để tìm bạn bè.
        </p>

        <div className="flex items-center bg-white rounded-full shadow-md overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bạn qua email hoặc số điện thoại..."
            className="flex-1 px-5 py-3 outline-none text-gray-700 placeholder-gray-400"
          />
          <button
            onClick={onSearch}
            disabled={loading}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 transition text-white flex items-center gap-2 font-medium"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Đang tìm...' : 'Tìm'}
          </button>
        </div>
      </motion.div>

      {/* Popup kết quả hiển thị giữa màn hình */}
      <AnimatePresence>
        {result && (
          <motion.div
            key="popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 z-50"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 p-8 w-full max-w-md"
            >
              <button
                onClick={() => setResult(null)}
                className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-span-1 flex justify-center">
                  <motion.img
                    src={getAvatarUrl(result.avatarUrl)}
                    alt="avatar"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="w-28 h-28 rounded-full shadow-lg border-4 border-white object-cover"
                  />
                </div>
                <div className="col-span-2">
                  <h3 className="text-2xl font-semibold text-gray-800">{result.name}</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <div><span className="font-medium">Liên hệ:</span> {result.email || result.phone || '—'}</div>
                    <div className="mt-1"><span className="font-medium">Giới tính:</span> {result.gender || '—'}</div>
                    <div className="mt-1"><span className="font-medium">Sinh nhật:</span> {formatBirthday(result.birthday)}</div>
                  </div>

                  <div className="mt-4">
                    {requestStatus === 'none' && (
                      <div>
                        {!showInviteForm ? (
                          <div className="flex gap-2 items-center">
                            <button onClick={() => setShowInviteForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-all">
                              <UserPlus2 className="w-5 h-5" />
                              <span>Thêm bạn</span>
                            </button>
                            <MessageButton />
                          </div>
                        ) : (
                          <div>
                            <textarea
                              value={inviteMessage}
                              onChange={(e) => setInviteMessage(e.target.value)}
                              placeholder="Viết lời nhắn kèm (tùy chọn)..."
                              className="w-full mt-2 p-2 border rounded-md text-sm placeholder-gray-400"
                              rows={3}
                            />
                            <div className="mt-3 flex gap-2 items-center">
                              <button disabled={requestLoading} onClick={async () => { await onSendRequest(); setShowInviteForm(false); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-all">
                                <UserPlus2 className="w-5 h-5" />
                                <span>{requestLoading ? 'Đang gửi...' : 'Gửi lời mời'}</span>
                              </button>
                              <button onClick={() => { setShowInviteForm(false); setInviteMessage(''); }} className="px-4 py-2 rounded-full border">Hủy</button>
                              <MessageButton />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {requestStatus === 'sent' && (
                      <div className="flex gap-2 items-center">
                        <button onClick={onCancelRequest} disabled={requestLoading} className="px-4 py-2 rounded-full border border-red-200 text-red-600">Thu hồi lời mời</button>
                      </div>
                    )}

                    {requestStatus === 'friend' && (
                      <div className="flex gap-2 items-center">
                        <button disabled className="px-4 py-2 rounded-full bg-green-50 text-green-700">Bạn bè</button>
                        <MessageButton />
                      </div>
                    )}

                    {requestStatus === 'received' && (
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!requestId) return;
                            try {
                              setRequestLoading(true);
                              await friendshipService.acceptFriendRequest(requestId);
                              setRequestStatus('friend');
                              setRequestId(null);
                              showSuccess('Đã chấp nhận', `${result.name || 'Người dùng'} đã được thêm vào bạn bè`);
                            } catch (err) {
                              console.error('Accept error', err);
                              showError('Không thể chấp nhận', err?.response?.data?.message || err?.message || 'Xảy ra lỗi');
                            } finally {
                              setRequestLoading(false);
                            }
                          }}
                          disabled={requestLoading}
                          className="px-4 py-2 rounded bg-white border"
                        >
                          {requestLoading ? 'Đang...' : 'Chấp nhận'}
                        </button>
                        <button
                          onClick={async () => {
                            if (!requestId) return;
                            try {
                              setRequestLoading(true);
                              await friendshipService.deleteRequest(requestId);
                              setRequestStatus('none');
                              setRequestId(null);
                              showSuccess('Đã từ chối', `Đã từ chối lời mời từ ${result.name || 'Người dùng'}`);
                            } catch (err) {
                              console.error('Reject error', err);
                              showError('Không thể từ chối', err?.response?.data?.message || err?.message || 'Xảy ra lỗi');
                            } finally {
                              setRequestLoading(false);
                            }
                          }}
                          disabled={requestLoading}
                          className="px-4 py-2 rounded bg-red-50 text-red-600"
                        >
                          {requestLoading ? 'Đang...' : 'Từ chối'}
                        </button>
                      </div>
                    )}
                    
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Show profile popup if user searched for themselves */}
      {showProfilePopup && (
        <PopupInfor isOpen={showProfilePopup} onClose={() => setShowProfilePopup(false)} />
      )}
    </div>
  );
} 