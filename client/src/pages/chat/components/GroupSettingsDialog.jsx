import React, { useState, useEffect } from 'react';
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
import { toast } from "sonner";
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

export const GroupSettingsDialog = ({ open, onClose, group }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'members', 'invite', 'actions'

  const { user } = useAuthStore();
  const { updateGroup, removeGroup, groups } = useChatStore();

  // Get current user's role in this group
  const userRole = groups.find(g => g.idGroup === group?.idGroup)?.role;
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (open && group) {
      setGroupName(group.name);
      loadGroupData();
    }
  }, [open, group]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadGroupData = async () => {
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
        console.log('⚠️ No pending members API or error:', pendingError);
        setPendingMembers([]);
      }
    } catch (error) {
      console.error('❌ Failed to load group data:', error);
      toast.error('Lỗi', {
        description: 'Không thể tải thông tin nhóm'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await userService.searchUsers(searchQuery.trim());
      const users = response.data || [];
      
      // Filter out users who are already members or pending
      const memberIds = members.map(m => m.user?.idUser || m.idUser);
      const pendingIds = pendingMembers.map(p => p.user?.idUser || p.idUser);
      const currentUserId = user?.idUser;
      
      const filteredUsers = users.filter(u => 
        !memberIds.includes(u.idUser) && 
        !pendingIds.includes(u.idUser) &&
        u.idUser !== currentUserId
      );
      
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      
      // Hiển thị thông báo lỗi nếu cần
      if (error.message && error.message !== "Failed to search users") {
        toast.error('Lỗi tìm kiếm', {
          description: error.message
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!groupName.trim() || groupName === group.name) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await groupService.updateGroup(group.idGroup, { name: groupName.trim() });
      
      updateGroup(group.idGroup, { name: groupName.trim() });
      
      toast.success('Thành công', {
        description: 'Tên nhóm đã được cập nhật'
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Update group name error:', error);
      toast.error('Lỗi', {
        description: 'Không thể cập nhật tên nhóm'
      });
      setGroupName(group.name); // Reset to original name
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUserToGroup = async (userId) => {
    setIsLoading(true);
    try {
      await groupService.inviteUserToGroup(group.idGroup, userId);
      
      loadGroupData();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Add member error:', error);
      toast.error('Lỗi', {
        description: error.message || 'Không thể thêm thành viên'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveMember = async (userId) => {
    setIsLoading(true);
    try {
      await groupService.approveMember(group.idGroup, userId);
      
      toast.success('Thành công', {
        description: 'Thành viên đã được duyệt'
      });
      
      loadGroupData();
    } catch (error) {
      console.error('Approve member error:', error);
      toast.error('Lỗi', {
        description: 'Không thể duyệt thành viên'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKickMember = async (userId) => {
    if (!confirm('Bạn có chắc muốn kick thành viên này khỏi nhóm?')) return;
    
    setIsLoading(true);
    try {
      await groupService.kickMember(group.idGroup, userId);
      
      toast.success('Thành công', {
        description: 'Thành viên đã bị kick khỏi nhóm'
      });
      
      loadGroupData();
    } catch (error) {
      console.error('Kick member error:', error);
      toast.error('Lỗi', {
        description: 'Không thể kick thành viên'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Bạn có chắc muốn rời khỏi nhóm này?')) return;
    
    setIsLoading(true);
    try {
      await groupService.leaveGroup(group.idGroup);
      
      removeGroup(group.idGroup);
      
      toast.success('Thành công', {
        description: 'Bạn đã rời khỏi nhóm'
      });
      
      onClose();
    } catch (error) {
      console.error('Leave group error:', error);
      toast.error('Lỗi', {
        description: 'Không thể rời nhóm'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Bạn có chắc muốn xóa nhóm này? Hành động này không thể hoàn tác.')) return;
    
    setIsLoading(true);
    try {
      await groupService.deleteGroup(group.idGroup);
      
      removeGroup(group.idGroup);
      
      toast.success('Thành công', {
        description: 'Nhóm đã được xóa'
      });
      
      onClose();
    } catch (error) {
      console.error('Delete group error:', error);
      toast.error('Lỗi', {
        description: 'Không thể xóa nhóm'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsEditingName(false);
    setGroupName(group?.name || '');
    setSearchQuery('');
    setSearchResults([]);
    setShowInviteSection(false);
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
                        <Button size="sm" variant="outline" onClick={() => { setIsEditingName(false); setGroupName(group.name); }}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
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
                            <Button size="sm" variant="ghost" onClick={() => handleKickMember(member.idUser)} disabled={isLoading} className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2" title="Xóa thành viên">
                              <UserX className="w-4 h-4" />
                            </Button>
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
                {searchResults.length > 0 && (<div className="border-2 border-blue-100 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">{searchResults.map((foundUser) => (<div key={foundUser.idUser} className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg transition-colors"><div className="flex items-center gap-2 flex-1 min-w-0"><Avatar className="w-9 h-9"><AvatarImage src={getAvatarUrl(foundUser.avatarUrl)} /><AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white text-sm">{foundUser.name?.charAt(0)?.toUpperCase()}</AvatarFallback></Avatar><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{foundUser.name}</p><p className="text-xs text-gray-500 truncate">{foundUser.email}</p></div></div><Button size="sm" onClick={() => handleInviteUserToGroup(foundUser.idUser)} disabled={isLoading} className="ml-2 bg-blue-500 hover:bg-blue-600">Mời</Button></div>))}</div>)}
              </div>
            )}
            {activeTab === 'actions' && (
              <div className="bg-white rounded-xl border-2 border-gray-100 p-5 shadow-sm space-y-3">
                <h4 className="font-bold text-gray-900 mb-3">Hành động</h4>
                <Button variant="outline" className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-2 hover:border-orange-300 font-semibold py-6" onClick={handleLeaveGroup} disabled={isLoading}><LogOut className="w-5 h-5 mr-2" />Rời nhóm</Button>
                {isAdmin && (<Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-2 hover:border-red-300 font-semibold py-6" onClick={handleDeleteGroup} disabled={isLoading}><Trash2 className="w-5 h-5 mr-2" />Xóa nhóm</Button>)}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t mt-4">
          <Button variant="outline" onClick={handleClose} className="px-6">Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};