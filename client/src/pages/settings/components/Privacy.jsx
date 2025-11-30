import React, { useEffect, useState } from "react";
import { getBlockedList, unblockFriend } from "@/services/friendShip.service";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const Privacy = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
    const handleUnblock = async (user) => {
      setSelectedUser(user);
      setDialogOpen(true);
    };

    const fetchBlocked = async () => {
      setLoading(true);
      try {
        const users = await getBlockedList();
        console.log("Blocked users:", users);
        setBlockedUsers(users);
      } catch (err) {
        console.log("Error fetching blocked users:", err);
        setBlockedUsers([]);
      }
      setLoading(false);
    };

    const confirmUnblock = async () => {
      if (!selectedUser) return;
      try {
        console.log("Unblocking user:", selectedUser);
        await unblockFriend(selectedUser.id);
        await fetchBlocked();
      } catch (err) {
        console.log("Error unblocking user:", err);
      }
      setDialogOpen(false);
      setSelectedUser(null);
    };

    const cancelUnblock = () => {
      setDialogOpen(false);
      setSelectedUser(null);
    };
  useEffect(() => {
    fetchBlocked();
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold mb-4">Danh sách đã chặn</h2>
      {loading ? (
        <div className="text-gray-500">Đang tải...</div>
      ) : blockedUsers.length === 0 ? (
        <div className="text-gray-500">Bạn chưa chặn ai.</div>
      ) : (
        <>
          <ul className="space-y-3">
            {blockedUsers.map((user) => (
              <li key={user.id} className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-2">
                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                <span className="font-medium">{user.name}</span>
                <span className="text-sm text-gray-400">{user.email}</span>
                <button
                  className="ml-auto px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  onClick={() => handleUnblock(user)}
                >
                  Gỡ chặn
                </button>
              </li>
            ))}
          </ul>
          <ConfirmDialog
            open={dialogOpen}
            title="Xác nhận gỡ chặn"
            description={selectedUser ? `Bạn có chắc muốn gỡ chặn ${selectedUser.name}?` : ""}
            onConfirm={confirmUnblock}
            onCancel={cancelUnblock}
          />
        </>
      )}
    </div>
  );
};

export default Privacy;
