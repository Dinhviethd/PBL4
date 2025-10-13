import React, { useState, useEffect, useCallback } from "react";
import { Eye, UserX } from "lucide-react";
import { getReceivedRequests, getSentRequests, acceptFriendRequest, deleteRequest } from "@/services/friendShip.service";

const FriendInvites = () => {
  const [activeInviteTab, setActiveInviteTab] = useState("received");
  const [receivedInvites, setReceivedInvites] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 8;
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      if (activeInviteTab === "received") {
        const res = await getReceivedRequests(page, limit);
        setReceivedInvites(res.items || []);
        setTotal(res.total || 0);
      } else {
        const res = await getSentRequests(page, limit);
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

  const handleAccept = async (requestId) => {
    setActionLoading(true);
    try {
      await acceptFriendRequest(requestId);
      await fetchInvites();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    setActionLoading(true);
    try {
      await deleteRequest(requestId);
      await fetchInvites();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  };

  const renderAvatar = (invite) => {
    const user = activeInviteTab === "received" ? invite.sender : (invite.receiver || invite.friend);
    const avatar = user?.avatarUrl;
    const initials = (user?.name || invite.name || "").slice(0, 2).toUpperCase();

    if (avatar) {
      const src = avatar.startsWith("http")
        ? avatar
        : `${import.meta.env.VITE_API_URL.replace("/api", "")}${avatar}`;
      return (
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={src}
            alt={user?.name || "Avatar"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "";
            }}
          />
        </div>
      );
    }

    return (
      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-lg font-medium text-blue-700 flex-shrink-0">
        {initials || "?"}
      </div>
    );
  };

  const invitesData = activeInviteTab === "received" ? receivedInvites : sentInvites;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Lời mời kết bạn</h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveInviteTab("sent")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeInviteTab === "sent"
              ? "bg-blue-100 text-blue-600"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Lời mời đã gửi
        </button>
        <button
          onClick={() => setActiveInviteTab("received")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeInviteTab === "received"
              ? "bg-blue-100 text-blue-600"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Lời mời đã nhận
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-600">Đang tải...</p>
        ) : invitesData.length === 0 ? (
        <div className="flex items-center justify-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <UserX className="w-6 h-6 text-gray-400 mr-2" />
            <p className="text-gray-500 text-sm">Không có lời mời nào.</p>
        </div>
        ) : (
        <div className="space-y-4">
            {invitesData.map((invite) => (
            <div
                key={invite.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
                <div className="flex items-center gap-4">
                {renderAvatar(invite)}
                <div>
                    <p className="text-lg font-medium text-gray-800">
                    {invite.sender?.name || invite.name || invite.receiver?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                    {formatDateTime(invite.requestAt || invite.time || invite.createdAt)}
                    </p>
                    {invite.message && (
                    <p className="text-sm text-gray-600 mt-1">{invite.message}</p>
                    )}
                </div>
                </div>

                <div className="flex flex-col gap-2">
                {activeInviteTab === "received" ? (
                    <>
                    <button
                        onClick={() => handleDeleteRequest(invite.id)}
                        disabled={actionLoading}
                        className="text-sm text-gray-600 bg-gray-100 px-4 py-1.5 rounded hover:bg-gray-200 transition-colors"
                    >
                        Từ chối
                    </button>
                    <button
                        onClick={() => handleAccept(invite.id)}
                        disabled={actionLoading}
                        className="text-sm text-white bg-blue-500 px-4 py-1.5 rounded hover:bg-blue-600 transition-colors"
                    >
                        Chấp nhận
                    </button>
                    </>
                ) : (
                    <button
                    onClick={() => handleDeleteRequest(invite.id)}
                    disabled={actionLoading}
                    className="text-sm text-gray-600 bg-gray-100 px-4 py-1.5 rounded hover:bg-gray-200 transition-colors"
                    >
                    Thu hồi
                    </button>
                )}
                </div>
            </div>
            ))}
        </div>
        )}


      {/* Pagination */}
      {total > limit && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            className="px-3 py-1 border rounded hover:bg-gray-100 transition-colors"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Trang {page} / {totalPages}
          </span>
          <button
            className="px-3 py-1 border rounded hover:bg-gray-100 transition-colors"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default FriendInvites;
