import React, { useState, useEffect, useRef } from "react";
import ChatPrivateSettingsDialog from "@/pages/chat/components/ChatPrivateSettingsDialog";
import { Search, MoreHorizontal, Eye, UserX, Ban, ChevronDown } from "lucide-react";
import { getFriends, deleteFriendship, blockFriend } from "@/services/friendShip.service";

const FriendsList = () => {
  const [friendsData, setFriendsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 15;
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBlock, setConfirmBlock] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Đóng dialog khi click ngoài
  useEffect(() => {
    if (!isDialogOpen) return;
    const handleClickOutsideDialog = (event) => {
      const dialog = document.getElementById("chat-private-settings-dialog");
      if (dialog && !dialog.contains(event.target)) {
        setIsDialogOpen(false);
        setSelectedFriend(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideDialog);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideDialog);
    };
  }, [isDialogOpen]);

  const deleteRef = useRef();
  const blockRef = useRef();
  const dropdownRef = useRef();

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    return avatar.startsWith("http")
      ? avatar
      : `${import.meta.env.VITE_API_URL.replace("/api", "")}${avatar}`;
  };

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const res = await getFriends(page, limit);
        setFriendsData(res.items || []);
        setTotal(res.total || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [page, limit]);

  const handleDelete = async (friendId) => {
    try {
      await deleteFriendship(friendId);
      setFriendsData((prev) => prev.filter((f) => f.id !== friendId));
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlock = async (friend) => {
    try {
      await blockFriend(friend.id);
      setFriendsData((prev) => prev.filter((f) => f.id !== friend.id));
      setConfirmBlock(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Click outside để đóng popup và dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deleteRef.current && !deleteRef.current.contains(event.target)) {
        setConfirmDelete(null);
      }
      if (blockRef.current && !blockRef.current.contains(event.target)) {
        setConfirmBlock(null);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Danh sách bạn bè ({total})
        </h2>

        {/* Search + Sort */}
        <div className="flex gap-4 mb-6 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Tìm kiếm theo ${searchField}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="name">Tên</option>
              <option value="email">Email</option>
              <option value="phone">Số điện thoại</option>
            </select>

            <button
              title={`Sắp xếp theo ${searchField} (${sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'})`}
              onClick={() => setSortOrder((s) => (s === "asc" ? "desc" : "asc"))}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-transform"
            >
              <ChevronDown
                className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                  sortOrder === "asc" ? "rotate-0" : "rotate-180"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Friends list */}
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="space-y-2">
            {friendsData
              .filter((f) => {
                if (!searchTerm) return true;
                const term = searchTerm.toLowerCase();
                const value = (f[searchField] || "").toString().toLowerCase();
                return value.includes(term);
              })
              .sort((a, b) => {
                const an = (a.name || "").toLowerCase();
                const bn = (b.name || "").toLowerCase();
                if (an < bn) return sortOrder === "asc" ? -1 : 1;
                if (an > bn) return sortOrder === "asc" ? 1 : -1;
                return 0;
              })
              .map((friend) => {
                const avatarUrl = getAvatarUrl(friend.avatarUrl);
                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-purple-100">
                          <img
                            src={avatarUrl}
                            alt={friend.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.parentNode.innerHTML = `<div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">${friend.name[0].toUpperCase()}</div>`;
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">
                          {friend.name[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-gray-800">{friend.name}</span>
                    </div>

                    <div className="relative">
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() =>
                          setOpenDropdown(openDropdown === `friend-${friend.id}` ? null : `friend-${friend.id}`)
                        }
                      >
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                      </button>

                      {openDropdown === `friend-${friend.id}` && (
                        <div ref={dropdownRef} className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-2">
                            <button
                              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => {
                                setSelectedFriend(friend);
                                setIsDialogOpen(true);
                                setOpenDropdown(null);
                              }}
                            >
                              <Eye className="w-5 h-5" />
                              Xem thông tin
                            </button>
                            <button
                              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                              onClick={() => setConfirmDelete(friend)}
                            >
                              <UserX className="w-5 h-5" />
                              Xóa bạn
                            </button>
                            <button
                              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                              onClick={() => setConfirmBlock(friend)}
                            >
                              <Ban className="w-5 h-5" />
                              Chặn
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex justify-end gap-2 mt-4">
            <button
              className="px-3 py-1 border rounded hover:bg-gray-100"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </button>
            <span className="px-3 py-1">{page} / {totalPages}</span>
            <button
              className="px-3 py-1 border rounded hover:bg-gray-100"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Tiếp
            </button>
          </div>
        )}

        {/* Confirm delete popup */}
        {confirmDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div ref={deleteRef} className="bg-white rounded-lg p-6 w-80">
              <h3 className="text-lg font-semibold mb-4">Xác nhận xóa bạn</h3>
              <p className="mb-6">
                Bạn có chắc muốn xóa <span className="font-medium">{confirmDelete.name}</span> khỏi danh sách bạn bè?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                  onClick={() => setConfirmDelete(null)}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  onClick={() => handleDelete(confirmDelete.id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm block popup */}
        {confirmBlock && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div ref={blockRef} className="bg-white rounded-lg p-6 w-80">
              <h3 className="text-lg font-semibold mb-4">Xác nhận chặn bạn</h3>
              <p className="mb-6">
                Bạn có chắc muốn chặn <span className="font-medium">{confirmBlock.name}</span> không?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                  onClick={() => setConfirmBlock(null)}
                >
                  Hủy
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  onClick={() => handleBlock(confirmBlock)}
                >
                  Chặn
                </button>
              </div>
            </div>
          </div>
        )}
      {/* ChatPrivateSettingsDialog */}
      {isDialogOpen && selectedFriend && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div id="chat-private-settings-dialog">
            <ChatPrivateSettingsDialog
              open={isDialogOpen}
              onClose={() => {
                setIsDialogOpen(false);
                setSelectedFriend(null);
              }}
              partner={{ idUser: selectedFriend.id, ...selectedFriend }}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default FriendsList;
