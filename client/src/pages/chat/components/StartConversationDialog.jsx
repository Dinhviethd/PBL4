import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Button from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle } from 'lucide-react';
import userService from '@/services/user.service';
import useChatStore from '@/zustand/chatStore';

export const StartConversationDialog = ({ open, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { addConversation, setActiveConversation } = useChatStore();

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      setIsSearching(true);
      const response = await userService.searchUsers(searchQuery);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartConversation = (user) => {
    const conversation = {
      type: 'private',
      partnerId: user.idUser,
      partner: user,
      lastMessage: null,
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    };

    addConversation(conversation);
    setActiveConversation(conversation);
    
    // Close dialog
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bắt đầu cuộc trò chuyện</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm người dùng..."
              className="pl-10"
            />
          </div>

          {/* Results */}
          <ScrollArea className="max-h-80">
            {isSearching && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Đang tìm kiếm...</p>
              </div>
            )}
            
            {!isSearching && searchResults.length === 0 && searchQuery && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Không tìm thấy người dùng nào</p>
              </div>
            )}
            
            {!isSearching && searchResults.length === 0 && !searchQuery && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nhập tên hoặc email để tìm kiếm</p>
              </div>
            )}

            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.idUser}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => handleStartConversation(user)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
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
                  <Button size="sm" variant="ghost">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};