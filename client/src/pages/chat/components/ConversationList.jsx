import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Button from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MessageCirclePlus, 
  Users, 
  Plus,
  MoreHorizontal,
  UserPlus,
  Settings,
  LogOut,
  Trash2
} from 'lucide-react';
import { StartConversationDialog } from './StartConversationDialog';
import { GroupSettingsDialog } from './GroupSettingsDialog';
import useChatStore from '@/zustand/chatStore';
import useAuthStore from '@/zustand/authStore';

// Helper function to format time
const formatLastMessageTime = (time) => {
  if (!time) return '';
  
  const messageDate = new Date(time);
  const now = new Date();
  const diffInHours = (now - messageDate) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return messageDate.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffInHours < 24 * 7) {
    return messageDate.toLocaleDateString('vi-VN', { weekday: 'short' });
  } else {
    return messageDate.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  }
};

export const ConversationList = ({ onCreateGroup, onAddMember }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showStartConversation, setShowStartConversation] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    unreadCounts,
    groups,
    onlineUsers,
    getConversationKey
  } = useChatStore();

  const filteredConversations = conversations.filter(conv =>
    conv.type === 'private'
      ? conv.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      : conv.group?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConversationClick = (conversation) => {
    console.log('Clicked conversation:', conversation);
    setActiveConversation(conversation);
  };

  const handleGroupSettings = (group) => {
    setSelectedGroup(group);
    setShowGroupSettings(true);
  };

  const handleGroupAction = (group, action) => {
    console.log('Group action:', action, group);
    
    switch (action) {
      case 'settings':
        handleGroupSettings(group);
        break;
      case 'addMember':
        onAddMember(group);
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Tin nhắn</h1>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStartConversation(true)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <MessageCirclePlus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm cuộc trò chuyện..."
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-gray-100">
          {filteredConversations.map((conversation) => {
            const conversationKey = getConversationKey(conversation);
            const isActive = activeConversation && 
              getConversationKey(activeConversation) === conversationKey;
            const unreadCount = unreadCounts[conversationKey] || 0;

            return (
              <div
                key={conversationKey}
                className={`group flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                  isActive ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
                onClick={() => handleConversationClick(conversation)}
              >
                {/* Avatar */}
                <div className="relative mr-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={conversation.type === 'private' 
                        ? conversation.partner?.avatarUrl 
                        : '/images/group-avatar.png'
                      } 
                    />
                    <AvatarFallback className="bg-gray-200">
                      {conversation.type === 'private' 
                        ? conversation.partner?.name?.charAt(0)?.toUpperCase() || 'U'
                        : <Users className="w-6 h-6 text-gray-500" />
                      }
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Online indicator for private chats */}
                  {conversation.type === 'private' && 
                   onlineUsers.includes(conversation.partnerId) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.type === 'private' 
                        ? conversation.partner?.name || 'Unknown User'
                        : conversation.group?.name || 'Unknown Group'
                      }
                    </h3>
                    
                    <div className="flex items-center space-x-2">
                      {/* Time */}
                      <span className="text-xs text-gray-500">
                        {formatLastMessageTime(conversation.lastMessageTime)}
                      </span>
                      
                      {/* Group actions - THAY ĐỔI: Click vào icon sẽ mở modal settings */}
                      {conversation.type === 'group' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGroupSettings(conversation.group);
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Last message */}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate flex-1">
                      {conversation.lastMessage || 
                       (conversation.type === 'group' ? 'Nhóm đã được tạo' : 'Bắt đầu cuộc trò chuyện')
                      }
                    </p>
                    
                    {/* Unread badge */}
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="ml-2 px-2 py-1 text-xs rounded-full min-w-[20px] h-5"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <MessageCirclePlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">
                {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có cuộc trò chuyện nào'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Dialogs */}
      <StartConversationDialog
        open={showStartConversation}
        onClose={() => setShowStartConversation(false)}
      />
      
      <GroupSettingsDialog
        open={showGroupSettings}
        onClose={() => setShowGroupSettings(false)}
        group={selectedGroup}
      />
    </div>
  );
};