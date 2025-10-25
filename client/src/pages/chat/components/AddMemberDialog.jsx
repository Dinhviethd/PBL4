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
import { toast } from "sonner"
import { Search, UserPlus, Check, X } from 'lucide-react';
import groupService from '@/services/group.service';
import userService from '@/services/user.service';

export const AddMemberDialog = ({ open, onClose, group }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  

  // Load group members and pending members when dialog opens
  useEffect(() => {
    if (open && group) {
      loadGroupData();
    }
  }, [open, group]);

  // Search users when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadGroupData = async () => {
    try {
      setIsLoading(true);
      const [membersResponse, pendingResponse] = await Promise.all([
        groupService.getGroupMembers(group.idGroup),
        groupService.getPendingMembers(group.idGroup)
      ]);
      
      setGroupMembers(membersResponse.data || []);
      setPendingMembers(pendingResponse.data || []);
    } catch (error) {
      console.error('Failed to load group data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setIsSearching(true);
      // Assuming we have a user search endpoint
      const response = await userService.searchUsers(searchQuery);
      
      // Filter out users already in group
      const memberIds = groupMembers.map(m => m.idUser);
      const pendingIds = pendingMembers.map(m => m.idUser);
      const excludedIds = [...memberIds, ...pendingIds];
      
      const filteredResults = response.data.filter(
        user => !excludedIds.includes(user.idUser)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (user) => {
    try {
      await groupService.addMember(group.idGroup, user.idUser);
      
      // Remove from search results
      setSearchResults(prev => prev.filter(u => u.idUser !== user.idUser));
      
      // Reload group data to update lists
      loadGroupData();
      
      toast({
        title: 'Thành công',
        description: `Đã thêm ${user.name} vào nhóm`,
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể thêm thành viên',
        variant: 'destructive',
      });
    }
  };

  const handleApproveMember = async (user) => {
    try {
      await groupService.approveMember(group.idGroup, user.idUser);
      
      // Reload group data
      loadGroupData();
      
      toast({
        title: 'Thành công',
        description: `Đã duyệt ${user.name} vào nhóm`,
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể duyệt thành viên',
        variant: 'destructive',
      });
    }
  };

  const handleRejectMember = async (user) => {
    try {
      await groupService.kickMember(group.idGroup, user.idUser);
      
      // Reload group data
      loadGroupData();
      
      toast({
        title: 'Thành công',
        description: `Đã từ chối ${user.name}`,
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể từ chối thành viên',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Quản lý thành viên - {group.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-2">
            <Label>Tìm kiếm người dùng</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập email hoặc tên người dùng..."
                className="pl-10"
              />
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <ScrollArea className="max-h-48 border rounded-md p-2">
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.idUser}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback>
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMember(user)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Thêm
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {isSearching && (
              <p className="text-sm text-gray-500">Đang tìm kiếm...</p>
            )}
          </div>

          {/* Pending Members Section */}
          {pendingMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Yêu cầu chờ duyệt ({pendingMembers.length})</Label>
              <ScrollArea className="max-h-48 border rounded-md p-2">
                <div className="space-y-2">
                  {pendingMembers.map((member) => (
                    <div
                      key={member.user.idUser}
                      className="flex items-center justify-between p-2 bg-yellow-50 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.user.avatarUrl} />
                          <AvatarFallback>
                            {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.user?.name}</p>
                          <p className="text-xs text-gray-500">{member.user?.email}</p>
                          {member.addedBy && (
                            <p className="text-xs text-blue-600">
                              Được mời bởi: {member.addedBy.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleApproveMember(member)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleRejectMember(member)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Current Members Section */}
          <div className="space-y-2">
            <Label>Thành viên hiện tại ({groupMembers.length})</Label>
            <ScrollArea className="max-h-48 border rounded-md p-2">
              <div className="space-y-2">
                {groupMembers.map((member) => (
                  <div
                    key={member.user.idUser}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.user.avatarUrl} />
                        <AvatarFallback>
                          {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.user?.name}</p>
                        <p className="text-xs text-gray-500">{member.user?.email}</p>
                      </div>
                    </div>
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};