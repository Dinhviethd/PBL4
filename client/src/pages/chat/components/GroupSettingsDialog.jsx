import React, { useState, useEffect } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import Button from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotification } from "@/hooks/useNotification";
import {
  Users,
  UserPlus,
  Settings,
  Edit3,
  Trash2,
  LogOut,
  Save,
  X,
  Crown,
  UserCheck,
  UserX,
  Clock,
  Calendar
} from 'lucide-react';
import groupService from '@/services/group.service';
import userService from '@/services/user.service';
import useChatStore from '@/zustand/chatStore';
import { getAvatarUrl } from '@/lib/utils';
import useAuthStore from '@/zustand/authStore';
// import { P } from 'framer-motion/dist/types.d-BJcRxCew';

export const GroupSettingsDialog = ({ open, onClose, group }) => {
  const { showSuccess, showError } = useNotification();
    const [inviteMessages, setInviteMessages] = useState({}); // { userId: message }
  const [isEditingName, setIsEditingName] = useState(false);
  // Luôn lấy tên nhóm mới nhất từ store nếu có conversation/group cập nhật
  const { conversations } = useChatStore();
  const currentConversation = conversations.find(conv => conv.type === 'group' && conv.groupId === group?.idGroup);
  const latestGroupName = currentConversation?.group?.name || group?.name || '';
  const [groupName, setGroupName] = useState(latestGroupName);
  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  // const [showInviteSection, setShowInviteSection] = useState(false); // Removed unused variable
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'members', 'invite', 'actions'

  const { user } = useAuthStore();
  const { updateGroup, removeGroup, groups } = useChatStore();

  // Get current user's role in this group
  const userRole = groups.find(g => g.idGroup === group?.idGroup)?.role;
  const isAdmin = userRole === 'admin';


  const loadGroupData = React.useCallback(async () => {
    if (!group) return;
    setIsLoading(true);
    try {
      // Load members
      const membersResponse = await groupService.getGroupMembers(group.idGroup);
      setMembers(membersResponse.data || []);
      // Load pending members (optional, nếu có lỗi thì bỏ qua)
      try {
        const pendingResponse = await groupService.getPendingMembers(group.idGroup);
        setPendingMembers(pendingResponse.data || []);
      } catch (pendingError) {
        console.log(pendingError)
        setPendingMembers([]);
      }
    } catch (error) {
      console.error('❌ Failed to load group data:', error);
      showError('Lỗi', 'Không thể tải thông tin nhóm');
    } finally {
      setIsLoading(false);
    }
  }, [group, showError]);

  const searchUsers = React.useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await userService.searchUsers(searchQuery.trim());
      const users = response.data || [];
      setSearchResults(users);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      // Hiển thị thông báo lỗi nếu cần
      if (error.message && error.message !== "Failed to search users") {
        showError('Lỗi tìm kiếm', error.message);
      }
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, members, pendingMembers, user, showError]);

  useEffect(() => {
    if (open && group) {
      // Luôn cập nhật groupName từ store/conversation khi dialog mở hoặc group thay đổi
      setGroupName(latestGroupName);
      loadGroupData();
    }
  }, [open, group, latestGroupName, loadGroupData]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchUsers]);

  const handleUpdateGroupName = async () => {
    if (!groupName.trim() || groupName === group.name) {
      setIsEditingName(false);
      return;
    }
    setIsLoading(true);
    try {
      await groupService.updateGroup(group.idGroup, { name: groupName.trim() });
      
      updateGroup(group.idGroup, { name: groupName.trim() });
      
      showSuccess('Thành công', 'Tên nhóm đã được cập nhật');
      
      setIsEditingName(false);
    } catch (error) {
      console.error('Update group name error:', error);
      showError('Lỗi', 'Không thể cập nhật tên nhóm');
      setGroupName(group.name); // Reset to original name
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUserToGroup = async (userId) => {
    // Check if user is already a member hoặc có pending
    const memberIds = members.map(m => m.user?.idUser || m.idUser);
    const pendingIds = pendingMembers.map(p => p.user?.idUser || p.idUser);
    if (memberIds.includes(userId)) {
      showError('Lỗi', 'Người dùng đã là thành viên của nhóm');
      return;
    }
    if (pendingIds.includes(userId)) {
      showError('Lỗi', 'Người dùng đã có lời mời vào nhóm đang chờ duyệt');
      return;
    }
    setIsLoading(true);
    try {
      const message = inviteMessages[userId] || '';
      await groupService.inviteUserToGroup(group.idGroup, userId, message);
      showSuccess('Thành công', 'Đã gửi lời mời vào nhóm');
      loadGroupData();
      setSearchQuery('');
      setSearchResults([]);
      setInviteMessages((prev) => ({ ...prev, [userId]: '' }));
    } catch (error) {
      console.error('Add member error:', error);
      showError('Lỗi', error.message || 'Không thể thêm thành viên');
    } finally {
      setIsLoading(false);
    }
  };


  // Kick member confirmation dialog state
  const [kickMemberId, setKickMemberId] = useState(null);
  const [showKickConfirm, setShowKickConfirm] = useState(false);

  const handleKickMember = (userId) => {
    setKickMemberId(userId);
    setShowKickConfirm(true);
  };

  const confirmKickMember = async () => {
    if (!kickMemberId) return;
    setIsLoading(true);
    try {
      await groupService.kickMember(group.idGroup, kickMemberId);
      showSuccess('Thành công', 'Thành viên đã bị kick khỏi nhóm');
      loadGroupData();
    } catch (error) {
      console.error('Kick member error:', error);
      showError('Lỗi', 'Không thể kick thành viên');
    } finally {
      setIsLoading(false);
      setShowKickConfirm(false);
      setKickMemberId(null);
    }
  };

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const handleLeaveGroup = async () => {
    setShowLeaveConfirm(true);
  };
  const confirmLeaveGroup = async () => {
    setIsLoading(true);
    try {
      await groupService.leaveGroup(group.idGroup);
      removeGroup(group.idGroup);
      showSuccess('Thành công', 'Bạn đã rời khỏi nhóm');
      onClose();
    } catch (error) {
      console.error('Leave group error:', error);
      showError('Lỗi', 'Không thể rời nhóm');
    } finally {
      setIsLoading(false);
      setShowLeaveConfirm(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleDeleteGroup = async () => {
    setShowDeleteConfirm(true);
  };
  const confirmDeleteGroup = async () => {
    setIsLoading(true);
    try {
      await groupService.deleteGroup(group.idGroup);
      removeGroup(group.idGroup);
      showSuccess('Thành công', 'Nhóm đã được xóa');
      onClose();
    } catch (error) {
      console.error('Delete group error:', error);
      showError('Lỗi', 'Không thể xóa nhóm');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleClose = () => {
    setIsEditingName(false);
    setGroupName(group?.name || '');
    setSearchQuery('');
    setSearchResults([]);
    // setShowInviteSection(false); 
    onClose();
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-screen overflow-y-auto flex flex-col">
        {/* Header với gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 -mx-6 -mt-6 px-6 py-5 mb-4">
          <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Thông tin nhóm
          </DialogTitle>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          <Button variant={activeTab === 'info' ? 'default' : 'ghost'} onClick={() => setActiveTab('info')} className={activeTab === 'info' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}>
            <Settings className="w-4 h-4 mr-1" /> Thông tin nhóm
          </Button>
          <Button variant={activeTab === 'members' ? 'default' : 'ghost'} onClick={() => setActiveTab('members')} className={activeTab === 'members' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}>
            <Users className="w-4 h-4 mr-1" /> Thành viên
          </Button>
          <Button variant={activeTab === 'invite' ? 'default' : 'ghost'} onClick={() => setActiveTab('invite')} className={activeTab === 'invite' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}>
            <UserPlus className="w-4 h-4 mr-1" /> Mời thành viên
          </Button>
          <Button variant={activeTab === 'actions' ? 'default' : 'ghost'} onClick={() => setActiveTab('actions')} className={activeTab === 'actions' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}>
            <LogOut className="w-4 h-4 mr-1" /> Hành động
          </Button>
        </div>

        <ScrollArea className="flex-1 px-1 max-h-[calc(85vh-180px)] overflow-visible">
          <div className="space-y-6 pr-4 pb-4">
            {/* Tab content */}
            {activeTab === 'info' && (
              <div className="bg-white rounded-xl border-2 border-gray-100 p-5 shadow-sm">
                {/* ...Thông tin nhóm như cũ... */}
                <div className="flex items-start gap-4">
                  <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                    <AvatarImage src={getAvatarUrl(group.avatarUrl)} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white">
                      <Users className="w-10 h-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    {isEditingName ? (
                      <div className="flex items-center gap-2 mb-2">
                        <Input value={groupName} onChange={e => setGroupName(e.target.value)} className="text-lg font-bold" placeholder="Tên nhóm" autoFocus />
                        <Button size="sm" onClick={handleUpdateGroupName} disabled={isLoading} className="bg-green-500 hover:bg-green-600"><Save className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => { setIsEditingName(false); setGroupName(latestGroupName); }}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{latestGroupName}</h3>
                        {isAdmin && (
                          <Button size="sm" variant="ghost" onClick={() => setIsEditingName(true)} className="h-7 w-7 p-0"><Edit3 className="w-4 h-4 text-blue-500" /></Button>
                        )}
                      </div>
                    )}
                    <div className="flex flex-col gap-1 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{members.length} thành viên</span>
                        <span>•</span>
                        <span>Tạo bởi {group.createdBy?.name || "Bạn"}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Ngày tạo: {group.createdAt ? new Date(group.createdAt).toLocaleDateString('vi-VN') : "Không xác định"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'members' && (
              <div className="bg-white rounded-xl border-2 border-gray-100 p-5 shadow-sm overflow-visible">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-blue-500" />Thành viên ({members.length})</h4>
                <div className="max-h-56 overflow-y-auto space-y-3 pr-2 mb-4">
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Đang tải...</div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">Chưa có thành viên</div>
                  ) : (
                    members.map((member, index) => {
                      const isCurrentUser = member.idUser === user?.idUser;
                      const memberIsAdmin = member.role === 'admin';
                      return (
                        <div
                          key={member.idUser || member.id || index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm hover:bg-blue-50 transition-all"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="w-11 h-11 border-2 border-gray-100">
                              <AvatarImage src={getAvatarUrl(member.avatarUrl)} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white font-semibold">
                                {member.name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-gray-900 truncate text-base">{member.name || 'Unknown'}</p>
                                {isCurrentUser && (
                                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">Bạn</Badge>
                                )}
                                {memberIsAdmin && (
                                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs border-0"><Crown className="w-3 h-3 mr-1" />Admin</Badge>
                                )}
                              </div>
                              {member.email && (
                                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                              )}
                            </div>
                          </div>
                          {isAdmin && !isCurrentUser && !memberIsAdmin && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleKickMember(member.idUser)} disabled={isLoading} className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2" title="Xóa thành viên">
                                <UserX className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            {activeTab === 'invite' && (
              <div className="bg-white rounded-xl border-2 border-gray-100 p-5 shadow-sm">
                <Label className="text-sm font-semibold text-gray-700 mb-2">Tìm kiếm người dùng</Label>
                <Input type="text" placeholder="Nhập email hoặc số điện thoại..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border-2 focus:border-blue-400 mb-2" />
                {isSearching && (<div className="text-center py-4 text-gray-500"><div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div><p className="mt-2 text-sm">Đang tìm kiếm...</p></div>)}
                {!isSearching && searchQuery && searchResults.length === 0 && (<div className="text-center py-6 text-gray-500"><Users className="w-12 h-12 mx-auto mb-2 opacity-30" /><p className="text-sm">Không tìm thấy người dùng</p></div>)}
                {searchResults.length > 0 && (
                  <div className="border-2 border-blue-100 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                    {searchResults.map((foundUser) => {
                      const memberIds = members.map(m => m.user?.idUser || m.idUser);
                      const pendingIds = pendingMembers.map(p => p.user?.idUser || p.idUser);
                      const isMember = memberIds.includes(foundUser.idUser);
                      const isPending = pendingIds.includes(foundUser.idUser);
                      return (
                        <div key={foundUser.idUser} className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg transition-colors">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Avatar className="w-9 h-9">
                              <AvatarImage src={getAvatarUrl(foundUser.avatarUrl)} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white text-sm">{foundUser.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{foundUser.name}</p>
                              <p className="text-xs text-gray-500 truncate">{foundUser.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 min-w-[160px]">
                            <Input
                              type="text"
                              placeholder="Lời nhắn (tuỳ chọn)"
                              value={inviteMessages[foundUser.idUser] || ''}
                              onChange={e => setInviteMessages(prev => ({ ...prev, [foundUser.idUser]: e.target.value }))}
                              disabled={isMember || isPending}
                              className="mb-1 text-xs px-2 py-1 h-8 w-36"
                            />
                          <Button
                            size="sm"
                            onClick={() => handleInviteUserToGroup(foundUser.idUser)}
                            disabled={isLoading || isMember || isPending}
                            className={`ml-2 bg-blue-500 hover:bg-blue-600 ${isMember || isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isMember ? 'Đã là thành viên' : isPending ? 'Đã gửi lời mời' : 'Mời'}
                          </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'actions' && (
              <div className="bg-white rounded-xl border-2 border-gray-100 p-5 shadow-sm space-y-3">
                <h4 className="font-bold text-gray-900 mb-3">Hành động</h4>
                {!isAdmin && (
                  <>
                    <Button variant="outline" className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-2 hover:border-orange-300 font-semibold py-6" onClick={handleLeaveGroup} disabled={isLoading}><LogOut className="w-5 h-5 mr-2" />Rời nhóm</Button>
                    <ConfirmDialog
                      open={showLeaveConfirm}
                      title="Xác nhận rời nhóm"
                      description="Bạn có chắc muốn rời khỏi nhóm này?"
                      onConfirm={confirmLeaveGroup}
                      onCancel={() => setShowLeaveConfirm(false)}
                      confirmText="Rời nhóm"
                      cancelText="Hủy"
                    />
                  </>
                )}
                {isAdmin && (
                  <>
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-2 hover:border-red-300 font-semibold py-6" onClick={handleDeleteGroup} disabled={isLoading}><Trash2 className="w-5 h-5 mr-2" />Xóa nhóm</Button>
                    <ConfirmDialog
                      open={showDeleteConfirm}
                      title="Xác nhận xóa nhóm"
                      description="Bạn có chắc muốn xóa nhóm này? Hành động này không thể hoàn tác."
                      onConfirm={confirmDeleteGroup}
                      onCancel={() => setShowDeleteConfirm(false)}
                      confirmText="Xóa nhóm"
                      cancelText="Hủy"
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Kick member confirmation dialog */}
        <ConfirmDialog
          open={showKickConfirm}
          title="Xác nhận kick thành viên"
          description="Bạn có chắc muốn kick thành viên này khỏi nhóm? Hành động này không thể hoàn tác."
          onConfirm={confirmKickMember}
          onCancel={() => { setShowKickConfirm(false); setKickMemberId(null); }}
          confirmText="Kick thành viên"
          cancelText="Hủy"
        />
        {/* Footer */}
        <div className="flex justify-end pt-4 border-t mt-4">
          <Button variant="outline" onClick={handleClose} className="px-6">Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};