import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Button from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Clock
} from 'lucide-react';
import groupService from '@/services/group.service';
import userService from '@/services/user.service';
import useChatStore from '@/zustand/chatStore';
import useAuthStore from '@/zustand/authStore';

export const GroupSettingsDialog = ({ open, onClose, group }) => {
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'members', 'pending'
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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
      const [membersResponse, pendingResponse] = await Promise.all([
        groupService.getGroupMembers(group.idGroup),
        groupService.getPendingMembers(group.idGroup)
      ]);
      
      setMembers(membersResponse.data || []);
      setPendingMembers(pendingResponse.data || []);
    } catch (error) {
      console.error('Failed to load group data:', error);
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
      const response = await userService.searchUsers(searchQuery);
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

  const handleAddMember = async (userId) => {
    setIsLoading(true);
    try {
      await groupService.addMember(group.idGroup, userId);
      
      toast.success('Thành công', {
        description: 'Đã gửi lời mời tham gia nhóm'
      });
      
      // Refresh data
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
    setActiveTab('info');
    setIsEditing(false);
    setGroupName(group?.name || '');
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Cài đặt nhóm
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('info')}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Thông tin
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('members')}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Thành viên ({members.length})
          </button>
          {isAdmin && pendingMembers.length > 0 && (
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Chờ duyệt ({pendingMembers.length})
            </button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {/* Group Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6 p-4">
              {/* Group Avatar & Name */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="/images/group-avatar.png" />
                  <AvatarFallback>
                    <Users className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="text-lg font-semibold"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleUpdateGroupName} disabled={isLoading}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsEditing(false);
                        setGroupName(group.name);
                      }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold">{group.name}</h3>
                      {isAdmin && (
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    Tạo bởi {group.createdBy?.name} • {members.length} thành viên
                  </p>
                </div>
              </div>

              <Separator />

              {/* Group Actions */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Hành động</h4>
                
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('members')}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Thêm thành viên
                    </Button>
                    
                    {pendingMembers.length > 0 && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setActiveTab('pending')}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Duyệt thành viên ({pendingMembers.length})
                      </Button>
                    )}
                  </>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-start text-orange-600 hover:text-orange-700"
                  onClick={handleLeaveGroup}
                  disabled={isLoading}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Rời nhóm
                </Button>

                {isAdmin && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={handleDeleteGroup}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa nhóm
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4 p-4">
              {/* Add Member Search */}
              {isAdmin && (
                <div className="space-y-3">
                  <Label>Thêm thành viên mới</Label>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm người dùng..."
                  />
                  
                  {searchResults.length > 0 && (
                    <div className="border rounded-lg p-2 max-h-32 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div key={user.idUser} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatarUrl} />
                              <AvatarFallback>{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{user.name}</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddMember(user.idUser)}
                            disabled={isLoading}
                          >
                            Mời
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Separator />
                </div>
              )}

              {/* Current Members */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Thành viên hiện tại</h4>
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.user?.avatarUrl} />
                        <AvatarFallback>
                          {member.user?.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user?.name}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                            {member.role === 'admin' ? (
                              <>
                                <Crown className="w-3 h-3 mr-1" />
                                Quản trị viên
                              </>
                            ) : (
                              'Thành viên'
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {isAdmin && member.role !== 'admin' && member.user?.idUser !== user?.idUser && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleKickMember(member.user?.idUser)}
                        disabled={isLoading}
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Members Tab */}
          {activeTab === 'pending' && isAdmin && (
            <div className="space-y-4 p-4">
              <h4 className="font-medium text-gray-900">Thành viên chờ duyệt</h4>
              {pendingMembers.map((pendingMember) => (
                <div key={pendingMember.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={pendingMember.user?.avatarUrl} />
                      <AvatarFallback>
                        {pendingMember.user?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{pendingMember.user?.name}</p>
                      <p className="text-sm text-gray-500">
                        Được mời bởi {pendingMember.actionBy?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveMember(pendingMember.user?.idUser)}
                      disabled={isLoading}
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleKickMember(pendingMember.user?.idUser)}
                      disabled={isLoading}
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {pendingMembers.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Không có thành viên nào chờ duyệt
                </p>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};