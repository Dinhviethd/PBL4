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

// Helper function to generate group avatar display (first letter)
const getGroupAvatarDisplay = (groupName = '') => {
  // Returns an SVG with the first letter (or colored circle)
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2360A5FA'/%3E%3Ctext x='50' y='65' font-size='40' font-weight='bold' fill='white' text-anchor='middle'%3E${groupName.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
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
    _groups,
    onlineUsers,
    getConversationKey
  } = useChatStore();

  const filteredConversations = conversations.filter(conv =>
    conv.type === 'private'
      ? conv.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      : conv.group?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConversationClick = (conversation) => {
    // console.log('Clicked conversation:', conversation);
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
            // Use unreadCount from conversation object (API) instead of store
            const unreadCount = conversation.unreadCount || 0;

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
                        : getGroupAvatarDisplay(conversation.group?.name || 'G')
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
                   Array.isArray(onlineUsers) &&
                   onlineUsers.includes(conversation.partnerId) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-gray-900 truncate flex-1">
                      {conversation.type === 'private' 
                        ? conversation.partner?.name || 'Unknown User'
                        : conversation.group?.name || 'Unknown Group'
                      }
                    </h3>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Time */}
                      <span className="text-xs text-gray-500 whitespace-nowrap">
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
                    <p className={`text-sm truncate flex-1 ${
                      unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                    }`}>
                      {conversation.lastMessage || 
                       (conversation.type === 'group' ? 'Nhóm đã được tạo' : 'Bắt đầu cuộc trò chuyện')
                      }
                    </p>
                    
                    {/* Unread badge with count */}
                    {unreadCount > 0 && (
                      <Badge 
                        className="ml-2 px-2 py-0.5 text-xs rounded-full min-w-[20px] h-5 bg-red-500 hover:bg-red-600 text-white border-0"
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